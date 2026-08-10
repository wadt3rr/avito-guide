package models

import "testing"

func TestNormalizeScenarioType(t *testing.T) {
	tests := []struct {
		name  string
		value string
		want  ScenarioType
		valid bool
	}{
		{name: "missing type keeps old scenarios compatible", value: "", want: ScenarioTypeTooltip, valid: true},
		{name: "modal is supported", value: "modal", want: ScenarioTypeModal, valid: true},
		{name: "banner is supported", value: "banner", want: ScenarioTypeBanner, valid: true},
		{name: "unknown type is rejected", value: "carousel", want: "", valid: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, valid := NormalizeScenarioType(tt.value)
			if got != tt.want || valid != tt.valid {
				t.Fatalf("NormalizeScenarioType(%q) = (%q, %v), want (%q, %v)", tt.value, got, valid, tt.want, tt.valid)
			}
		})
	}
}
