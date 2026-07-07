package minio

import (
	"context"
	"fmt"
	"github.com/codelym09/Codelym-Nexus/internal/core/domain"
)

type MinioAdapter struct {
	endpoint string
	bucket   string
}

func NewMinioAdapter(endpoint, bucket string) *MinioAdapter {
	return &MinioAdapter{
		endpoint: endpoint,
		bucket:   bucket,
	}
}

func (a *MinioAdapter) SaveRawLog(ctx context.Context, log domain.RawLog) (string, error) {
	// Simulation of S3 PutObject
	fmt.Printf("[MinIO] Saving raw log from source: %s\n", log.Source)
	return fmt.Sprintf("log-%s-%d", log.ID, log.Timestamp.Unix()), nil
}

func (a *MinioAdapter) GetRawLog(ctx context.Context, logID string) (domain.RawLog, error) {
	fmt.Printf("[MinIO] Retrieving raw log: %s\n", logID)
	return domain.RawLog{ID: logID, Content: "Simulated log content"}, nil
}

func (a *MinioAdapter) PurgeRawLog(ctx context.Context, logID string) error {
	fmt.Printf("[MinIO] PURGE: Deleting raw log %s to minimize risk surface\n", logID)
	return nil
}
