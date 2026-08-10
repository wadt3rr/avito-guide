package models

type ScenarioType string

const (
	ScenarioTypeTooltip ScenarioType = "tooltip"
	ScenarioTypeModal   ScenarioType = "modal"
	ScenarioTypeBanner  ScenarioType = "banner"
)

func NormalizeScenarioType(value string) (ScenarioType, bool) {
	scenarioType := ScenarioType(value)
	if scenarioType == "" {
		return ScenarioTypeTooltip, true
	}

	switch scenarioType {
	case ScenarioTypeTooltip, ScenarioTypeModal, ScenarioTypeBanner:
		return scenarioType, true
	default:
		return "", false
	}
}
