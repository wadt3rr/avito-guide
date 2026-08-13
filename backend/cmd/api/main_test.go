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
	"github.com/wadt3rr/avito-guide/backend/internal/auth"
	"github.com/wadt3rr/avito-guide/backend/internal/models"
	"github.com/wadt3rr/avito-guide/backend/internal/storage"
)

type stubScenarioStorage struct {
	scenarios  map[uuid.UUID]models.Scenario
	progresses map[string]models.Progress
	analytics  []models.CreateEventReq
	users      map[uuid.UUID]models.User
}

func newStubStorage() *stubScenarioStorage {
	return &stubScenarioStorage{
		scenarios:  make(map[uuid.UUID]models.Scenario),
		progresses: make(map[string]models.Progress),
		analytics:  make([]models.CreateEventReq, 0),
		users:      make(map[uuid.UUID]models.User),
	}
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

	if req.Type != nil {
		scenario.Type = *req.Type
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

func (s *stubScenarioStorage) DeleteScenario(ctx context.Context, id uuid.UUID) error {
	if _, ok := s.scenarios[id]; !ok {
		return storage.ErrNotFound
	}

	delete(s.scenarios, id)
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

func (s *stubScenarioStorage) CreateAnalyticsEvents(ctx context.Context, events []models.CreateEventReq) error {
	s.analytics = append(s.analytics, events...)
	return nil
}

func (s *stubScenarioStorage) ResolveScenario(ctx context.Context, req models.ResolveRequest) (*models.Scenario, error) {
	for _, scenario := range s.scenarios {
		if scenario.PublishedAt == nil {
			continue
		}

		if scenario.URLPattern != "*" && scenario.URLPattern != req.URL {
			continue
		}

		matched := true
		for key, want := range scenario.MatchContext {
			if req.Context[key] != want {
				matched = false
				break
			}
		}

		if matched {
			found := scenario
			return &found, nil
		}
	}
	return nil, storage.ErrNotFound
}

func (s *stubScenarioStorage) CreateUser(ctx context.Context, user *models.User) (uuid.UUID, error) {
	id := uuid.New()
	user.ID = id
	user.CreatedAt = time.Now().UTC()
	user.UpdatedAt = user.CreatedAt
	s.users[id] = *user
	return id, nil
}

func (s *stubScenarioStorage) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	for _, u := range s.users {
		if u.Email == email {
			return &u, nil
		}
	}
	return nil, storage.ErrNotFound
}

func (s *stubScenarioStorage) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	u, ok := s.users[id]
	if !ok {
		return nil, storage.ErrNotFound
	}
	return &u, nil
}

func (s *stubScenarioStorage) ListUsers(ctx context.Context) ([]models.User, error) {
	users := make([]models.User, 0, len(s.users))
	for _, u := range s.users {
		users = append(users, u)
	}
	return users, nil
}

func (s *stubScenarioStorage) DeleteUser(ctx context.Context, id uuid.UUID) error {
	if _, ok := s.users[id]; !ok {
		return storage.ErrNotFound
	}
	delete(s.users, id)
	return nil
}

func addAuthHeader(req *http.Request, role models.UserRole) {
	user := models.User{ID: uuid.New(), Email: "test@example.com", Role: role}
	token, _ := auth.NewToken("test-secret", user, time.Hour)
	req.Header.Set("Authorization", "Bearer "+token)
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
			store := newStubStorage()
			router := newRouter(store, setupLogger(envLocal), "test-secret")

			var req *http.Request
			if tt.body != "" {
				req = httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
			} else {
				req = httptest.NewRequest(tt.method, tt.path, nil)
			}

			addAuthHeader(req, models.UserRoleAdmin)

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
			store := newStubStorage()
			if tt.wantCode == http.StatusOK {
				store.scenarios[tt.id] = models.Scenario{
					ID:        tt.id,
					Title:     "Old title",
					Status:    "draft",
					CreatedAt: time.Now().UTC(),
					UpdatedAt: time.Now().UTC(),
				}
			}

			router := newRouter(store, setupLogger(envLocal), "test-secret")
			req := httptest.NewRequest(http.MethodPatch, "/api/v1/scenarios/"+tt.id.String(), strings.NewReader(tt.body))
			addAuthHeader(req, models.UserRoleAdmin)
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

func TestRouter_PersistsScenarioType(t *testing.T) {
	store := newStubStorage()
	router := newRouter(store, setupLogger(envLocal), "test-secret")
	req := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/scenarios",
		strings.NewReader(`{"title":"Важное сообщение","type":"modal","status":"draft"}`),
	)
	addAuthHeader(req, models.UserRoleAdmin)
	res := httptest.NewRecorder()

	router.ServeHTTP(res, req)
	if res.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d: %s", http.StatusCreated, res.Code, res.Body.String())
	}

	var scenario models.Scenario
	if err := json.Unmarshal(res.Body.Bytes(), &scenario); err != nil {
		t.Fatalf("decode scenario: %v", err)
	}

	if scenario.Type != models.ScenarioModal {
		t.Fatalf("expected modal type, got %q", scenario.Type)
	}
}

func TestRouter_DeleteScenario(t *testing.T) {
	scenarioID := uuid.New()
	store := newStubStorage()
	store.scenarios[scenarioID] = models.Scenario{ID: scenarioID, Title: "Удаляемый сценарий"}

	router := newRouter(store, setupLogger(envLocal), "test-secret")
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/scenarios/"+scenarioID.String(), nil)
	addAuthHeader(req, models.UserRoleAdmin)
	res := httptest.NewRecorder()

	router.ServeHTTP(res, req)
	if res.Code != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d: %s", http.StatusNoContent, res.Code, res.Body.String())
	}
	if _, ok := store.scenarios[scenarioID]; ok {
		t.Fatal("scenario should be deleted")
	}
}

func TestRouter_AnalyticsReport(t *testing.T) {
	scenarioID := uuid.New()
	store := newStubStorage()
	store.scenarios[scenarioID] = models.Scenario{ID: scenarioID, Title: "Первая доставка", Type: models.ScenarioTooltip}
	store.analytics = []models.CreateEventReq{
		{ScenarioID: scenarioID, SessionID: "session-1", EventType: models.EventStarted},
		{ScenarioID: scenarioID, SessionID: "session-1", EventType: models.EventFinished},
	}

	router := newRouter(store, setupLogger(envLocal), "test-secret")
	req := httptest.NewRequest(http.MethodGet, "/api/v1/scenarios/"+scenarioID.String()+"/analytics/report", nil)
	addAuthHeader(req, models.UserRoleAdmin)
	res := httptest.NewRecorder()

	router.ServeHTTP(res, req)
	if res.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d: %s", http.StatusOK, res.Code, res.Body.String())
	}

	if contentType := res.Header().Get("Content-Type"); contentType != "application/pdf" {
		t.Fatalf("expected PDF content type, got %q", contentType)
	}

	if !strings.HasPrefix(res.Body.String(), "%PDF-") {
		t.Fatal("expected a PDF document")
	}
}

func TestNewRouter_InvalidJSON(t *testing.T) {
	store := newStubStorage()
	router := newRouter(store, setupLogger(envLocal), "test-secret")

	req := httptest.NewRequest(http.MethodPost, "/api/v1/scenarios", strings.NewReader("{bad json}"))
	addAuthHeader(req, models.UserRoleAdmin)
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
		needsAuth    bool
	}{
		{
			name:         "get progress returns not found for missing progress",
			method:       http.MethodGet,
			path:         "/api/v1/scenarios/" + scenarioID.String() + "/progress?session_id=session-1",
			wantCode:     http.StatusNotFound,
			wantContains: "progress not found",
			needsAuth:    false,
		},
		{
			name:         "upsert progress returns created progress",
			method:       http.MethodPut,
			path:         "/api/v1/scenarios/" + scenarioID.String() + "/progress",
			body:         `{"session_id":"session-1","status":"in_progress","current_step":2}`,
			wantCode:     http.StatusOK,
			wantContains: "in_progress",
			needsAuth:    false,
		},
		{
			name:         "create analytics event",
			method:       http.MethodPost,
			path:         "/api/v1/analytics/events",
			body:         fmt.Sprintf(`{"scenario_id":"%s","session_id":"session-1","event_type":"started"}`, scenarioID.String()),
			wantCode:     http.StatusCreated,
			wantContains: "status",
			needsAuth:    false,
		},
		{
			name:         "get analytics for scenario",
			method:       http.MethodGet,
			path:         "/api/v1/scenarios/" + scenarioID.String() + "/analytics",
			wantCode:     http.StatusOK,
			wantContains: "started",
			needsAuth:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := newStubStorage()
			store.scenarios[scenarioID] = models.Scenario{ID: scenarioID, Title: "Demo", Status: "draft"}

			router := newRouter(store, setupLogger(envLocal), "test-secret")

			var req *http.Request
			if tt.body != "" {
				req = httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
			} else {
				req = httptest.NewRequest(tt.method, tt.path, nil)
			}

			if tt.needsAuth {
				addAuthHeader(req, models.UserRoleAdmin)
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

func TestRouter_Auth(t *testing.T) {
	validEmail := "user@example.com"
	validPassword := "secure123"
	hashedPassword, _ := auth.HashPassword(validPassword)
	existingUserID := uuid.New()

	tests := []struct {
		name         string
		method       string
		path         string
		body         string
		wantCode     int
		asSuperAdmin bool
		setupStore   func(store *stubScenarioStorage)
	}{
		{
			name:         "register success",
			method:       http.MethodPost,
			path:         "/api/v1/auth/register",
			body:         `{"email":"new@example.com","password":"password123"}`,
			wantCode:     http.StatusCreated,
			asSuperAdmin: true,
		},
		{
			name:         "register missing fields",
			method:       http.MethodPost,
			path:         "/api/v1/auth/register",
			body:         `{"email":"","password":""}`,
			wantCode:     http.StatusBadRequest,
			asSuperAdmin: true,
		},
		{
			name:         "login success",
			method:       http.MethodPost,
			path:         "/api/v1/auth/login",
			body:         fmt.Sprintf(`{"email":"%s","password":"%s"}`, validEmail, validPassword),
			wantCode:     http.StatusOK,
			asSuperAdmin: false,
			setupStore: func(store *stubScenarioStorage) {
				store.users[existingUserID] = models.User{
					ID:           existingUserID,
					Email:        validEmail,
					PasswordHash: hashedPassword,
					Role:         models.UserRoleAdmin,
				}
			},
		},
		{
			name:         "login incorrect password",
			method:       http.MethodPost,
			path:         "/api/v1/auth/login",
			body:         fmt.Sprintf(`{"email":"%s","password":"wrongpassword"}`, validEmail),
			wantCode:     http.StatusUnauthorized,
			asSuperAdmin: false,
			setupStore: func(store *stubScenarioStorage) {
				store.users[existingUserID] = models.User{
					ID:           existingUserID,
					Email:        validEmail,
					PasswordHash: hashedPassword,
				}
			},
		},
		{
			name:         "login non-existent user",
			method:       http.MethodPost,
			path:         "/api/v1/auth/login",
			body:         `{"email":"notfound@example.com","password":"password123"}`,
			wantCode:     http.StatusUnauthorized,
			asSuperAdmin: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := newStubStorage()
			if tt.setupStore != nil {
				tt.setupStore(store)
			}

			router := newRouter(store, setupLogger(envLocal), "test-secret")
			req := httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))

			if tt.asSuperAdmin {
				addAuthHeader(req, models.UserRoleSuperAdmin)
			}

			res := httptest.NewRecorder()
			router.ServeHTTP(res, req)

			if res.Code != tt.wantCode {
				t.Fatalf("expected status %d, got %d: %s", tt.wantCode, res.Code, res.Body.String())
			}
		})
	}
}

func TestEnsureSuperAdmin(t *testing.T) {
	ctx := context.Background()
	store := newStubStorage()

	err := ensureSuperAdmin(ctx, store, "super@example.com", "secure123", envLocal)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	user, err := store.GetUserByEmail(ctx, "super@example.com")
	if err != nil {
		t.Fatalf("expected user to be created")
	}
	if user.Role != models.UserRoleSuperAdmin {
		t.Fatalf("expected superadmin role, got %s", user.Role)
	}

	err = ensureSuperAdmin(ctx, store, "super@example.com", "secure123", envLocal)
	if err != nil {
		t.Fatalf("expected no error on duplicate admin creation, got: %v", err)
	}
}

func TestRouter_SuperAdminUsers(t *testing.T) {
	store := newStubStorage()
	secret := "test-secret"
	router := newRouter(store, setupLogger(envLocal), secret)

	adminUser := models.User{
		ID:    uuid.New(),
		Email: "super@example.com",
		Role:  models.UserRoleSuperAdmin,
	}
	store.users[adminUser.ID] = adminUser

	targetUserID := uuid.New()
	store.users[targetUserID] = models.User{
		ID:    targetUserID,
		Email: "user@example.com",
		Role:  models.UserRoleAdmin,
	}

	token, _ := auth.NewToken(secret, adminUser, time.Hour)

	t.Run("list users success", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/users", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		res := httptest.NewRecorder()

		router.ServeHTTP(res, req)

		if res.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", res.Code)
		}
	})

	t.Run("delete user success", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/v1/users/"+targetUserID.String(), nil)
		req.Header.Set("Authorization", "Bearer "+token)
		res := httptest.NewRecorder()

		router.ServeHTTP(res, req)

		if res.Code != http.StatusNoContent {
			t.Fatalf("expected status 204, got %d", res.Code)
		}

		if _, exists := store.users[targetUserID]; exists {
			t.Fatal("expected user to be deleted from storage")
		}
	})
}

func TestErrors(t *testing.T) {
	if !errors.Is(storage.ErrNotFound, storage.ErrNotFound) {
		t.Fatal("ErrNotFound should exist")
	}
}
