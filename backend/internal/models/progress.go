package models

import (
	"time"

	"github.com/google/uuid"
)

type ProgressStatus string

const (
	ProgressStarted    ProgressStatus = "started"
	ProgressInProgress ProgressStatus = "in_progress"
	ProgressCompleted  ProgressStatus = "completed"
	ProgressSkipped    ProgressStatus = "skipped"
)

type Progress struct {
	ID          uuid.UUID      `json:"id"`
	ScenarioID  uuid.UUID      `json:"scenario_id"`
	SessionID   string         `json:"session_id"`
	Status      ProgressStatus `json:"status"`
	CurrentStep int            `json:"current_step"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

type UpsertProgressReq struct {
	SessionID   string          `json:"session_id"`
	Status      *ProgressStatus `json:"status,omitempty"`
	CurrentStep *int            `json:"current_step,omitempty"`
}
