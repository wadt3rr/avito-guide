package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wadt3rr/avito-guide/backend/internal/models"
	"github.com/wadt3rr/avito-guide/backend/internal/storage"

	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

type Storage struct {
	pool *pgxpool.Pool
}

func NewStorage(ctx context.Context, dsn string, migrationsPath string) (*Storage, error) {
	const op = "postgres.NewStorage"

	// Создаем пулл соединений
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("%s: failed to create connection pool: %w", op, err)
	}

	// Запуск миграций
	if err = runMigrations(migrationsPath, dsn); err != nil {
		pool.Close()
		return nil, fmt.Errorf("%s: failed to run migrations: %w", op, err)
	}

	if err = pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("%s: failed to ping database: %w", op, err)
	}

	return &Storage{pool: pool}, nil
}

func (s *Storage) Close() {
	s.pool.Close()
}

// runMigrations применяет миграции по указанному пути
func runMigrations(migrationsPath, dsn string) error {
	// Проверяем, что папка существует (относительно рабочей директории)
	info, err := os.Stat(migrationsPath)
	if err != nil {
		return fmt.Errorf("migrations path does not exist: %s: %w", migrationsPath, err)
	}
	if !info.IsDir() {
		return fmt.Errorf("migrations path is not a directory: %s", migrationsPath)
	}

	log.Printf("Running migrations from: %s", migrationsPath)

	absolutePath, err := filepath.Abs(migrationsPath)
	if err != nil {
		return fmt.Errorf("resolve migrations path: %w", err)
	}
	sourceURL := "file://" + filepath.ToSlash(absolutePath)

	m, err := migrate.New(sourceURL, dsn)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer func() {
		_, _ = m.Close()
	}()

	if err = m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("migration up failed: %w", err)
	}

	log.Println("Migrations applied successfully")
	return nil
}

//TODO: договориться получаем ли мы шаги сразу или добавляем их после создания сценария(атомарная это операция или всё же будет выполняться в 2 запроса к БД)

// CreateScenario отвечает за создание нового сценария в базе данных
func (s *Storage) CreateScenario(ctx context.Context, scenario *models.Scenario) (uuid.UUID, error) {
	const op = "postgres.Storage.CreateScenario"

	// Запуск транзакции
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return uuid.Nil, fmt.Errorf("%s: failed to begin transaction: %w", op, err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	// Создание сценария
	id := scenario.ID
	if id == uuid.Nil {
		id, err = uuid.NewV7()
		if err != nil {
			return uuid.Nil, fmt.Errorf("%s: failed to create scenario id: %w", op, err)
		}
	}

	scenarioType := scenario.Type
	if scenarioType == "" {
		scenarioType = models.ScenarioTooltip
	}

	now := time.Now().UTC()

	_, err = tx.Exec(
		ctx,
		`INSERT INTO scenarios (id, type, title, description, status, created_at, updated_at, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		id, scenarioType, scenario.Title, scenario.Description, scenario.Status, now, now, scenario.UserID,
	)
	if err != nil {
		return uuid.Nil, fmt.Errorf("%s: failed to create scenario: %w", op, err)
	}

	for i, step := range scenario.Steps {
		stepID, err := uuid.NewV7()
		if err != nil {
			return uuid.Nil, fmt.Errorf("%s: failed to generate step id: %w", op, err)
		}

		order := step.StepOrder
		if order == 0 {
			order = i + 1
		}

		_, err = tx.Exec(
			ctx,
			`INSERT INTO steps (id, scenario_id, step_order, title, description, content, selector, action_type, condition, timeout) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
			stepID, id, order, step.Title, step.Description, step.Content, step.Selector, step.ActionType, step.Condition, step.TimeoutSec,
		)
		if err != nil {
			return uuid.Nil, fmt.Errorf("%s: failed insert step: %w", op, err)
		}
	}
	if err = tx.Commit(ctx); err != nil {
		return uuid.Nil, fmt.Errorf("%s: commit: %w", op, err)
	}
	return id, nil
}

// GetScenarios возвращает список сценариев из базы данных
func (s *Storage) GetScenarios(ctx context.Context) ([]models.Scenario, error) {
	const op = "postgres.Storage.GetScenarios"

	rows, err := s.pool.Query(
		ctx,
		`SELECT id, user_id ,type, title, description, status, published_at, url_pattern, match_context, priority, created_at, updated_at
        FROM scenarios
        ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("%s: couldn't get scenarios: %w", op, err)
	}
	scenarios := make([]models.Scenario, 0)
	scenarioIndexes := make(map[uuid.UUID]int)
	scenarioIDs := make([]uuid.UUID, 0)

	for rows.Next() {
		var sc models.Scenario
		var rawMatch []byte
		err = rows.Scan(
			&sc.ID,
			&sc.UserID,
			&sc.Type,
			&sc.Title,
			&sc.Description,
			&sc.Status,
			&sc.PublishedAt,
			&sc.URLPattern,
			&rawMatch,
			&sc.Priority,
			&sc.CreatedAt,
			&sc.UpdatedAt,
		)
		if err != nil {
			rows.Close()
			return nil, fmt.Errorf("%s: scannig error: %w", op, err)
		}
		if err = json.Unmarshal(rawMatch, &sc.MatchContext); err != nil {
			rows.Close()
			return nil, fmt.Errorf("%s: unmarshal match_context: %w", op, err)
		}
		sc.Steps = make([]models.Step, 0)
		scenarioIndexes[sc.ID] = len(scenarios)
		scenarioIDs = append(scenarioIDs, sc.ID)
		scenarios = append(scenarios, sc)
	}

	if err = rows.Err(); err != nil {
		rows.Close()
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	rows.Close()

	if len(scenarioIDs) > 0 {
		stepRows, stepErr := s.pool.Query(ctx, `
			SELECT id, scenario_id, step_order, title, description,
			       content, selector, action_type, condition, timeout
			FROM steps
			WHERE scenario_id = ANY($1)
			ORDER BY scenario_id, step_order
		`, scenarioIDs)
		if stepErr != nil {
			return nil, fmt.Errorf("%s: query steps: %w", op, stepErr)
		}

		for stepRows.Next() {
			var step models.Step
			if err = stepRows.Scan(
				&step.ID,
				&step.ScenarioID,
				&step.StepOrder,
				&step.Title,
				&step.Description,
				&step.Content,
				&step.Selector,
				&step.ActionType,
				&step.Condition,
				&step.TimeoutSec,
			); err != nil {
				stepRows.Close()
				return nil, fmt.Errorf("%s: scan step: %w", op, err)
			}
			if index, ok := scenarioIndexes[step.ScenarioID]; ok {
				scenarios[index].Steps = append(scenarios[index].Steps, step)
			}
		}
		if err = stepRows.Err(); err != nil {
			stepRows.Close()
			return nil, fmt.Errorf("%s: steps rows: %w", op, err)
		}
		stepRows.Close()
	}

	return scenarios, nil
}

// GetScenarioByID возвращает сценарий из базы данных по ID
func (s *Storage) GetScenarioByID(ctx context.Context, id uuid.UUID) (*models.Scenario, error) {
	const op = "postgres.Storage.GetScenarioByID"

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("%s: begin tx: %w", op, err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var sc models.Scenario
	var rawMatch []byte

	err = tx.QueryRow(ctx, `
		SELECT id, user_id, type, title, description, status, published_at, url_pattern, match_context, priority, created_at, updated_at
        FROM scenarios
        WHERE id = $1
	`, id).Scan(
		&sc.ID,
		&sc.UserID,
		&sc.Type,
		&sc.Title,
		&sc.Description,
		&sc.Status,
		&sc.PublishedAt,
		&sc.URLPattern,
		&rawMatch,
		&sc.Priority,
		&sc.CreatedAt,
		&sc.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, storage.ErrNotFound
		}
		return nil, fmt.Errorf("%s: failed to query scenario: %w", op, err)
	}

	if err = json.Unmarshal(rawMatch, &sc.MatchContext); err != nil {
		return nil, fmt.Errorf("%s: unmarshal match_context: %w", op, err)
	}

	rows, err := tx.Query(ctx, `
        SELECT id, scenario_id, step_order, title, description,
               content, selector, action_type, condition, timeout
        FROM steps
        WHERE scenario_id = $1
        ORDER BY step_order ASC
    `, id)
	if err != nil {
		return nil, fmt.Errorf("%s:failed to query steps: %w", op, err)
	}
	defer rows.Close()

	var steps []models.Step
	for rows.Next() {
		var step models.Step
		err = rows.Scan(
			&step.ID,
			&step.ScenarioID,
			&step.StepOrder,
			&step.Title,
			&step.Description,
			&step.Content,
			&step.Selector,
			&step.ActionType,
			&step.Condition,
			&step.TimeoutSec,
		)
		if err != nil {
			return nil, fmt.Errorf("%s: failed to scan step: %w", op, err)
		}
		steps = append(steps, step)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("%s: steps rows: %w", op, err)
	}

	sc.Steps = steps

	if err = tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("%s: failed to commit: %w", op, err)
	}

	return &sc, nil
}

// UpdateScenario обновляет поля сценария в базе данных по ID
func (s *Storage) UpdateScenario(ctx context.Context, id uuid.UUID, req models.UpdateScenarioReq) error {
	const op = "postgres.Storage.UpdateScenario"

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("%s:failed to begin tx: %w", op, err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()
	query := "UPDATE scenarios SET updated_at = $1"
	args := []any{time.Now().UTC()}
	argPos := 2

	if req.Title != nil {
		query += fmt.Sprintf(", title = $%d", argPos)
		args = append(args, *req.Title)
		argPos++
	}
	if req.Type != nil {
		query += fmt.Sprintf(", type = $%d", argPos)
		args = append(args, *req.Type)
		argPos++
	}
	if req.Description != nil {
		query += fmt.Sprintf(", description = $%d", argPos)
		args = append(args, *req.Description)
		argPos++
	}
	if req.Status != nil {
		query += fmt.Sprintf(", status = $%d", argPos)
		args = append(args, *req.Status)
		argPos++
	}
	if req.Published != nil {
		if *req.Published {
			query += fmt.Sprintf(", published_at = COALESCE(published_at, $%d)", argPos)
			args = append(args, time.Now().UTC())
		} else {
			query += fmt.Sprintf(", published_at = $%d", argPos)
			args = append(args, nil)
		}
		argPos++
	}
	if req.URLPattern != nil {
		query += fmt.Sprintf(", url_pattern = $%d", argPos)
		args = append(args, *req.URLPattern)
		argPos++
	}
	if req.MatchContext != nil {
		raw, err := json.Marshal(*req.MatchContext)
		if err != nil {
			return fmt.Errorf("%s: marshal match_context: %w", op, err)
		}
		query += fmt.Sprintf(", match_context = $%d::jsonb", argPos)
		args = append(args, string(raw))
		argPos++
	}
	if req.Priority != nil {
		query += fmt.Sprintf(", priority = $%d", argPos)
		args = append(args, *req.Priority)
		argPos++
	}

	query += fmt.Sprintf(" WHERE id = $%d", argPos)
	args = append(args, id)

	tag, err := tx.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("%s: update scenario: %w", op, err)
	}
	if tag.RowsAffected() == 0 {
		return storage.ErrNotFound
	}

	if req.Steps != nil {
		if err := s.upsertSteps(ctx, tx, id, *req.Steps); err != nil {
			return fmt.Errorf("%s: %w", op, err)
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return fmt.Errorf("%s: commit: %w", op, err)
	}

	return nil
}

func (s *Storage) DeleteScenario(ctx context.Context, id uuid.UUID) error {
	const op = "postgres.Storage.DeleteScenario"

	tag, err := s.pool.Exec(ctx, `DELETE FROM scenarios WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("%s: delete scenario: %w", op, err)
	}
	if tag.RowsAffected() == 0 {
		return storage.ErrNotFound
	}

	return nil
}

func (s *Storage) upsertSteps(ctx context.Context, tx pgx.Tx, scenarioID uuid.UUID, steps []models.Step) error {
	const op = "postgres.Storage.upsertSteps"

	// Собираем ID существующих шагов, которые пришли с клиента
	incomingIDs := make([]uuid.UUID, 0, len(steps))
	for _, step := range steps {
		if step.ID != uuid.Nil {
			incomingIDs = append(incomingIDs, step.ID)
		}
	}

	// Удаляем шаги, которых больше нет в запросе
	if len(incomingIDs) > 0 {
		_, err := tx.Exec(ctx, `
            DELETE FROM steps
            WHERE scenario_id = $1
              AND id != ALL($2)
        `, scenarioID, incomingIDs)
		if err != nil {
			return fmt.Errorf("%s: delete removed steps: %w", op, err)
		}
	} else {
		_, err := tx.Exec(ctx, `DELETE FROM steps WHERE scenario_id = $1`, scenarioID)
		if err != nil {
			return fmt.Errorf("%s: delete all steps: %w", op, err)
		}
	}

	for i, step := range steps {
		order := step.StepOrder
		if order == 0 {
			order = i + 1
		}

		if step.ID == uuid.Nil {
			// Новый шаг
			stepID, err := uuid.NewV7()
			if err != nil {
				return fmt.Errorf("%s: generate step id: %w", op, err)
			}

			_, err = tx.Exec(ctx, `
                INSERT INTO steps (
                    id, scenario_id, step_order, title, description,
                    content, selector, action_type, condition, timeout
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            `,
				stepID, scenarioID, order, step.Title, step.Description,
				step.Content, step.Selector, step.ActionType, step.Condition, step.TimeoutSec,
			)
			if err != nil {
				return fmt.Errorf("%s: insert step: %w", op, err)
			}
		} else {
			// Обновляем существующий
			_, err := tx.Exec(ctx, `
                UPDATE steps
                SET step_order = $1,
                    title = $2,
                    description = $3,
                    content = $4,
                    selector = $5,
                    action_type = $6,
                    condition = $7,
                    timeout = $8
                WHERE id = $9 AND scenario_id = $10
            `,
				order, step.Title, step.Description, step.Content,
				step.Selector, step.ActionType, step.Condition, step.TimeoutSec,
				step.ID, scenarioID,
			)
			if err != nil {
				return fmt.Errorf("%s: update step: %w", op, err)
			}
		}
	}

	return nil
}

func (s *Storage) GetProgress(ctx context.Context, scenarioID uuid.UUID, sessionID string) (*models.Progress, error) {
	const op = "postgres.Storage.GetProgress"

	var p models.Progress
	err := s.pool.QueryRow(
		ctx,
		`SELECT * FROM user_scenario_progress WHERE scenario_id = $1 AND session_id = $2`,
		scenarioID, sessionID,
	).Scan(
		&p.ID,
		&p.ScenarioID,
		&p.SessionID,
		&p.Status,
		&p.CurrentStep,
		&p.CreatedAt,
		&p.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, storage.ErrNotFound
		}
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	return &p, nil
}

func (s *Storage) UpsertProgress(ctx context.Context, scenarioID uuid.UUID, req models.UpsertProgressReq) (*models.Progress, error) {
	const op = "postgres.Storage.UpsertProgress"

	if req.SessionID == "" {
		return nil, fmt.Errorf("%s: session_id is required", op)
	}

	status := models.ProgressStarted
	if req.Status != nil {
		status = *req.Status
	}

	currentStep := 0
	if req.CurrentStep != nil {
		currentStep = *req.CurrentStep
	}

	id, err := uuid.NewV7()
	if err != nil {
		return nil, fmt.Errorf("%s: generate id: %w", op, err)
	}

	now := time.Now().UTC()

	var p models.Progress
	err = s.pool.QueryRow(ctx, `
        INSERT INTO user_scenario_progress (
            id, scenario_id, session_id, status, current_step, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (scenario_id, session_id) DO UPDATE
        SET
            status = COALESCE(EXCLUDED.status, user_scenario_progress.status),
            current_step = COALESCE(EXCLUDED.current_step, user_scenario_progress.current_step),
            updated_at = EXCLUDED.updated_at
        RETURNING id, scenario_id, session_id, status, current_step, created_at, updated_at
    `, id, scenarioID, req.SessionID, status, currentStep, now, now).Scan(
		&p.ID,
		&p.ScenarioID,
		&p.SessionID,
		&p.Status,
		&p.CurrentStep,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	return &p, nil
}

func (s *Storage) CreateAnalyticsEvent(ctx context.Context, req models.CreateEventReq) error {
	const op = "postgres.Storage.CreateAnalyticEvent"

	if req.SessionID == "" {
		return fmt.Errorf("%s: session_id is required", op)
	}

	if req.EventType == "" {
		return fmt.Errorf("%s: event_type is required", op)
	}

	id, err := uuid.NewV7()
	if err != nil {
		return fmt.Errorf("%s: failed to generate id: %w", op, err)
	}

	_, err = s.pool.Exec(
		ctx,
		`INSERT INTO analytics_events (id, scenario_id, session_id, step_id,event_type, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
		id, req.ScenarioID, req.SessionID, req.StepID, req.EventType, time.Now().UTC(),
	)

	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	return nil
}

func (s *Storage) GetScenarioAnalytics(ctx context.Context, scenarioID uuid.UUID) (*models.ScenarioAnalytics, error) {
	const op = "postgres.Storage.GetScenarioAnalytics"
	var a models.ScenarioAnalytics
	a.ScenarioID = scenarioID

	err := s.pool.QueryRow(
		ctx,
		`SELECT 
				COUNT(DISTINCT session_id) FILTER ( WHERE event_type = 'started'),
				COUNT(DISTINCT session_id) FILTER ( WHERE event_type = 'finished'),
				COUNT(DISTINCT session_id) FILTER ( WHERE event_type = 'skipped')
			FROM analytics_events WHERE scenario_id = $1`, scenarioID).Scan(&a.Started, &a.Finished, &a.Skipped)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	if a.Started > 0 {
		a.Conversion = float64(a.Finished) / float64(a.Started) * 100
	}

	rows, err := s.pool.Query(
		ctx,
		`SELECT 
    		s.id, s.step_order, s.title, 
    		COUNT(DISTINCT ae.session_id) FILTER (WHERE ae.event_type = 'step_completed') AS completed
		FROM steps AS s
		LEFT JOIN analytics_events AS ae
		    ON ae.step_id = s.id AND ae.scenario_id = s.scenario_id
		WHERE s.scenario_id = $1 
		GROUP BY s.id, s.step_order, s.title 
		ORDER BY s.step_order`,
		scenarioID,
	)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	defer rows.Close()
	for rows.Next() {
		var st models.StepStats
		if err = rows.Scan(&st.StepID, &st.StepOrder, &st.Title, &st.Completed); err != nil {
			return nil, fmt.Errorf("%s: %w", op, err)
		}
		a.Steps = append(a.Steps, st)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	return &a, nil
}

func (s *Storage) CreateUser(ctx context.Context, user *models.User) (uuid.UUID, error) {
	const op = "postgres.Storage.CreateUser"
	if user.ID == uuid.Nil {
		id, err := uuid.NewV7()
		if err != nil {
			return uuid.Nil, fmt.Errorf("%s: failed to create user id: %w", op, err)
		}
		user.ID = id
	}

	_, err := s.pool.Exec(
		ctx,
		`INSERT INTO users(id, email, password_hash, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`,
		user.ID, user.Email, user.PasswordHash, user.Role, user.CreatedAt, user.UpdatedAt,
	)

	if err != nil {
		return uuid.Nil, fmt.Errorf("%s: %w", op, err)
	}

	return user.ID, nil
}

func (s *Storage) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	const op = "postgres.Storage.GetUserByEmail"
	var u models.User

	err := s.pool.QueryRow(
		ctx,
		`SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE lower(email) = lower($1)`,
		email,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, storage.ErrNotFound
		}
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	return &u, nil
}

func (s *Storage) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	const op = "postgres.Storage.GetUserByEmail"
	var u models.User

	err := s.pool.QueryRow(
		ctx,
		`SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE id = $1`,
		id,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Role, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, storage.ErrNotFound
		}
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	return &u, nil
}

func (s *Storage) UpdateUserAuth(
	ctx context.Context,
	id uuid.UUID,
	email, passwordHash string,
	role models.UserRole,
) error {
	const op = "postgres.Storage.UpdateUserAuth"

	tag, err := s.pool.Exec(
		ctx,
		`UPDATE users SET email = $1, password_hash = $2, role = $3, updated_at = $4 WHERE id = $5`,
		email, passwordHash, role, time.Now().UTC(), id,
	)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	if tag.RowsAffected() == 0 {
		return storage.ErrNotFound
	}

	return nil
}

func (s *Storage) ListUsers(ctx context.Context) ([]models.User, error) {
	const op = "postgres.Storage.ListUsers"

	var users []models.User
	rows, err := s.pool.Query(
		ctx,
		`SELECT id, email, role, created_at, updated_at FROM users`,
	)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	defer rows.Close()
	for rows.Next() {
		var u models.User
		_ = rows.Scan(&u.ID, &u.Email, &u.Role, &u.CreatedAt, &u.UpdatedAt)
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	return users, nil
}

func (s *Storage) DeleteUser(ctx context.Context, id uuid.UUID) error {
	const op = "postgres.Storage.DeleteUser"

	tag, err := s.pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}
	if tag.RowsAffected() == 0 {
		return storage.ErrNotFound
	}
	return nil
}
