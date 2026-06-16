.PHONY: all backend frontend provision dev test clean

all: backend frontend provision

## Backend
backend:
	cd backend && ./mvnw clean compile -q

backend-test:
	cd backend && ./mvnw test -q

backend-package:
	cd backend && ./mvnw package -DskipTests -q

## Frontend
frontend:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-test:
	cd frontend && npm test

frontend-typecheck:
	cd frontend && npm run typecheck

## Provision Engine
provision:
	cd provision-engine && go build ./cmd/provision-engine/

provision-test:
	cd provision-engine && go test ./...

## Docker
docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-build:
	docker compose build

docker-logs:
	docker compose logs -f

## Development
dev-backend:
	cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

dev-frontend:
	cd frontend && npm run dev

dev:
	$(MAKE) -j2 dev-backend dev-frontend

## Quality
lint:
	cd frontend && npm run lint

test: backend-test frontend-test

## Clean
clean:
	cd backend && ./mvnw clean -q
	cd frontend && rm -rf node_modules dist
	rm -rf provision-engine/provision-engine

## Database
db-migrate:
	cd backend && ./mvnw flyway:migrate -q

db-reset:
	docker compose down postgres -v
	docker compose up -d postgres

## Initialize
init: frontend backend-package provision
	@echo "CloudBuilder initialized successfully!"
	@echo "Run 'make dev' to start development servers"
