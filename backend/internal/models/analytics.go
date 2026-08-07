package models

import (
	"time"

	"github.com/google/uuid"
)

type AnalyticsEventType string

const (
	EventStarted       AnalyticsEventType = "started"
	EventStepCompleted AnalyticsEventType = "step_completed"
	EventFinished      AnalyticsEventType = "finished"
	EventSkipped       AnalyticsEventType = "skipped"

	EventStepShown   AnalyticsEventType = "step_shown"
	EventStepSkipped AnalyticsEventType = "step_skipped"
	EventStepFailed  AnalyticsEventType = "step_failed"
	EventDismissed   AnalyticsEventType = "dismissed"
)

func (t AnalyticsEventType) Valid() bool {
	switch t {
	case EventStarted, EventStepCompleted, EventFinished, EventSkipped,
		EventStepShown, EventStepSkipped, EventStepFailed, EventDismissed:
		return true
	default:
		return false
	}
}

type AnalyticsEvent struct {
	ID         uuid.UUID          `json:"id"`
	ScenarioID uuid.UUID          `json:"scenario_id"`
	SessionID  string             `json:"session_id"`
	StepID     *uuid.UUID         `json:"step_id,omitempty"`
	EventType  AnalyticsEventType `json:"event_type"`
	CreatedAt  time.Time          `json:"created_at"`
}

type CreateEventReq struct {
	ScenarioID uuid.UUID          `json:"scenario_id"`
	SessionID  string             `json:"session_id"`
	AnonID     string             `json:"anon_id,omitempty"`
	StepID     *uuid.UUID         `json:"step_id,omitempty"`
	EventType  AnalyticsEventType `json:"event_type"`
}

type StepStats struct {
	StepID    uuid.UUID `json:"step_id"`
	StepOrder int       `json:"step_order"`
	Title     string    `json:"title"`
	Completed int       `json:"completed"`
}

type ScenarioAnalytics struct {
	ScenarioID uuid.UUID   `json:"scenario_id"`
	Started    int         `json:"started"`
	Finished   int         `json:"finished"`
	Skipped    int         `json:"skipped"`
	Conversion float64     `json:"conversion"`
	Steps      []StepStats `json:"steps"`
}
