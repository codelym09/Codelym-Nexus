.PHONY: all build run test clean docker-up docker-down

APP_NAME := apa-orchestrator

all: build

build:
	@echo "Building $(APP_NAME)..."
	@go mod tidy
	@go build -o bin/$(APP_NAME) ./cmd/server

run:
	@echo "Running $(APP_NAME)..."
	@./bin/$(APP_NAME)

test:
	@echo "Running tests..."
	@go test ./...

clean:
	@echo "Cleaning up..."
	@rm -f bin/$(APP_NAME)
	@rm -rf bin/

docker-up:
	@echo "Starting Docker infrastructure..."
	@docker-compose -f deploy/docker-compose.yml up -d

docker-down:
	@echo "Stopping Docker infrastructure..."
	@docker-compose -f deploy/docker-compose.yml down

proto-gen:
	@echo "Generating gRPC protobufs..."
	# TODO: Add protobuf generation command here
	# protoc --go_out=. --go-grpc_out=. internal/proto/*.proto

.PHONY: lint
lint:
	@echo "Running linters..."
	@golangci-lint run ./...

install-tools:
	@echo "Installing Go tools..."
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

