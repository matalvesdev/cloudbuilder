# CloudBuilder — User Personas

> Documento de referência para design de UX, onboarding e funcionalidades.
> Baseado em entrevistas com engenheiros de plataforma, DevOps e SREs.

---

## Persona 1: Rafael — "O Arquiteto"

**Perfil**: Rafael, 34 anos, Staff Engineer em uma fintech de médio porte. Gerencia 3 squads de plataforma. Já tentou implementar uma Internal Developer Platform (IDP) duas vezes — falhou nas duas por complexidade excessiva.

**Dores**:
- Cansado de ferramentas que prometem "plataforma pronta" mas entregam só Kubernetes + um monte de YAML
- Template depois de template de Terraform que ninguém mantém
- Falta de visibilidade unificada: "Preciso abrir 4 dashboards diferentes pra entender o que tá acontecendo"
- Onboarding de novo dev na plataforma leva semanas

**Objetivo com CloudBuilder**:
- "Quero desenhar minha infra em 30 minutos, não 3 dias"
- "Quero que um dev júnior consiga provisionar um microserviço sem abrir ticket"
- "Preciso de um lugar único pra ver design, custo, saúde e drift"

**Como usa o sistema**:
1. Login → Onboarding rápido (pula tour, quer configurar logo)
2. Conecta o GitHub da empresa → CloudBuilder escaneia os repositórios
3. CloudBuilder detecta Terraform existente e importa como diagrama
4. Rafael ajusta o diagrama visualmente, adiciona um novo microsserviço
5. Gera o código Terraform, provisiona, vê o custo estimado
6. Configura alertas de drift no ObserveModule
7. Convida o squad — cada dev agora vê o diagrama atualizado

**Citação**: *"Se eu puder arrastar um bloco 'RDS PostgreSQL' e conectar num bloco 'ECS Fargate' e o sistema gerar o Terraform pronto, eu viro evangelista dessa ferramenta."*

---

## Persona 2: Marina — "A DevOps na Trincheira"

**Perfil**: Marina, 28 anos, DevOps Engineer em uma startup de e-commerce. É a única pessoa de infra na empresa. Trabalha 60h/semana apagando incêndio.

**Dores**:
- Sobrecarregada: "Sou a única que entende de IaC aqui"
- Toda semana alguém pede um ambiente novo e ela precisa escrever Terraform do zero
- Já teve 3 incidentes por drift entre o que estava no repositório e o que foi alterado manualmente no console AWS
- Custo subiu 40% num mês sem ninguém perceber por falta de visibilidade

**Objetivo com CloudBuilder**:
- "Quero que outros devs consigam criar infra sem mim"
- "Quero saber ANTES de custar caro"
- "Quero detectar drift automaticamente antes de virar incidente"

**Como usa o sistema**:
1. Login → Onboarding completo (quer ver tudo que o sistema oferece)
2. Conecta as credenciais AWS → CloudBuilder importa recursos reais
3. Vê o diagrama da infra atual com alertas de custo
4. Cria um template de microserviço no PlatformModule
5. Gera o código Terraform/OpenTofu, vê preview, provisiona
6. Configura o ObserveModule para monitorar os novos recursos
7. Convida o time — agora qualquer dev pode usar o template

**Citação**: *"Se eu pudesse delegar provisionamento básico pro time sem perder o controle, minha semana teria 48 horas úteis."*

---

## Persona 3: Diego — "O Dev que Só Queria Codar"

**Perfil**: Diego, 25 anos, Backend Engineer Jr em uma scale-up. Entende de Docker, mas nunca escreveu Terraform. Precisa de um ambiente de staging novo pra feature que está lançando.

**Dores**:
- Abrir ticket de infra = 3 dias de espera
- Toda vez que tenta fazer algo sozinho quebra alguma coisa
- Documentação de infra é um wiki desatualizado de 2 anos atrás
- "Não quero ser DevOps, quero escrever código"

**Objetivo com CloudBuilder**:
- "Quero criar meu ambiente de staging em 5 minutos"
- "Quero entender visualmente onde meu serviço se encaixa"
- "Quero garantia de que não vou quebrar nada"

**Como usa o sistema**:
1. Login (GitHub OAuth) → Primeira vez → Onboarding guiado
2. Clica em "Criar novo design" → Escolhe template do catálogo
3. Arrasta um serviço, conecta num banco, ajusta no canvas
4. Clica "Provisionar" → Sistema gera o código, valida, mostra preview
5. Confirma → Infra provisionada em minutos
6. Vê o recurso no ObserveModule — saudável, custo estimado exibido
7. Segunda vez: entra direto no design, modifica, reprovisiona

**Citação**: *"Eu nunca entendi Terraform até ver meus recursos como blocos que eu podia arrastar. Faz muito mais sentido."*

---

## Persona 4: Carla — "A Head de Plataforma"

**Perfil**: Carla, 42 anos, Director of Platform Engineering em uma empresa de logística (200+ engenheiros). Responde por orçamento de infra, governança e compliance.

**Dores**:
- Falta de governança: "Não sei quem provisionou o quê"
- Shadow IT: times usando contas AWS pessoais porque a plataforma oficial é lenta
- Custo explode sem rastreabilidade
- Auditoria: precisa provar compliance para 3 certificações diferentes

**Objetivo com CloudBuilder**:
- "Quero visibilidade completa de tudo que está rodando"
- "Quero políticas de compliance aplicadas automaticamente"
- "Quero relatório de custo por squad"

**Como usa o sistema**:
1. Login → Cria organização, convida times
2. Configura políticas no PlatformModule (ex: "todo RDS precisa ter encryption at rest")
3. Vê dashboard de governança: quantos recursos, quanto custa, compliance score
4. Aprova designs via approval workflow antes do provisionamento
5. Acessa AuditModule para rastrear toda mudança
6. Vê relatório semanal de drift e ações corretivas

**Citação**: *"Preciso de uma plataforma que me dê visibilidade de custo e compliance sem precisar de uma equipe de 5 pessoas operando ela."*

---

## Mapeamento Persona → Fluxo de Onboarding

| Persona | Onboarding Style | Tour | Setup Completo | Getting Started |
|---------|-----------------|------|---------------|-----------------|
| Rafael (Arquiteto) | Skip tour, config fast | ❌ | ✅ Provider + Repo | Dashboard direto |
| Marina (DevOps) | Full onboarding | ✅ Quer ver tudo | ✅ Completo | ✅ Checklist |
| Diego (Dev Jr) | Guided tour | ✅ Essencial | ❌ Só template | ✅ "Criar design" |
| Carla (Head) | Config first | ❌ Pula | ✅ Provider + Policies | Dashboard direto |

## Princípios de Design do Onboarding

1. **Respeite o tempo do usuário**: Rafael e Carla querem configurar e sair. Diego quer ser guiado. Marina quer explorar.
2. **Salve progresso**: Se o usuário sair no step 2, volte exatamente onde parou.
3. **Tour não é obrigatório**: Tour é opt-in explícito na tela de boas-vindas.
4. **Setup não é bloqueante**: Usuário pode pular o setup e usar templates pré-configurados.
5. **Empty state útil**: Dashboard sem setup mostra "Getting Started" cards, não tela vazia.
