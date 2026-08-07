package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wadt3rr/avito-guide/backend/internal/models"
	"github.com/wadt3rr/avito-guide/backend/internal/storage"
)

type stubScenarioStorage struct {
	scenarios  map[uuid.UUID]models.Scenario
	progresses map[string]models.Progress
	analytics  []models.CreateEventReq
}

func (s *stubScenarioStorage) CreateScenario(ctx context.Context, scenario *models.Scenario) (uuid.UUID, error) {
	id := uuid.New()
	scenario.ID = id
	scenario.CreatedAt = time.Now().UTC()
	scenario.UpdatedAt = scenario.CreatedAt
	s.scenarios[id] = *scenario
	return id, nil
}

func (s *stubScenarioStorage) GetScenarios(ctx context.Context) ([]models.Scenario, error) {
	items := make([]models.Scenario, 0, len(s.scenarios))
	for _, scenario := range s.scenarios {
		items = append(items, scenario)
	}
	return items, nil
}

func (s *stubScenarioStorage) GetScenarioByID(ctx context.Context, id uuid.UUID) (*models.Scenario, error) {
	scenario, ok := s.scenarios[id]
	if !ok {
		return nil, storage.ErrNotFound
	}
	return &scenario, nil
}

func (s *stubScenarioStorage) UpdateScenario(ctx context.Context, id uuid.UUID, req models.UpdateScenarioReq) error {
	scenario, ok := s.scenarios[id]
	if !ok {
		return storage.ErrNotFound
	}
	if req.Title != nil {
		scenario.Title = *req.Title
	}
	if req.Description != nil {
		scenario.Description = req.Description
	}
	if req.Status != nil {
		scenario.Status = *req.Status
	}
	if req.Steps != nil {
		scenario.Steps = *req.Steps
	}
	scenario.UpdatedAt = time.Now().UTC()
	s.scenarios[id] = scenario
	return nil
}

func (s *stubScenarioStorage) GetProgress(ctx context.Context, scenarioID uuid.UUID, sessionID string) (*models.Progress, error) {
	progress, ok := s.progresses[fmt.Sprintf("%s:%s", scenarioID.String(), sessionID)]
	if !ok {
		return nil, storage.ErrNotFound
	}
	return &progress, nil
}

func (s *stubScenarioStorage) UpsertProgress(ctx context.Context, scenarioID uuid.UUID, req models.UpsertProgressReq) (*models.Progress, error) {
	if req.SessionID == "" {
		return nil, errors.New("session_id is required")
	}

	key := fmt.Sprintf("%s:%s", scenarioID.String(), req.SessionID)
	progress := s.progresses[key]
	progress.ID = uuid.New()
	progress.ScenarioID = scenarioID
	progress.SessionID = req.SessionID
	progress.CreatedAt = time.Now().UTC()
	progress.UpdatedAt = progress.CreatedAt
	if req.Status != nil {
		progress.Status = *req.Status
	}
	if req.CurrentStep != nil {
		progress.CurrentStep = *req.CurrentStep
	}

	s.progresses[key] = progress
	return &progress, nil
}

func (s *stubScenarioStorage) GetScenarioAnalytics(ctx context.Context, scenarioID uuid.UUID) (*models.ScenarioAnalytics, error) {
	if _, ok := s.scenarios[scenarioID]; !ok {
		return nil, storage.ErrNotFound
	}

	analytics := &models.ScenarioAnalytics{ScenarioID: scenarioID}
	for _, event := range s.analytics {
		if event.ScenarioID != scenarioID {
			continue
		}
		switch event.EventType {
		case models.EventStarted:
			analytics.Started++
		case models.EventFinished:
			analytics.Finished++
		case models.EventSkipped:
			analytics.Skipped++
		}
	}
	if analytics.Started > 0 {
		analytics.Conversion = float64(analytics.Finished) / float64(analytics.Started) * 100
	}
	return analytics, nil
}

func (s *stubScenarioStorage) CreateAnalyticsEvent(ctx context.Context, req models.CreateEventReq) error {
	if req.SessionID == "" {
		return errors.New("session_id is required")
	}
	s.analytics = append(s.analytics, req)
	return nil
}

func TestRouter_Scenarios(t *testing.T) {
	tests := []struct {
		name         string
		method       string
		path         string
		body         string
		wantCode     int
		wantTitle    string
		wantScenario bool
	}{
		{
			name:         "get scenarios list",
			method:       http.MethodGet,
			path:         "/api/v1/scenarios",
			wantCode:     http.StatusOK,
			wantTitle:    "",
			wantScenario: false,
		},
		{
			name:         "create scenario",
			method:       http.MethodPost,
			path:         "/api/v1/scenarios",
			body:         `{"title":"Demo","description":"desc","status":"draft","steps":[{"title":"Step 1","description":"First","content":"Click","selector":"button","action_type":"click","condition":"always","timeout_sec":5}]}`,
			wantCode:     http.StatusCreated,
			wantTitle:    "Demo",
			wantScenario: true,
		},
		{
			name:         "get by id returns not found for missing scenario",
			method:       http.MethodGet,
			path:         "/api/v1/scenarios/" + uuid.NewString(),
			wantCode:     http.StatusNotFound,
			wantTitle:    "",
			wantScenario: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &stubScenarioStorage{scenarios: map[uuid.UUID]models.Scenario{}}
			router := newRouter(store, setupLogger(envLocal))

			var req *http.Request
			if tt.body != "" {
				req = httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
			} else {
				req = httptest.NewRequest(tt.method, tt.path, nil)
			}
			res := httptest.NewRecorder()

			router.ServeHTTP(res, req)
			if res.Code != tt.wantCode {
				t.Fatalf("expected status %d, got %d: %s", tt.wantCode, res.Code, res.Body.String())
			}

			if tt.wantScenario && res.Code == http.StatusCreated {
				var scenario models.Scenario
				if err := json.Unmarshal(res.Body.Bytes(), &scenario); err != nil {
					t.Fatalf("decode scenario: %v", err)
				}
				if scenario.ID == uuid.Nil {
					t.Fatal("scenario id should not be empty")
				}
			}
		})
	}
}

func TestRouter_UpdateScenario(t *testing.T) {
	tests := []struct {
		name      string
		id        uuid.UUID
		body      string
		wantCode  int
		wantTitle string
	}{
		{
			name:      "update existing scenario",
			id:        uuid.New(),
			body:      `{"title":"Updated title","status":"active"}`,
			wantCode:  http.StatusOK,
			wantTitle: "Updated title",
		},
		{
			name:      "update missing scenario",
			id:        uuid.New(),
			body:      `{"title":"New title"}`,
			wantCode:  http.StatusNotFound,
			wantTitle: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &stubScenarioStorage{scenarios: map[uuid.UUID]models.Scenario{}}
			if tt.wantCode == http.StatusOK {
				store.scenarios[tt.id] = models.Scenario{
					ID:        tt.id,
					Title:     "Old title",
					Status:    "draft",
					CreatedAt: time.Now().UTC(),
					UpdatedAt: time.Now().UTC(),
				}
			}

			router := newRouter(store, setupLogger(envLocal))
			req := httptest.NewRequest(http.MethodPatch, "/api/v1/scenarios/"+tt.id.String(), strings.NewReader(tt.body))
			res := httptest.NewRecorder()

			router.ServeHTTP(res, req)
			if res.Code != tt.wantCode {
				t.Fatalf("expected status %d, got %d: %s", tt.wantCode, res.Code, res.Body.String())
			}
			if tt.wantCode == http.StatusOK {
				var scenario models.Scenario
				if err := json.Unmarshal(res.Body.Bytes(), &scenario); err != nil {
					t.Fatalf("decode updated scenario: %v", err)
				}
				if scenario.Title != tt.wantTitle {
					t.Fatalf("expected title %q, got %q", tt.wantTitle, scenario.Title)
				}
			}
		})
	}
}

func TestNewRouter_InvalidJSON(t *testing.T) {
	store := &stubScenarioStorage{scenarios: map[uuid.UUID]models.Scenario{}, progresses: map[string]models.Progress{}, analytics: []models.CreateEventReq{}}
	router := newRouter(store, setupLogger(envLocal))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/scenarios", strings.NewReader("{bad json}"))
	res := httptest.NewRecorder()

	router.ServeHTTP(res, req)
	if res.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d: %s", http.StatusBadRequest, res.Code, res.Body.String())
	}
	if !strings.Contains(res.Body.String(), "invalid request body") && !strings.Contains(res.Body.String(), "failed") {
		t.Fatal("expected validation error message")
	}
}

func TestRouter_ProgressAndAnalytics(t *testing.T) {
	scenarioID := uuid.New()

	tests := []struct {
		name         string
		method       string
		path         string
		body         string
		wantCode     int
		wantContains string
	}{
		{
			name:         "get progress returns not found for missing progress",
			method:       http.MethodGet,
			path:         "/api/v1/scenarios/" + scenarioID.String() + "/progress?session_id=session-1",
			wantCode:     http.StatusNotFound,
			wantContains: "scenario not found",
		},
		{
			name:         "upsert progress returns created progress",
			method:       http.MethodPut,
			path:         "/api/v1/scenarios/" + scenarioID.String() + "/progress",
			body:         `{"session_id":"session-1","status":"in_progress","current_step":2}`,
			wantCode:     http.StatusOK,
			wantContains: "in_progress",
		},
		{
			name:         "create analytics event",
			method:       http.MethodPost,
			path:         "/api/v1/analytics/events",
			body:         fmt.Sprintf(`{"scenario_id":"%s","session_id":"session-1","event_type":"started"}`, scenarioID.String()),
			wantCode:     http.StatusCreated,
			wantContains: "status",
		},
		{
			name:         "get analytics for scenario",
			method:       http.MethodGet,
			path:         "/api/v1/scenarios/" + scenarioID.String() + "/analytics",
			wantCode:     http.StatusOK,
			wantContains: "started",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &stubScenarioStorage{
				scenarios:  map[uuid.UUID]models.Scenario{scenarioID: {ID: scenarioID, Title: "Demo", Status: "draft"}},
				progresses: map[string]models.Progress{},
				analytics:  []models.CreateEventReq{},
			}
			router := newRouter(store, setupLogger(envLocal))

			var req *http.Request
			if tt.body != "" {
				req = httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
			} else {
				req = httptest.NewRequest(tt.method, tt.path, nil)
			}
			res := httptest.NewRecorder()

			router.ServeHTTP(res, req)
			if res.Code != tt.wantCode {
				t.Fatalf("expected status %d, got %d: %s", tt.wantCode, res.Code, res.Body.String())
			}
			if tt.wantContains != "" && !strings.Contains(res.Body.String(), tt.wantContains) {
				t.Fatalf("expected response to contain %q, got %q", tt.wantContains, res.Body.String())
			}
		})
	}
}

func TestErrors(t *testing.T) {
	if !errors.Is(storage.ErrNotFound, storage.ErrNotFound) {
		t.Fatal("ErrNotFound should exist")
	}
}
