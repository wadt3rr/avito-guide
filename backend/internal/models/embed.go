package models

type ResolveRequest struct {
	URL       string            `json:"url"`
	AnonID    string            `json:"anon_id"`
	SessionID string            `json:"session_id"`
	Context   map[string]string `json:"context"`
}
