# Remarca - Plataforma de Agendamento Médico

Sistema SaaS serverless para remarcação e cancelamento de consultas médicas, construído com AWS Lambda, DynamoDB, Cognito e integração com Google Calendar.

## 🏗️ Arquitetura

- **Backend**: Node.js 18.x + TypeScript em AWS Lambda
- **API**: REST via API Gateway (HTTP API)
- **Banco de Dados**: DynamoDB (single-table design)
- **Autenticação**: AWS Cognito User Pools
- **Notificações**: AWS SES (email)
- **Integração**: Google Calendar API v3
- **IaC**: AWS SAM (Serverless Application Model)

## 📋 Pré-requisitos

- Node.js 18.x ou superior
- AWS CLI configurado
- AWS SAM CLI instalado
- Conta AWS ativa

## 🚀 Setup Local

### 1. Instalar dependências

```bash
npm install
```

### 2. Compilar TypeScript

```bash
npm run build
```

### 3. Executar testes

```bash
npm test
```

### 4. Executar testes com cobertura

```bash
npm run test:coverage
```

## 📦 Deploy

### Deploy para ambiente de desenvolvimento

```bash
# Build
npm run sam:build

# Deploy
npm run sam:deploy:dev
```

### Deploy para produção

```bash
npm run sam:build
npm run sam:deploy:prod
```

## 🧪 Testes

O projeto utiliza uma abordagem dupla de testes:

- **Testes Unitários**: Validam casos específicos e edge cases
- **Property-Based Testing**: Validam propriedades universais usando fast-check

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

## 📁 Estrutura do Projeto

```
.
├── src/
│   ├── handlers/          # Lambda handlers
│   ├── services/          # Business logic
│   ├── repositories/      # Data access layer
│   └── shared/            # Shared utilities and types
├── layers/
│   └── shared/            # Lambda layer com dependências compartilhadas
├── tests/                 # Testes
├── template.yaml          # SAM template
├── samconfig.toml         # SAM configuration
└── package.json
```

## 🔑 Variáveis de Ambiente

As seguintes variáveis são configuradas automaticamente pelo SAM:

- `TABLE_NAME`: Nome da tabela DynamoDB
- `COGNITO_USER_POOL_ID`: ID do Cognito User Pool
- `COGNITO_CLIENT_ID`: ID do Cognito Client
- `STAGE`: Ambiente (dev, staging, production)

## 💰 Estimativa de Custos

Para 3 profissionais e 100 pacientes (~1000 requisições/mês):

- Lambda: ~$0.20/mês (free tier)
- DynamoDB: ~$0/mês (free tier até 25GB)
- API Gateway: ~$1/mês
- Cognito: ~$0/mês (free tier até 50k MAU)
- SES: ~$0.10/mês
- **Total estimado: $5-7/mês**

## 📚 Documentação

- [Requirements](./kiro/specs/plataforma-agendamento-medico/requirements.md)
- [Design](./kiro/specs/plataforma-agendamento-medico/design.md)
- [Tasks](./kiro/specs/plataforma-agendamento-medico/tasks.md)

## 🤝 Contribuindo

1. Crie uma branch para sua feature
2. Faça commit das mudanças
3. Execute os testes
4. Abra um Pull Request

## 📄 Licença

MIT
