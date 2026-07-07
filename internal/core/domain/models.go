package domain

import "time"

type Status string

const (
	StatusPending   Status = "PENDING"
	StatusApproved  Status = "APPROVED"
	StatusExecuting Status = "EXECUTING"
	StatusCompleted Status = "COMPLETED"
	StatusFailed    Status = "FAILED"
)

type RawLog struct {
	ID        string    `json:"id"`
	Content   string    `json:"content"`
	Source    string    `json:"source"`
	Timestamp time.Time `json:"timestamp"`
}

type Workflow struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Graph     string    `json:"graph"` // JSON representation of the workflow
	Status    Status    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type Agent struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}
