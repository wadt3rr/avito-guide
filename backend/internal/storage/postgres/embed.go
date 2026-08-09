package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/wadt3rr/avito-guide/backend/internal/models"
	"github.com/wadt3rr/avito-guide/backend/internal/storage"
)

func (s *Storage) ResolveScenario(ctx context.Context, req models.ResolveRequest) (*models.Scenario, error) {
	const op = "postgres.Storage.ResolveScenario"

	facts := req.Context
	if facts == nil {
		facts = map[string]string{}
	}

	factsJSON, err := json.Marshal(facts)
	if err != nil {
		return nil, fmt.Errorf("%s: marshal context: %w", op, err)
	}

	var sc models.Scenario
	var rawMatch []byte

	err = s.pool.QueryRow(ctx, `
        SELECT id, title, description, status, published_at, url_pattern, match_context, priority, created_at, updated_at
        FROM scenarios
        WHERE published_at IS NOT NULL
          AND $1 LIKE replace(url_pattern, '*', '%')
          AND match_context <@ $2::jsonb
        ORDER BY priority DESC, published_at DESC
        LIMIT 1
    `, req.URL, string(factsJSON)).Scan(
		&sc.ID, &sc.Title, &sc.Description, &sc.Status, &sc.PublishedAt,
		&sc.URLPattern, &rawMatch, &sc.Priority, &sc.CreatedAt, &sc.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, storage.ErrNotFound
		}
		return nil, fmt.Errorf("%s: query scenario: %w", op, err)
	}

	if err = json.Unmarshal(rawMatch, &sc.MatchContext); err != nil {
		return nil, fmt.Errorf("%s: unmarshal match_context: %w", op, err)
	}

	steps, err := s.stepsOf(ctx, sc.ID)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	sc.Steps = steps

	return &sc, nil
}

func (s *Storage) stepsOf(ctx context.Context, scenarioID uuid.UUID) ([]models.Step, error) {
	rows, err := s.pool.Query(ctx, `
        SELECT id, scenario_id, step_order, title, description,
               content, selector, action_type, condition, timeout
        FROM steps
        WHERE scenario_id = $1
        ORDER BY step_order ASC
    `, scenarioID)
	if err != nil {
		return nil, fmt.Errorf("query steps: %w", err)
	}
	defer rows.Close()

	steps := make([]models.Step, 0)
	for rows.Next() {
		var step models.Step
		if err = rows.Scan(
			&step.ID, &step.ScenarioID, &step.StepOrder, &step.Title, &step.Description,
			&step.Content, &step.Selector, &step.ActionType, &step.Condition, &step.TimeoutSec,
		); err != nil {
			return nil, fmt.Errorf("scan step: %w", err)
		}
		steps = append(steps, step)
	}

	return steps, rows.Err()
}

func (s *Storage) CreateAnalyticsEvents(ctx context.Context, events []models.CreateEventReq) error {
	const op = "postgres.Storage.CreateAnalyticsEvents"

	if len(events) == 0 {
		return nil
	}

	batch := &pgx.Batch{}
	now := time.Now().UTC()

	for _, event := range events {
		if event.SessionID == "" || event.EventType == "" || event.ScenarioID == uuid.Nil {
			continue
		}

		id, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("%s: generate id: %w", op, err)
		}

		batch.Queue(
			`INSERT INTO analytics_events (id, scenario_id, session_id, anon_id, step_id, event_type, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			id, event.ScenarioID, event.SessionID, nullable(event.AnonID), event.StepID, event.EventType, now,
		)
	}

	if batch.Len() == 0 {
		return nil
	}

	results := s.pool.SendBatch(ctx, batch)
	defer func() {
		_ = results.Close()
	}()

	for i := 0; i < batch.Len(); i++ {
		if _, err := results.Exec(); err != nil {
			return fmt.Errorf("%s: insert event: %w", op, err)
		}
	}

	return nil
}

func nullable(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
