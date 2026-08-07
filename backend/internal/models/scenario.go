package models

import (
	"time"

	"github.com/google/uuid"
)

type Scenario struct {
	ID           uuid.UUID         `json:"id"`
	Title        string            `json:"title"`
	Description  *string           `json:"description"`
	Status       string            `json:"status"`
	PublishedAt  *time.Time        `json:"published_at"`
	URLPattern   string            `json:"url_pattern"`
	MatchContext map[string]string `json:"match_context"`
	Priority     int               `json:"priority"`
	Steps        []Step            `json:"steps,omitempty"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
}

func (s Scenario) IsPublished() bool {
	return s.PublishedAt != nil
}
