# CloudBuilder — Deploy no Oracle Cloud Free Tier

## Pré-requisitos no seu PC

### 1. Oracle Cloud CLI (opcional, mas recomendado)

```bash
# Windows (PowerShell como Admin)
winget install Oracle.OCI

# Ou via pip
pip install oci-cli

# Configurar (vai abrir browser para login)
oci setup config
```

### 2. Terraform

```bash
# Windows
winget install HashiCorp.Terraform

# Ou baixar de: https://developer.hashicorp.com/terraform/install
```

### 3. SSH Key

```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -f ~/.ssh/oci_key -N ""

# Copiar a chave pública (vai usar no Terraform)
cat ~/.ssh/oci_key.pub
```

---

## Deploy com Terraform (Recomendado)

### Passo 1: Configurar

```bash
cd deploy/terraform-oci

# Copiar exemplo de variáveis
cp terraform.tfvars.example terraform.tfvars

# Editar terraform.tfvars com seu Compartment OCID
# (Encontrar em: OCI Console → Identity → Compartments → Seu compartment)
```

### Passo 2: Inicializar

```bash
terraform init
```

### Passo 3: Planejar

```bash
terraform plan -var="compartment_ocid=ocid1.compartment.oc1..xxxxx"
```

### Passo 4: Aplicar

```bash
terraform apply -var="compartment_ocid=ocid1.compartment.oc1..xxxxx"
```

### Passo 5: Conectar

```bash
# O Terraform vai mostrar o IP público e o comando SSH
ssh -i ~/.ssh/oci_key ubuntu@<IP_PUBLICO>

# Ou usar a saída do Terraform:
ssh -i ~/.ssh/oci_key $(terraform output -raw ssh_command | awk '{print $NF}')
```

### Passo 6: Verificar

```bash
# Dentro da instância
docker compose ps
docker compose logs -f backend
```

---

## Deploy Manual (Alternativa)

Se preferir fazer manualmente pelo Console OCI:

### 1. Criar instância ARM

1. OCI Console → Compute → Instances → Create Instance
2. Name: `cloudbuilder-beta`
3. Image: Canonical Ubuntu 22.04 (ARM)
4. Shape: **VM.Standard.A1.Flex** (4 OCPU, 24GB RAM)
5. Upload SSH key
6. Create

### 2. Configurar networking

1. Adicionar regras de segurança na subnet:
   - **Ingress**: TCP 22 (SSH), 80, 443, 3000, 8080, 8765
   - **Egress**: All

### 3. Conectar e instalar

```bash
ssh -i ~/.ssh/oci_key ubuntu@<IP>
bash -c "$(curl -fsSL https://raw.githubusercontent.com/YOUR_USER/CloudBuilder/main/deploy/oracle-cloud-setup.sh)"
```

---

## Acesso para Testadores

### Opção A: IP Direto (mais simples)

```
Frontend: http://<IP>:3000
API:      http://<IP>:8080/api/v1
```

### Opção B: Cloudflare Tunnel (HTTPS gratuito)

```bash
# Dentro da instância
cloudflared tunnel --url http://localhost:3000

# Vai mostrar algo como:
# https://abc-xyz.trycloudflare.com

# Compartilhar esse URL com os testadores
```

### Opção C: Domínio próprio (avançado)

```bash
# Criar tunnel persistente
cloudflared tunnel create cloudbuilder
cloudflared tunnel route dns cloudbuilder cloudbuilder.seudominio.com
cloudflared tunnel run --url http://localhost:3000 cloudbuilder
```

---

## Estrutura de Serviços

| Serviço | Porta | Exposto? | Função |
|---------|-------|----------|--------|
| Frontend (nginx) | 3000 | ✅ | SPA React |
| Backend (Spring Boot) | 8080 | ✅ | API REST + Auth |
| PostgreSQL | 5432 | ❌ | Database (interno) |
| Collab Server | 8765 | ✅ | WebSocket tempo real |
| Provision Engine | 50051 | ❌ | gRPC Terraform (interno) |
| OPA | 8181 | ❌ | Políticas (interno) |

---

## Comandos Úteis

```bash
# Status dos serviços
docker compose ps

# Logs de todos os serviços
docker compose logs -f

# Logs de um serviço específico
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar um serviço
docker compose restart backend

# Parar tudo
docker compose down

# Parar e limpar volumes
docker compose down -v

# Rebuild completo
docker compose up -d --build

# Verificar uso de recursos
docker stats

# Acessar o container do backend
docker exec -it cloudbuilder-backend sh

# Acessar o PostgreSQL
docker exec -it cloudbuilder-postgres psql -U cloudbuilder -d cloudbuilder
```

---

## Troubleshooting

### Backend não inicia

```bash
# Verificar logs
docker compose logs backend

# Verificar se PostgreSQL está healthy
docker compose ps postgres

# Verificar JWT_SECRET
cat .env | grep JWT_SECRET
```

### Frontend não carrega

```bash
# Verificar se backend está respondendo
curl http://localhost:8080/actuator/health

# Verificar nginx logs
docker compose logs frontend
```

### WebSocket não conecta

```bash
# Verificar se collab-server está rodando
docker compose ps collab-server

# Testar conexão
curl http://localhost:8765/health
```

### IP público não acessível

```bash
# Verificar security list no OCI Console
# Ingress deve permitir: 22, 80, 443, 3000, 8080, 8765

# Testar conectividade de fora
telnet <IP> 3000
```

---

## Cleanup (Destruir tudo)

```bash
# Com Terraform
cd deploy/terraform-oci
terraform destroy -var="compartment_ocid=ocid1.compartment.oc1..xxxxx"

# Manualmente no OCI Console
# Delete a instância e o VCN
```

---

## Custo

| Recurso | Free Tier | Custo |
|---------|-----------|-------|
| VM.Standard.A1.Flex (4 OCPU, 24GB) | Always Free | $0 |
| Boot Volume (100GB) | Always Free | $0 |
| Networking (VCN, Public IP) | Always Free | $0 |
| **Total** | | **$0/mês** |
