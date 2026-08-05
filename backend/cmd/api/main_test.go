package main

import (
	"context"
	"encoding/json"
	"errors"
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
	scenarios map[uuid.UUID]models.Scenario
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
		scenario.Description = *req.Description
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
			path:         "/api/scenarios",
			wantCode:     http.StatusOK,
			wantTitle:    "",
			wantScenario: false,
		},
		{
			name:         "create scenario",
			method:       http.MethodPost,
			path:         "/api/scenarios",
			body:         `{"title":"Demo","description":"desc","status":"draft","steps":[{"title":"Step 1","description":"First","content":"Click","selector":"button","action_type":"click","condition":"always","timeout_sec":5}]}`,
			wantCode:     http.StatusCreated,
			wantTitle:    "Demo",
			wantScenario: true,
		},
		{
			name:         "get by id returns not found for missing scenario",
			method:       http.MethodGet,
			path:         "/api/scenarios/" + uuid.NewString(),
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
			req := httptest.NewRequest(http.MethodPut, "/api/scenarios/"+tt.id.String(), strings.NewReader(tt.body))
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
	store := &stubScenarioStorage{scenarios: map[uuid.UUID]models.Scenario{}}
	router := newRouter(store, setupLogger(envLocal))

	req := httptest.NewRequest(http.MethodPost, "/api/scenarios", strings.NewReader("{bad json}"))
	res := httptest.NewRecorder()

	router.ServeHTTP(res, req)
	if res.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d: %s", http.StatusBadRequest, res.Code, res.Body.String())
	}
	if !strings.Contains(res.Body.String(), "invalid request body") && !strings.Contains(res.Body.String(), "failed") {
		t.Fatal("expected validation error message")
	}
}

func TestErrors(t *testing.T) {
	if !errors.Is(storage.ErrNotFound, storage.ErrNotFound) {
		t.Fatal("ErrNotFound should exist")
	}
}
