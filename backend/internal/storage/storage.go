package storage

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/wadt3rr/avito-guide/backend/internal/models"
)

var ErrNotFound = errors.New("not found")

type ScenarioStorage interface {
	CreateScenario(ctx context.Context, scenario *models.Scenario) (uuid.UUID, error)
	GetScenarios(ctx context.Context) ([]models.Scenario, error)
	GetScenarioByID(ctx context.Context, id uuid.UUID) (*models.Scenario, error)
	UpdateScenario(ctx context.Context, id uuid.UUID, req models.UpdateScenarioReq) error
	GetProgress(ctx context.Context, scenarioID uuid.UUID, sessionID string) (*models.Progress, error)
	UpsertProgress(ctx context.Context, scenarioID uuid.UUID, req models.UpsertProgressReq) (*models.Progress, error)
	GetScenarioAnalytics(ctx context.Context, scenarioID uuid.UUID) (*models.ScenarioAnalytics, error)
	CreateAnalyticsEvent(ctx context.Context, req models.CreateEventReq) error
	ResolveScenario(ctx context.Context, req models.ResolveRequest) (*models.Scenario, error)
	CreateAnalyticsEvents(ctx context.Context, events []models.CreateEventReq) error
}
