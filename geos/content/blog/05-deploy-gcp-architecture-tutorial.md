# Tutorial: Deploy uma Arquitetura Completa no GCP em 10 minutos com CloudBuilder

**Autor**: CloudBuilder Team | **Leitura**: 11 min | **Categoria**: Tutorial

---

## O que vamos construir

Neste tutorial, você vai deployar uma arquitetura web completa no Google Cloud Platform:

```
Internet
    ↓
┌──────────────┐
│   main-vpc   │ (Google Compute Network)
└──────┬───────┘
       │
┌──────┴───────┐
│  main-subnet │ (Google Compute Subnetwork)
└──┬───────┬───┘
   │       │
   ↓       ↓
┌──────┐ ┌──────────┐
│ web- │ │  app-db  │
│server│ │ (Cloud   │
│(VM)  │ │  SQL)    │
└──────┘ └──────────┘
```

**Recursos:** 1 VPC + 1 Subnet + 1 VM + 1 Cloud SQL
**Custo estimado:** ~R$ 215/mês
**Tempo:** 10 minutos

## Pré-requisitos

1. Conta no [cloudbuilder.io](https://cloudbuilder.io)
2. Conta no GCP com projeto criado
3. Service Account com roles: `roles/compute.admin`, `roles/cloudsql.admin`
4. Docker (para testar localmente)

## Passo 1: Acessar o CloudBuilder

Abra [app.cloudbuilder.io](https://app.cloudbuilder.io) e faça login.

Se preferir rodar localmente:

```bash
git clone https://github.com/cloudbuilder/cloudbuilder.git
cd cloudbuilder
docker compose up -d
# Acesse http://localhost:3000
```

## Passo 2: Criar um Novo Canvas

1. Clique em **"Novo Design"** no menu lateral
2. Nomeie: **"GCP Web App — Tutorial"**
3. O canvas infinito aparece vazio

## Passo 3: Adicionar a VPC

1. No painel lateral esquerdo, expanda a categoria **"Network"**
2. Arraste **"VPC Network"** para o canvas
3. Clique no nó para abrir o painel de propriedades
4. Configure:

| Propriedade | Valor |
|-------------|-------|
| Name | `main-vpc` |
| Auto Create Subnetworks | `false` |
| Routing Mode | `REGIONAL` |

**Por que `auto_create_subnetworks = false`?**
Em produção, você quer controle total sobre subnets. Auto-create cria uma subnet por região com configurações padrão — geralmente não é o que você quer.

## Passo 4: Adicionar a Subnet

1. Arraste **"Subnetwork"** para o canvas (abaixo da VPC)
2. Conecte: clique na borda direita da VPC → arraste até a Subnet
3. Configure:

| Propriedade | Valor |
|-------------|-------|
| Name | `main-subnet` |
| IP CIDR Range | `10.0.1.0/24` |
| Region | `us-central1` |

**O que é o CIDR `10.0.1.0/24`?**
- `/24` = 256 endereços IP
- `10.0.1.0` = range dentro do VPC
- Suporta até 251 VMs (5 endereços reservados pelo GCP)

## Passo 5: Adicionar a VM

1. Arraste **"Compute Instance"** para o canvas (à direita da subnet)
2. Conecte: Subnet → VM
3. Configure:

| Propriedade | Valor |
|-------------|-------|
| Name | `web-server` |
| Machine Type | `e2-medium` |
| Zone | `us-central1-a` |
| Boot Disk Image | `debian-cloud/debian-11` |
| Subnetwork | `main-subnet` |

**Por que `e2-medium`?**
- 2 vCPUs, 4 GB RAM
- Custo: ~R$ 120/mês
- Suficiente para web servers, APIs, e aplicações médias
- Para produção, considere `e2-standard-4` ou `n2-standard-4`

## Passo 6: Adicionar o Cloud SQL

1. Arraste **"Cloud SQL Instance"** para o canvas (abaixo da VM)
2. Conecte: Subnet → SQL
3. Configure:

| Propriedade | Valor |
|-------------|-------|
| Name | `app-db` |
| Database Version | `POSTGRES_14` |
| Region | `us-central1` |
| Tier | `db-f1-micro` |

**Por que `db-f1-micro`?**
- 1 vCPU, 0.6 GB RAM
- Custo: ~R$ 95/mês
- Perfeito para desenvolvimento e testes
- Para produção, use `db-custom-2-7680` ou superior

## Passo 7: Revisar a Arquitetura

O canvas agora mostra:

```
┌──────────────┐
│   main-vpc   │  🟢 VALID
│   VPC Network│
└──────┬───────┘
       │
┌──────┴───────┐
│  main-subnet │  🟢 VALID
│  10.0.1.0/24 │
└──┬───────┬───┘
   │       │
   ↓       ↓
┌──────┐ ┌──────────┐
│ web- │ │  app-db  │
│server│ │ POSTGRES │
│ e2-  │ │ db-f1-   │
│medium│ │ micro    │
└──────┘ └──────────┘
  🟢        🟢
```

Todos os nós estão **verdes** (validados). Se algum estiver vermelho, verifique as propriedades.

## Passo 8: Gerar Terraform

1. Clique no botão **"Gerar Código"** na toolbar
2. O CloudBuilder gera 5 arquivos:

### main.tf (preview)

```hcl
resource "google_compute_network" "main-vpc" {
  name                    = "main-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  project                 = var.gcp_project_id
}

resource "google_compute_subnetwork" "main-subnet" {
  name          = "main-subnet"
  network       = "main-vpc"
  ip_cidr_range = "10.0.1.0/24"
  region        = "us-central1"
  project       = var.gcp_project_id
}

resource "google_compute_instance" "web-server" {
  name         = "web-server"
  machine_type = "e2-medium"
  zone         = "us-central1-a"
  project      = var.gcp_project_id
  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }
  network_interface {
    subnetwork = "main-subnet"
    access_config {}
  }
}

resource "google_sql_database_instance" "app-db" {
  name             = "app-db"
  database_version = "POSTGRES_14"
  region           = "us-central1"
  project          = var.gcp_project_id
  settings {
    tier = "db-f1-micro"
  }
  deletion_protection = false
}
```

### Verifique o código

Antes de provisionar, revise:
- ✅ `auto_create_subnetworks = false` (VPC production-ready)
- ✅ `ip_cidr_range = "10.0.1.0/24"` (subnet válida)
- ✅ `image = "debian-cloud/debian-11"` (image correta)
- ✅ `deletion_protection = false` (para tutorial — em produção, use `true`)

## Passo 9: Configurar Credenciais

1. Clique em **"Configurar Credenciais"**
2. Selecione **"Google Cloud Platform"**
3. Preencha:

| Campo | Valor |
|-------|-------|
| Nome | `GCP Tutorial` |
| Service Account Key | Cole o JSON da Service Account |

### Como obter a Service Account Key

```bash
# No Google Cloud Console ou via gcloud:
gcloud iam service-accounts create cloudbuilder-tutorial \
  --display-name="CloudBuilder Tutorial"

gcloud iam service-accounts keys create key.json \
  --iam-account=cloudbuilder-tutorial@my-project.iam.gserviceaccount.com

# Atribuir roles:
gcloud projects add-iam-policy-binding my-project \
  --member="serviceAccount:cloudbuilder-tutorial@my-project.iam.gserviceaccount.com" \
  --role="roles/compute.admin"

gcloud projects add-iam-policy-binding my-project \
  --member="serviceAccount:cloudbuilder-tutorial@my-project.iam.gserviceaccount.com" \
  --role="roles/cloudsql.admin"
```

**⚠️ Segurança:** A chave JSON é criptografada com AES-256-GCM antes de ser armazenada. Nunca é logada ou exportada.

## Passo 10: Provisionar

1. Clique em **"Provisionar"**
2. Selecione a credencial criada
3. Revise o preview:
   - Provider: Google Cloud
   - Resources: 4
   - Engine: Terraform
4. Clique em **"Executar Provisionamento"**

### O que acontece nos bastidores

```
1. Backend gera Terraform files
    ↓
2. Backend injeta GOOGLE_CREDENTIALS como env var
    ↓
3. Go engine recebe payload via REST
    ↓
4. Go engine cria diretório temporário
    ↓
5. terraform init (download google provider)
    ↓
6. terraform plan (preview de mudanças)
    ↓
7. terraform apply (cria 4 recursos no GCP)
    ↓
8. Status: SUCCESS
    ↓
9. Canvas limpo automaticamente (pronto para novo design)
```

### Tempo de execução

| Etapa | Tempo |
|-------|-------|
| terraform init | ~15s |
| terraform plan | ~5s |
| terraform apply | ~60s |
| **Total** | **~80s** |

## Passo 11: Verificar no GCP

Abra o Console do GCP e verifique:

```bash
# Verificar VPC
gcloud compute networks list
# NAME     SUBNET_MODE  ROUTE_MODE
# main-vpc REGIONAL    REGIONAL

# Verificar Subnet
gcloud compute networks subnets list
# NAME          REGION       NETWORK    RANGE
# main-subnet   us-central1  main-vpc   10.0.1.0/24

# Verificar VM
gcloud compute instances list
# NAME         ZONE           MACHINE_TYPE  STATUS
# web-server   us-central1-a  e2-medium     RUNNING

# Verificar Cloud SQL
gcloud sql instances list
# NAME    DATABASE_VERSION  TIER          REGION
# app-db  POSTGRES_14       db-f1-micro   us-central1
```

**Todos os 4 recursos estão rodando!**

## Passo 12: Monitorar

Após o provisionamento, o CloudBuilder conecta automaticamente os recursos ao dashboard de observability:

```
┌─────────────────────────────────────────┐
│  Observability — GCP Web App            │
├─────────────────────────────────────────┤
│  Metrics:                               │
│  - CPU Usage (web-server): 12%          │
│  - Memory (web-server): 45%             │
│  - Connections (app-db): 3              │
│  - Storage (app-db): 2.1 GB            │
├─────────────────────────────────────────┤
│  Cost:                                  │
│  - Compute: R$ 120/mês                  │
│  - SQL: R$ 95/mês                       │
│  - Networking: R$ 0/mês                 │
│  - Total: R$ 215/mês                    │
├─────────────────────────────────────────┤
│  Alerts: 0 active                       │
│  Incidents: 0 open                      │
└─────────────────────────────────────────┘
```

## Limpeza (opcional)

Para deletar os recursos criados:

```bash
# Via CloudBuilder: clique em "Destroy" no canvas
# Ou via gcloud:
gcloud compute instances delete web-server --zone=us-central1-a
gcloud sql instances delete app-db
gcloud compute networks subnets delete main-subnet --region=us-central1
gcloud compute networks delete main-vpc
```

## O que aprendemos

| Conceito | O que fizemos |
|----------|--------------|
| **VPC** | Criamos uma VPC isolation-mode |
| **Subnet** | Definimos range de IPs específico |
| **Compute** | Provisionamos uma VM Debian |
| **Cloud SQL** | Criamos um PostgreSQL managed |
| **IaC** | Geramos Terraform automaticamente |
| **FinOps** | Vimos custo estimado antes de provisionar |
| **Security** | Credenciais criptografadas, RBAC enforced |

## Próximos passos

1. **Adicionar load balancer** — Traffic distribution
2. **Adicionar Cloud Storage** — Static assets
3. **Configurar alertas** — CPU > 80%, Disk > 90%
4. **Adicionar CDN** — Cloud CDN para performance
5. **Multi-region** — High availability

## Conclusão

Deployar infraestrutura no GCP não precisa levar dias. Com o CloudBuilder, você projeta visualmente, gera Terraform automaticamente, e provisiona em minutos.

O desenvolvedor foca em **arquitetura**. O CloudBuilder cuida de **implementação**.

**Comece agora:** [cloudbuilder.io](https://cloudbuilder.io)

---

## Tags

`#Tutorial` `#GCP` `#GoogleCloud` `#Terraform` `#VPC` `#CloudSQL` `#ComputeEngine` `#InfrastructureAsCode` `#PlatformEngineering`
