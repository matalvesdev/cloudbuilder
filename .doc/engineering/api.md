# Referência de API — CloudBuilder

## Base URL

```
https://api.cloudbuilder.com/api/v1
```

## Autenticação

```http
Authorization: Bearer <jwt_token>
```

## Endpoints Principais

### Auth
| Método | Path                    | Descrição               |
| ------ | ----------------------- | ----------------------- |
| POST   | `/auth/login`           | Login                   |
| POST   | `/auth/register`        | Registro                |
| POST   | `/auth/forgot-password` | Recuperar senha         |
| POST   | `/auth/reset-password`  | Resetar senha           |
| GET    | `/auth/me`              | Dados do usuário        |

### Design
| Método | Path                            | Descrição           |
| ------ | ------------------------------- | ------------------- |
| POST   | `/canvases`                     | Criar canvas        |
| GET    | `/canvases`                     | Listar canvases     |
| GET    | `/canvases/{id}`                | Obter canvas        |
| PUT    | `/canvases/{id}`                | Atualizar canvas    |
| DELETE | `/canvases/{id}`                | Deletar canvas      |
| POST   | `/canvases/{id}/nodes`          | Adicionar node      |
| POST   | `/canvases/{id}/edges`          | Adicionar edge      |
| POST   | `/canvases/{id}/validate`       | Validar design      |
| POST   | `/canvases/{id}/generate`       | Gerar Terraform     |
| GET    | `/canvases/{id}/versions`       | Listar versões      |

### Provision
| Método | Path                                  | Descrição           |
| ------ | ------------------------------------- | ------------------- |
| POST   | `/canvases/{id}/generate`             | Gerar código        |
| GET    | `/environments/{id}/resources`        | Listar recursos     |
| POST   | `/environments/{id}/sync`             | Sincronizar         |
| GET    | `/environments/{id}/drift`            | Detectar drift      |

### Observe
| Método | Path                                | Descrição           |
| ------ | ----------------------------------- | ------------------- |
| GET    | `/observe/dashboard/{envId}`        | Dashboard           |
| POST   | `/observe/health`                   | Health check        |
| GET    | `/observe/alerts/{envId}`           | Alertas             |
| POST   | `/observe/alerts/{alertId}/resolve` | Resolver alerta     |
| GET    | `/observe/slos`                     | Listar SLOs         |

### Cost
| Método | Path                           | Descrição           |
| ------ | ------------------------------ | ------------------- |
| GET    | `/cost/overview/{envId}`       | Overview            |
| POST   | `/cost/records`                | Criar record        |
| GET    | `/cost/records/{envId}`        | Listar records      |
| POST   | `/cost/budgets`                | Criar budget        |
| GET    | `/cost/budgets/{envId}`        | Listar budgets      |
| POST   | `/cost/estimate/preview`       | Preview de custo    |

### AIOps
| Método | Path                    | Descrição               |
| ------ | ----------------------- | ----------------------- |
| GET    | `/aiops/incidents`      | Listar incidentes       |
| POST   | `/aiops/incidents`      | Criar incidente         |
| POST   | `/aiops/query`          | Consulta IA             |

### IAM
| Método | Path                    | Descrição               |
| ------ | ----------------------- | ----------------------- |
| GET    | `/iam/users`            | Listar usuários         |
| POST   | `/iam/tenants`          | Criar tenant            |
| GET    | `/iam/tenants`          | Listar tenants          |

### Feature Flags
| Método | Path                       | Descrição           |
| ------ | -------------------------- | ------------------- |
| GET    | `/feature-flags`           | Listar flags        |
| POST   | `/feature-flags`           | Criar flag          |
| PUT    | `/feature-flags/{key}`     | Atualizar flag      |
| GET    | `/feature-flags/{key}/check`| Verificar flag     |

### Audit
| Método | Path              | Descrição           |
| ------ | ----------------- | ------------------- |
| GET    | `/audit/events`   | Listar eventos      |
