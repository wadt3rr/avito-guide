package report

import (
	"bytes"
	"testing"

	"github.com/google/uuid"
	"github.com/wadt3rr/avito-guide/backend/internal/models"
)

func TestAnalyticsPDF(t *testing.T) {
	scenarioID := uuid.New()
	pdf, err := AnalyticsPDF(
		&models.Scenario{ID: scenarioID, Title: "Первая доставка"},
		&models.ScenarioAnalytics{
			ScenarioID: scenarioID,
			Started:    10,
			Finished:   6,
			Conversion: 60,
			Steps: []models.StepStats{{
				StepID:    uuid.New(),
				StepOrder: 1,
				Title:     "Упакуйте товар",
				Completed: 8,
			}},
		},
	)
	if err != nil {
		t.Fatalf("AnalyticsPDF() error = %v", err)
	}
	if !bytes.HasPrefix(pdf, []byte("%PDF-")) {
		t.Fatalf("expected PDF header, got %q", pdf[:min(len(pdf), 8)])
	}
	if len(pdf) < 5_000 {
		t.Fatalf("expected embedded-font report, got only %d bytes", len(pdf))
	}
}
