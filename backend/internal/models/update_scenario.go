package models

type UpdateScenarioReq struct {
	Type         *ScenarioType      `json:"type"`
	Title        *string            `json:"title"`
	Description  *string            `json:"description"`
	Status       *string            `json:"status"`
	Published    *bool              `json:"published"`
	URLPattern   *string            `json:"url_pattern"`
	MatchContext *map[string]string `json:"match_context"`
	Priority     *int               `json:"priority"`
	Steps        *[]Step            `json:"steps"`
}
