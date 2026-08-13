package postgres

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wadt3rr/avito-guide/backend/internal/models"
	"github.com/wadt3rr/avito-guide/backend/internal/storage"
)

func testMigrationsPath(t *testing.T) string {
	t.Helper()
	migrationsPath := filepath.Join("..", "..", "..", "migrations")
	if !filepath.IsAbs(migrationsPath) {
		abs, err := filepath.Abs(migrationsPath)
		if err != nil {
			t.Fatalf("failed to resolve migrations path: %v", err)
		}

		migrationsPath = abs
	}

	if _, err := os.Stat(migrationsPath); err != nil {
		t.Fatalf("migrations path %q not found: %v", migrationsPath, err)
	}

	return migrationsPath
}

func testPostgresDSN(t *testing.T) string {
	t.Helper()
	dsn := os.Getenv("TEST_POSTGRES_DSN")

	if dsn == "" {
		t.Skip("TEST_POSTGRES_DSN is not set")
	}

	return dsn
}

func dsnToURL(t *testing.T, cfg *pgx.ConnConfig) string {
	t.Helper()

	u := &url.URL{
		Scheme: "postgres",
		Host:   cfg.Host,
		Path:   "/" + cfg.Database,
	}

	if cfg.User != "" {
		if cfg.Password != "" {
			u.User = url.UserPassword(cfg.User, string(cfg.Password))
		} else {
			u.User = url.User(cfg.User)
		}
	}

	query := url.Values{}
	for key, value := range cfg.RuntimeParams {
		query.Set(key, value)
	}

	if cfg.Port != 0 && !strings.Contains(u.Host, ":") {
		u.Host = fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	}

	if query.Encode() != "" {
		u.RawQuery = query.Encode()
	}

	return u.String()
}

func setupTestDatabase(ctx context.Context, t *testing.T) (string, func()) {
	t.Helper()
	baseDSN := testPostgresDSN(t)
	cfg, err := pgx.ParseConfig(baseDSN)

	if err != nil {
		t.Fatalf("failed to parse TEST_POSTGRES_DSN: %v", err)
	}

	adminCfg := *cfg
	adminCfg.Database = "postgres"
	adminDSN := dsnToURL(t, &adminCfg)
	adminPool, err := pgxpool.New(ctx, adminDSN)

	if err != nil {
		t.Fatalf("failed to connect to postgres admin database: %v", err)
	}

	testDB := fmt.Sprintf("avito_test_%s", strings.ReplaceAll(uuid.NewString(), "-", "_"))
	if _, err := adminPool.Exec(ctx, fmt.Sprintf(
		"CREATE DATABASE %s TEMPLATE template0",
		pgx.Identifier{testDB}.Sanitize(),
	)); err != nil {
		adminPool.Close()
		t.Fatalf("failed to create test database %q: %v", testDB, err)
	}

	cleanup := func() {
		_, _ = adminPool.Exec(ctx, fmt.Sprintf("DROP DATABASE IF EXISTS %s WITH (FORCE)", pgx.Identifier{testDB}.Sanitize()))
		adminPool.Close()
	}

	cfg.Database = testDB
	testDSN := dsnToURL(t, cfg)
	return testDSN, cleanup
}

func TestNewStorage_Integration(t *testing.T) {
	cases := []struct {
		name      string
		wantEmpty bool
		wantErr   bool
	}{
		{name: "fresh storage returns no scenarios", wantEmpty: true},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			dsn, cleanup := setupTestDatabase(ctx, t)
			t.Cleanup(cleanup)

			store, err := NewStorage(ctx, dsn, testMigrationsPath(t))
			if (err != nil) != tt.wantErr {
				t.Fatalf("NewStorage() error = %v, wantErr %v", err, tt.wantErr)
			}

			if err != nil {
				return
			}

			defer store.Close()

			scenarios, err := store.GetScenarios(ctx)
			if err != nil {
				t.Fatalf("GetScenarios() error = %v", err)
			}

			if tt.wantEmpty && len(scenarios) != 0 {
				t.Fatalf("expected empty scenario list, got %d", len(scenarios))
			}
		})
	}
}

func TestStorage_CreateAndGetScenario(t *testing.T) {
	cases := []struct {
		name          string
		scenario      models.Scenario
		wantTitle     string
		wantStepCount int
	}{
		{
			name: "create scenario with one step",
			scenario: models.Scenario{
				Type:        models.ScenarioBanner,
				Title:       "Test scenario",
				Description: ptrString("Scenario description"),
				Status:      "draft",
				Steps: []models.Step{{
					Title:       "First step",
					Description: ptrString("First description"),
					Content:     "Click button",
					Selector:    "button.submit",
					ActionType:  "click",
					Condition:   "always",
					TimeoutSec:  5,
				}},
			},
			wantTitle:     "Test scenario",
			wantStepCount: 1,
		},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			dsn, cleanup := setupTestDatabase(ctx, t)
			t.Cleanup(cleanup)

			store, err := NewStorage(ctx, dsn, testMigrationsPath(t))
			if err != nil {
				t.Fatalf("NewStorage failed: %v", err)
			}

			defer store.Close()

			id, err := store.CreateScenario(ctx, &tt.scenario)
			if err != nil {
				t.Fatalf("CreateScenario failed: %v", err)
			}

			if id == uuid.Nil {
				t.Fatal("CreateScenario returned empty uuid")
			}

			scenarios, err := store.GetScenarios(ctx)
			if err != nil {
				t.Fatalf("GetScenarios failed: %v", err)
			}

			if len(scenarios) != 1 {
				t.Fatalf("expected 1 scenario, got %d", len(scenarios))
			}

			if scenarios[0].Title != tt.wantTitle {
				t.Fatalf("expected title %q, got %q", tt.wantTitle, scenarios[0].Title)
			}
			if scenarios[0].Type != models.ScenarioBanner {
				t.Fatalf("expected banner type, got %q", scenarios[0].Type)
			}

			retrieved, err := store.GetScenarioByID(ctx, id)
			if err != nil {
				t.Fatalf("GetScenarioByID failed: %v", err)
			}

			if retrieved.Title != tt.wantTitle {
				t.Fatalf("expected title %q, got %q", tt.wantTitle, retrieved.Title)
			}
			if retrieved.Type != models.ScenarioBanner {
				t.Fatalf("expected banner type, got %q", retrieved.Type)
			}

			if len(retrieved.Steps) != tt.wantStepCount {
				t.Fatalf("expected %d steps, got %d", tt.wantStepCount, len(retrieved.Steps))
			}
		})
	}
}

func TestStorage_GetScenarioByID(t *testing.T) {
	cases := []struct {
		name      string
		prepare   bool
		wantErr   error
		wantTitle string
		wantSteps int
	}{
		{
			name:    "scenario not found",
			prepare: false,
			wantErr: storage.ErrNotFound,
		},
		{
			name:      "scenario found",
			prepare:   true,
			wantErr:   nil,
			wantTitle: "Find me",
			wantSteps: 1,
		},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			dsn, cleanup := setupTestDatabase(ctx, t)
			t.Cleanup(cleanup)

			store, err := NewStorage(ctx, dsn, testMigrationsPath(t))
			if err != nil {
				t.Fatalf("NewStorage failed: %v", err)
			}

			defer store.Close()

			id := uuid.New()
			if tt.prepare {
				scenario := models.Scenario{
					Title:       tt.wantTitle,
					Description: ptrString("Prepared scenario"),
					Status:      "draft",
					Steps: []models.Step{{
						Title:      "Step",
						Content:    "Do it",
						Selector:   "#go",
						ActionType: "click",
						Condition:  "always",
						TimeoutSec: 1,
					}},
				}

				id, err = store.CreateScenario(ctx, &scenario)
				if err != nil {
					t.Fatalf("CreateScenario failed: %v", err)
				}
			}

			scenario, err := store.GetScenarioByID(ctx, id)
			if err != tt.wantErr {
				t.Fatalf("GetScenarioByID() error = %v, want %v", err, tt.wantErr)
			}

			if err != nil {
				return
			}

			if scenario.Title != tt.wantTitle {
				t.Fatalf("expected title %q, got %q", tt.wantTitle, scenario.Title)
			}

			if len(scenario.Steps) != tt.wantSteps {
				t.Fatalf("expected %d steps, got %d", tt.wantSteps, len(scenario.Steps))
			}
		})
	}
}

func TestStorage_UpdateScenario(t *testing.T) {
	cases := []struct {
		name       string
		prepare    bool
		req        models.UpdateScenarioReq
		wantErr    error
		wantTitle  string
		wantStatus string
		wantType   models.ScenarioType
		wantSteps  int
	}{
		{
			name:    "update missing scenario",
			prepare: false,
			req: models.UpdateScenarioReq{
				Title: ptrString("Missing title"),
			},
			wantErr: storage.ErrNotFound,
		},
		{
			name:    "update existing scenario",
			prepare: true,
			req: models.UpdateScenarioReq{
				Title:  ptrString("Updated scenario"),
				Type:   ptrScenarioType(models.ScenarioModal),
				Status: ptrString("active"),
				Steps: &[]models.Step{{
					Title:      "Updated step",
					Content:    "Type text",
					Selector:   "input.text",
					ActionType: "type",
					Condition:  "visible",
					TimeoutSec: 10,
				}},
			},
			wantErr:    nil,
			wantTitle:  "Updated scenario",
			wantStatus: "active",
			wantType:   models.ScenarioModal,
			wantSteps:  1,
		},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			dsn, cleanup := setupTestDatabase(ctx, t)
			t.Cleanup(cleanup)

			store, err := NewStorage(ctx, dsn, testMigrationsPath(t))
			if err != nil {
				t.Fatalf("NewStorage failed: %v", err)
			}

			defer store.Close()

			id := uuid.New()
			if tt.prepare {
				scenario := models.Scenario{
					Title:       "Initial scenario",
					Description: ptrString("Initial description"),
					Status:      "draft",
					Steps: []models.Step{{
						Title:      "Initial step",
						Content:    "Click it",
						Selector:   ".btn",
						ActionType: "click",
						Condition:  "always",
						TimeoutSec: 5,
					}},
				}

				id, err = store.CreateScenario(ctx, &scenario)
				if err != nil {
					t.Fatalf("CreateScenario failed: %v", err)
				}
			}

			err = store.UpdateScenario(ctx, id, tt.req)
			if err != tt.wantErr {
				t.Fatalf("UpdateScenario() error = %v, want %v", err, tt.wantErr)
			}

			if err != nil {
				return
			}

			updated, err := store.GetScenarioByID(ctx, id)
			if err != nil {
				t.Fatalf("GetScenarioByID failed: %v", err)
			}

			if updated.Title != tt.wantTitle {
				t.Fatalf("expected title %q, got %q", tt.wantTitle, updated.Title)
			}

			if updated.Status != tt.wantStatus {
				t.Fatalf("expected status %q, got %q", tt.wantStatus, updated.Status)
			}
			if updated.Type != tt.wantType {
				t.Fatalf("expected type %q, got %q", tt.wantType, updated.Type)
			}

			if len(updated.Steps) != tt.wantSteps {
				t.Fatalf("expected %d steps, got %d", tt.wantSteps, len(updated.Steps))
			}
		})
	}
}

func TestStorage_DeleteScenarioCascade(t *testing.T) {
	ctx := context.Background()
	dsn, cleanup := setupTestDatabase(ctx, t)
	t.Cleanup(cleanup)

	store, err := NewStorage(ctx, dsn, testMigrationsPath(t))
	if err != nil {
		t.Fatalf("NewStorage failed: %v", err)
	}
	defer store.Close()

	scenarioID := uuid.New()
	_, err = store.CreateScenario(ctx, &models.Scenario{
		ID:     scenarioID,
		Type:   models.ScenarioTooltip,
		Title:  "Delete me",
		Status: "draft",
		Steps: []models.Step{{
			Title:      "Step",
			Content:    "Complete it",
			Selector:   "#target",
			ActionType: "next",
			Condition:  "always",
		}},
	})
	if err != nil {
		t.Fatalf("CreateScenario failed: %v", err)
	}

	created, err := store.GetScenarioByID(ctx, scenarioID)
	if err != nil {
		t.Fatalf("GetScenarioByID failed: %v", err)
	}
	if len(created.Steps) != 1 {
		t.Fatalf("expected one step, got %d", len(created.Steps))
	}

	_, err = store.UpsertProgress(ctx, scenarioID, models.UpsertProgressReq{
		SessionID: "delete-session",
		Status:    ptrProgressStatus(models.ProgressInProgress),
	})
	if err != nil {
		t.Fatalf("UpsertProgress failed: %v", err)
	}
	if err := store.CreateAnalyticsEvent(ctx, models.CreateEventReq{
		ScenarioID: scenarioID,
		SessionID:  "delete-session",
		StepID:     &created.Steps[0].ID,
		EventType:  models.EventStepCompleted,
	}); err != nil {
		t.Fatalf("CreateAnalyticsEvent failed: %v", err)
	}

	if err := store.DeleteScenario(ctx, scenarioID); err != nil {
		t.Fatalf("DeleteScenario failed: %v", err)
	}
	if _, err := store.GetScenarioByID(ctx, scenarioID); err != storage.ErrNotFound {
		t.Fatalf("expected ErrNotFound after delete, got %v", err)
	}

	for _, table := range []string{"steps", "user_scenario_progress", "analytics_events"} {
		var count int
		query := fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE scenario_id = $1", pgx.Identifier{table}.Sanitize())
		if err := store.pool.QueryRow(ctx, query, scenarioID).Scan(&count); err != nil {
			t.Fatalf("count %s rows: %v", table, err)
		}
		if count != 0 {
			t.Fatalf("expected %s rows to be deleted, got %d", table, count)
		}
	}
}

func TestStorage_ProgressAndAnalytics(t *testing.T) {
	cases := []struct {
		name    string
		prepare func(t *testing.T, ctx context.Context, store *Storage)
		assert  func(t *testing.T, ctx context.Context, store *Storage)
		wantErr bool
	}{
		{
			name: "progress upsert and read",
			prepare: func(t *testing.T, ctx context.Context, store *Storage) {
				scenarioID := uuid.New()
				_, err := store.CreateScenario(ctx, &models.Scenario{ID: scenarioID, Title: "Progress scenario", Status: "draft"})
				if err != nil {
					t.Fatalf("CreateScenario failed: %v", err)
				}
			},
			assert: func(t *testing.T, ctx context.Context, store *Storage) {
				scenarioID := uuid.New()
				_, _ = store.CreateScenario(ctx, &models.Scenario{ID: scenarioID, Title: "Progress scenario", Status: "draft"})
				progress, err := store.UpsertProgress(ctx, scenarioID, models.UpsertProgressReq{SessionID: "s1", Status: ptrProgressStatus(models.ProgressInProgress), CurrentStep: ptrInt(2)})
				if err != nil {
					t.Fatalf("UpsertProgress failed: %v", err)
				}
				if progress.SessionID != "s1" {
					t.Fatalf("expected session id s1, got %s", progress.SessionID)
				}
				fetched, err := store.GetProgress(ctx, scenarioID, "s1")
				if err != nil {
					t.Fatalf("GetProgress failed: %v", err)
				}
				if fetched.CurrentStep != 2 {
					t.Fatalf("expected current step 2, got %d", fetched.CurrentStep)
				}
			},
		},
		{
			name: "analytics event and summary",
			assert: func(t *testing.T, ctx context.Context, store *Storage) {
				scenarioID := uuid.New()
				_, err := store.CreateScenario(ctx, &models.Scenario{ID: scenarioID, Title: "Analytics scenario", Status: "draft"})
				if err != nil {
					t.Fatalf("CreateScenario failed: %v", err)
				}
				if err := store.CreateAnalyticsEvent(ctx, models.CreateEventReq{ScenarioID: scenarioID, SessionID: "session-1", EventType: models.EventStarted}); err != nil {
					t.Fatalf("CreateAnalyticsEvent failed: %v", err)
				}
				if err := store.CreateAnalyticsEvent(ctx, models.CreateEventReq{ScenarioID: scenarioID, SessionID: "session-1", EventType: models.EventFinished}); err != nil {
					t.Fatalf("CreateAnalyticsEvent failed: %v", err)
				}
				analytics, err := store.GetScenarioAnalytics(ctx, scenarioID)
				if err != nil {
					t.Fatalf("GetScenarioAnalytics failed: %v", err)
				}
				if analytics.Started != 1 || analytics.Finished != 1 {
					t.Fatalf("expected started=1 finished=1, got %+v", analytics)
				}
			},
		},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			dsn, cleanup := setupTestDatabase(ctx, t)
			t.Cleanup(cleanup)

			store, err := NewStorage(ctx, dsn, testMigrationsPath(t))
			if err != nil {
				t.Fatalf("NewStorage failed: %v", err)
			}
			defer store.Close()

			if tt.prepare != nil {
				tt.prepare(t, ctx, store)
			}
			if tt.assert != nil {
				tt.assert(t, ctx, store)
			}
		})
	}
}

func TestStorage_Users(t *testing.T) {
	cases := []struct {
		name    string
		prepare func(t *testing.T, ctx context.Context, store *Storage) (uuid.UUID, string)
		assert  func(t *testing.T, ctx context.Context, store *Storage, id uuid.UUID, email string)
	}{
		{
			name: "create and get user success",
			prepare: func(t *testing.T, ctx context.Context, store *Storage) (uuid.UUID, string) {
				id := uuid.New()
				email := "testuser@example.com"

				_, err := store.CreateUser(ctx, &models.User{
					ID:           id,
					Email:        email,
					PasswordHash: "hashed_password_123",
					Role:         "user",
					CreatedAt:    time.Now().UTC(),
					UpdatedAt:    time.Now().UTC(),
				})
				if err != nil {
					t.Fatalf("CreateUser failed: %v", err)
				}

				return id, email
			},
			assert: func(t *testing.T, ctx context.Context, store *Storage, id uuid.UUID, email string) {
				u1, err := store.GetUserByEmail(ctx, email)
				if err != nil {
					t.Fatalf("GetUserByEmail failed: %v", err)
				}

				if u1.ID != id {
					t.Fatalf("GetUserByEmail: expected id %s, got %s", id, u1.ID)
				}

				if u1.Email != email {
					t.Fatalf("GetUserByEmail: expected email %s, got %s", email, u1.Email)
				}

				u2, err := store.GetUserByID(ctx, id)
				if err != nil {
					t.Fatalf("GetUserByID failed: %v", err)
				}

				if u2.Email != email {
					t.Fatalf("GetUserByID: expected email %s, got %s", email, u2.Email)
				}
			},
		},
		{
			name: "get user by email not found",
			prepare: func(t *testing.T, ctx context.Context, store *Storage) (uuid.UUID, string) {
				return uuid.New(), "missing@example.com"
			},
			assert: func(t *testing.T, ctx context.Context, store *Storage, _ uuid.UUID, email string) {
				_, err := store.GetUserByEmail(ctx, email)
				if err != storage.ErrNotFound {
					t.Fatalf("expected ErrNotFound, got %v", err)
				}
			},
		},
		{
			name: "get user by id not found",
			prepare: func(t *testing.T, ctx context.Context, store *Storage) (uuid.UUID, string) {
				return uuid.New(), "doesntmatter@example.com"
			},
			assert: func(t *testing.T, ctx context.Context, store *Storage, id uuid.UUID, _ string) {
				_, err := store.GetUserByID(ctx, id)
				if err != storage.ErrNotFound {
					t.Fatalf("expected ErrNotFound, got %v", err)
				}
			},
		},
		{
			name: "list users success",
			prepare: func(t *testing.T, ctx context.Context, store *Storage) (uuid.UUID, string) {
				id1 := uuid.New()
				id2 := uuid.New()

				_, _ = store.CreateUser(ctx, &models.User{
					ID:           id1,
					Email:        "user1@example.com",
					PasswordHash: "hash1",
					Role:         "admin",
					CreatedAt:    time.Now().UTC(),
					UpdatedAt:    time.Now().UTC(),
				})
				_, _ = store.CreateUser(ctx, &models.User{
					ID:           id2,
					Email:        "user2@example.com",
					PasswordHash: "hash2",
					Role:         "superadmin",
					CreatedAt:    time.Now().UTC(),
					UpdatedAt:    time.Now().UTC(),
				})
				return uuid.Nil, ""
			},
			assert: func(t *testing.T, ctx context.Context, store *Storage, _ uuid.UUID, _ string) {
				users, err := store.ListUsers(ctx)
				if err != nil {
					t.Fatalf("ListUsers failed: %v", err)
				}
				if len(users) != 2 {
					t.Fatalf("expected 2 users, got %d", len(users))
				}
			},
		},
		{
			name: "delete user success",
			prepare: func(t *testing.T, ctx context.Context, store *Storage) (uuid.UUID, string) {
				id := uuid.New()
				_, _ = store.CreateUser(ctx, &models.User{
					ID:           id,
					Email:        "todelete@example.com",
					PasswordHash: "hash",
					Role:         "admin",
					CreatedAt:    time.Now().UTC(),
					UpdatedAt:    time.Now().UTC(),
				})
				return id, ""
			},
			assert: func(t *testing.T, ctx context.Context, store *Storage, id uuid.UUID, _ string) {
				err := store.DeleteUser(ctx, id)
				if err != nil {
					t.Fatalf("DeleteUser failed: %v", err)
				}

				_, err = store.GetUserByID(ctx, id)
				if err != storage.ErrNotFound {
					t.Fatalf("expected ErrNotFound after deletion, got %v", err)
				}
			},
		},
		{
			name: "delete user not found",
			prepare: func(t *testing.T, ctx context.Context, store *Storage) (uuid.UUID, string) {
				return uuid.New(), ""
			},
			assert: func(t *testing.T, ctx context.Context, store *Storage, id uuid.UUID, _ string) {
				err := store.DeleteUser(ctx, id)
				if err != storage.ErrNotFound {
					t.Fatalf("expected ErrNotFound for missing user, got %v", err)
				}
			},
		},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			dsn, cleanup := setupTestDatabase(ctx, t)
			t.Cleanup(cleanup)

			store, err := NewStorage(ctx, dsn, testMigrationsPath(t))
			if err != nil {
				t.Fatalf("NewStorage failed: %v", err)
			}
			defer store.Close()

			var id uuid.UUID
			var email string

			if tt.prepare != nil {
				id, email = tt.prepare(t, ctx, store)
			}

			if tt.assert != nil {
				tt.assert(t, ctx, store, id, email)
			}
		})
	}
}

func ptrString(value string) *string {
	return &value
}

func ptrInt(value int) *int {
	return &value
}

func ptrProgressStatus(value models.ProgressStatus) *models.ProgressStatus {
	return &value
}

func ptrScenarioType(value models.ScenarioType) *models.ScenarioType {
	return &value
}
