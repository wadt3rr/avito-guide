package models

type UpdateScenarioReq struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Status      *string `json:"status"`
	Steps       *[]Step `json:"steps"`
}
