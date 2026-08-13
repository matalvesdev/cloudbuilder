# CloudBuilder — Email Templates

## 📧 Templates Necessários

### 1. Welcome Email
**Trigger**: Novo usuário se registra  
**Assunto**: Bem-vindo ao CloudBuilder! 🚀

```
Olá {name}!

Bem-vindo ao CloudBuilder! 🎉

Sua conta foi criada com sucesso. Aqui está o que você pode fazer agora:

🎯 **Criar seu primeiro design**
Acesse o Canvas e arraste recursos cloud para criar sua infraestrutura.

💰 **Monitorar custos**
Configure seu provider e comece a rastrear gastos.

📖 **Documentação**
Acesse nossos tutoriais em docs.cloudbuilder.dev

Precisa de ajuda? Responda este email ou acesse nosso Discord.

Equipe CloudBuilder
```

### 2. Password Reset
**Trigger**: Usuário solicita reset de senha  
**Assunto**: Reset de senha - CloudBuilder

```
Olá {name}},

Você solicitou um reset de senha.

Clique no link abaixo para criar uma nova senha:
{reset_link}

Este link expira em 24 horas.

Se você não solicitou este reset, ignore este email.

Equipe CloudBuilder
```

### 3. Newsletter Confirmation
**Trigger**: Inscrição na newsletter  
**Assunto**: Confirme sua inscrição - CloudBuilder Weekly

```
Olá!

Obrigado por se inscrever no CloudBuilder Weekly! 📧

Para confirmar sua inscrição, clique no link abaixo:
{confirm_link}

Toda terça-feira, você receberá:
- 1 destaque técnico
- 5 links úteis
- 1 dica rápida
- Novidades do produto

Equipe CloudBuilder
```

### 4. Subscription Cancelled
**Trigger**: Usuário cancela assinatura  
**Assunto**: Assinatura cancelada - CloudBuilder

```
Olá {name},

Sua assinatura foi cancelada com sucesso.

O que acontece agora:
- Seu acesso permanece até {end_date}
- Seus dados serão mantidos por 30 dias
- Você pode reativar a qualquer momento

Motivo do cancelamento (opcional):
{feedback_form}

Se mudar de ideia, estamos aqui para ajudar.

Equipe CloudBuilder
```

### 5. Billing Invoice
**Trigger**: Fatura gerada  
**Assunto**: Sua fatura - CloudBuilder {month}/{year}

```
Olá {name},

Sua fatura de {month}/{year} está disponível.

Resumo:
- Plano: {plan}
- Período: {period}
- Valor: {amount}

Acesse seu painel para detalhes:
{billing_link}

Equipe CloudBuilder
```

### 6. Security Alert
**Trigger**: Atividade suspeita na conta  
**Assunto**: 🔒 Alerta de segurança - CloudBuilder

```
Olá {name},

Detectamos atividade incomum na sua conta:

- IP: {ip}
- Localização: {location}
- Data: {timestamp}

Se foi você, ignore este email.

Se NÃO foi você:
1. Altere sua senha imediatamente
2. Ative autenticação de dois fatores
3. Entre em contato conosco

Equipe CloudBuilder
```

### 7. Weekly Digest
**Trigger**: Toda segunda-feira  
**Assunto**: Resumo semanal - CloudBuilder

```
Olá {name},

Resumo da sua semana no CloudBuilder:

📊 **Métricas**
- Designs criados: {designs_count}
- Deployments: {deployments_count}
- Economia detectada: {savings}

📚 ** Conteúdo**
- Novo blog: {blog_title}
- Tutorial: {tutorial_title}

🎯 **Dica da semana**
{tip_of_the_week}

Equipe CloudBuilder
```

---

## 📁 Estrutura de Arquivos

```
.email-templates/
├── welcome.html
├── password-reset.html
├── newsletter-confirm.html
├── subscription-cancelled.html
├── billing-invoice.html
├── security-alert.html
├── weekly-digest.html
└── README.md
```

---

## 🔧 Integração

### Plunk
- Usar `sendTransactionalEmail()` para transacionais
- Usar `subscribe()` para newsletter
- Templates criados no dashboard do Plunk

### Backend
- Endpoint: `POST /api/v1/emails/send`
- Eventos: `@EventListener` para trigger automático
- Fila: Spring Async + Caffeine cache
