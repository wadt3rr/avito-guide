package models

import (
	"github.com/google/uuid"
)

type Step struct {
	ID          uuid.UUID `json:"id"`
	ScenarioID  uuid.UUID `json:"scenario_id"`
	StepOrder   int       `json:"step_order"`
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	Content     string    `json:"content"`  // текст подсказки
	Selector    string    `json:"selector"` // CSS-селектор
	ActionType  string    `json:"action_type"`
	Condition   string    `json:"condition"`
	TimeoutSec  int       `json:"timeout_sec"` // 0 = без таймаута
}
