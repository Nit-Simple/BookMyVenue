include .env
export

.PHONY: run build down up

up:
	docker compose up -d venue-db venue-cache
run:
	go run ./cmd/server/
down:
	docker compose down
