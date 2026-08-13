# CloudBuilder — Guia de Setup

Guia completo para configurar o CloudBuilder localmente para desenvolvimento.

## Pré-requisitos

| Ferramenta | Versão Mínima | Verificar |
|------------|---------------|-----------|
| Java | 21 | `java --version` |
| Node.js | 22+ | `node --version` |
| Go | 1.24+ | `go version` |
| Docker | 24+ | `docker --version` |
| Docker Compose | 2.20+ | `docker compose version` |
| Python | 3.10+ (para GEOs) | `python --version` |

## 1. Clonar o Repositório

```bash
git clone https://github.com/cloudbuilder/cloudbuilder.git
cd cloudbuilder
```

## 2. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env

# Editar com suas credenciais
# Obrigatório: DATABASE_URL, JWT_SECRET
# Opcional: APIs de email, OAuth, AI
```

## 3. Infraestrutura (Docker)

```bash
# Subir PostgreSQL
docker compose up -d postgres

# Verificar saúde
docker compose ps
```

## 4. Backend (Java)

```bash
cd backend

# Compilar
./mvnw compile

# Rodar testes
./mvnw test

# Iniciar (dev mode com H2)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# OU rodar com PostgreSQL
./mvnw spring-boot:run
```

Backend disponível em: `http://localhost:8080`

## 5. Frontend (React)

```bash
cd frontend

# Instalar dependências
npm install

# Verificar tipos
npx tsc --noEmit

# Rodar testes
npm test

# Iniciar servidor de desenvolvimento
npm run dev
```

Frontend disponível em: `http://localhost:5173`

## 6. Provision Engine (Go)

```bash
cd provision-engine

# Compilar
go build -o provision-engine ./cmd/provision-engine

# Rodar testes
go test ./...

# Iniciar
./provision-engine serve
```

Engine disponível em: `localhost:50051` (gRPC)

## 7. GEOs (Marketing)

```bash
cd /tmp
git clone https://github.com/matalvesdev/geos.git
cd geos
python -m pip install -e .

# Inicializar no projeto
cd /caminho/para/cloudbuilder
geos --mode brownfield init

# Verificar
geos doctor
```

## Estrutura de Pastas

```
cloudbuilder/
├── frontend/           React 19 + Vite + Tailwind
├── backend/            Java 21 + Spring Boot + Modulith
├── provision-engine/   Go 1.24 + gRPC + Cobra
├── geos/               Marketing (GEOs framework)
├── .doc/               Documentação da empresa
├── opa/                Políticas OPA (Rego)
├── docker-compose.yml  Infraestrutura local
└── .github/workflows/  CI/CD pipelines
```

## Comandos Úteis

```bash
# Verificação completa do projeto
cd frontend && npx tsc --noEmit && npm test && cd ..
cd backend && ./mvnw test && cd ..
cd provision-engine && go test ./... && cd ..

# Build de produção
cd frontend && npm run build
cd backend && ./mvnw package -DskipTests

# Docker full stack
docker compose up --build
```

## Problemas Comuns

### Backend não inicia
- Verifique se PostgreSQL está rodando: `docker compose ps`
- Verifique se a porta 8080 está livre: `lsof -i :8080`

### Testes falham com timeout
- Use `--testTimeout=30000` para testes lentos
- Verifique se o banco H2 não está corrompido

### Frontend mostra erros de tipo
- Execute `npx tsc --noEmit` para ver erros detalhados
- Verifique se todos os imports estão corretos

### Go build falha
- Verifique versão do Go: `go version` (mínimo 1.24)
- Execute `go mod tidy` para limpar dependências
