# Milestone: MVP com Frontend

## Objetivo
Ter uma aplicação funcional end-to-end que permita testar os fluxos principais da plataforma Remarca através de uma interface web.

## Status Atual do Backend

### ✅ Concluído
1. **Infraestrutura Base** (Task 1)
   - AWS SAM configurado
   - DynamoDB, Cognito, API Gateway
   - CI/CD com GitHub Actions

2. **Autenticação** (Task 2)
   - AuthService com Cognito
   - JWT validation
   - Role-based access control

3. **Modelos de Dados** (Task 3)
   - DynamoDB repository layer
   - Criptografia de dados sensíveis
   - Single-table design

4. **PatientService** (Task 4)
   - CRUD completo de pacientes
   - Validação de email/telefone
   - Endpoints REST funcionais

5. **ProfessionalService e ProductService** (Task 5)
   - CRUD de profissionais
   - Configuração de disponibilidade
   - CRUD de produtos/serviços
   - Soft delete de produtos

6. **AvailabilityService** (Task 8)
   - Cálculo de slots disponíveis
   - Validação de disponibilidade
   - Integração com disponibilidade configurada

### 🚧 Pendente para MVP Funcional

#### Backend Essencial

**Task 10: AppointmentService - Criação** (CRÍTICO)
- [ ] Implementar createAppointment()
  - Validação de slot disponível
  - Validação de data futura
  - Transação DynamoDB para atomicidade
  - Marcar slot como ocupado
  - Integração com Google Calendar (stub OK para MVP)
  - Envio de notificações (stub OK para MVP)
- [ ] Criar endpoints REST
  - POST /appointments
  - GET /appointments/:id
  - GET /appointments (listar)

**Task 11: AppointmentService - Reagendamento e Cancelamento** (IMPORTANTE)
- [ ] Implementar rescheduleAppointment()
  - Liberar slot anterior
  - Ocupar novo slot
  - Atualizar Google Calendar
- [ ] Implementar cancelAppointment()
  - Marcar como cancelada
  - Liberar slot
  - Manter histórico
- [ ] Criar endpoints REST
  - PUT /appointments/:id/reschedule
  - PUT /appointments/:id/cancel

**Task 19: Lambda Handlers Restantes** (CRÍTICO)
- [ ] Handler de autenticação
  - POST /auth/register
  - POST /auth/login
  - GET /auth/validate

#### Frontend (Nova Implementação)

**Tecnologia Sugerida**: React + TypeScript + Vite
- Rápido para desenvolver
- TypeScript para type safety
- Hospedagem: AWS S3 + CloudFront (ou Vercel para MVP)

**Páginas Essenciais**:

1. **Login/Registro** (`/login`, `/register`)
   - Formulário de login
   - Formulário de registro (escolher tipo: profissional/paciente)
   - Integração com Cognito

2. **Dashboard Profissional** (`/professional/dashboard`)
   - Visualizar agenda do dia/semana
   - Lista de consultas agendadas
   - Configurar disponibilidade
   - Gerenciar produtos/serviços

3. **Dashboard Paciente** (`/patient/dashboard`)
   - Visualizar minhas consultas
   - Agendar nova consulta
   - Cancelar/reagendar consulta

4. **Agendamento** (`/booking`)
   - Selecionar profissional
   - Selecionar serviço
   - Visualizar slots disponíveis (calendário)
   - Confirmar agendamento

5. **Configuração de Disponibilidade** (`/professional/availability`)
   - Definir horários de trabalho por dia da semana
   - Visualizar disponibilidade atual

**Componentes Principais**:
- `<Calendar>` - Visualização de slots disponíveis
- `<AppointmentCard>` - Card de consulta
- `<AvailabilityEditor>` - Editor de disponibilidade semanal
- `<ServiceSelector>` - Seletor de serviços
- `<AuthGuard>` - Proteção de rotas

## Cronograma Sugerido

### Fase 1: Completar Backend Essencial (2-3 dias)
1. Implementar AppointmentService (Task 10 e 11)
2. Criar handlers de autenticação (Task 19.1)
3. Testar todos os endpoints via Postman/curl

### Fase 2: Setup Frontend (1 dia)
1. Criar projeto React + TypeScript + Vite
2. Configurar roteamento (React Router)
3. Configurar cliente HTTP (axios/fetch)
4. Configurar autenticação (AWS Amplify ou manual)
5. Criar layout base e navegação

### Fase 3: Implementar Telas Principais (3-4 dias)
1. Login/Registro (1 dia)
2. Dashboard Profissional (1 dia)
3. Dashboard Paciente (1 dia)
4. Fluxo de Agendamento (1-2 dias)

### Fase 4: Integração e Testes (1-2 dias)
1. Integrar frontend com backend
2. Testar fluxos end-to-end
3. Ajustes de UX
4. Deploy do frontend

**Total Estimado: 7-10 dias**

## Critérios de Sucesso

### Backend
- ✅ Todos os endpoints essenciais funcionando
- ✅ Autenticação com Cognito operacional
- ✅ CRUD de pacientes, profissionais e produtos
- ✅ Cálculo de disponibilidade funcionando
- 🚧 Criação, reagendamento e cancelamento de consultas
- 🚧 Isolamento multi-tenant funcionando

### Frontend
- 🚧 Usuário consegue fazer login/registro
- 🚧 Profissional consegue configurar disponibilidade
- 🚧 Profissional consegue criar serviços
- 🚧 Paciente consegue visualizar slots disponíveis
- 🚧 Paciente consegue agendar consulta
- 🚧 Ambos conseguem visualizar suas consultas
- 🚧 Ambos conseguem cancelar/reagendar

### Integração
- 🚧 Frontend se comunica com backend via API Gateway
- 🚧 Autenticação JWT funcionando
- 🚧 Dados persistidos no DynamoDB
- 🚧 Fluxo completo testado end-to-end

## Próximos Passos Imediatos

1. **Implementar AppointmentService** (Task 10)
   - Foco em createAppointment() primeiro
   - Usar stubs para Google Calendar e notificações
   - Garantir atomicidade com transações DynamoDB

2. **Criar handlers de autenticação** (Task 19.1)
   - POST /auth/register
   - POST /auth/login
   - Testar com Postman

3. **Decidir sobre frontend**
   - Confirmar stack: React + TypeScript + Vite?
   - Hospedagem: S3 + CloudFront ou Vercel?
   - Design system: Material-UI, Chakra UI, ou custom?

## Recursos Necessários

### Backend
- Nenhum recurso adicional (já temos tudo)

### Frontend
- Repositório separado ou monorepo?
- Domínio para hospedagem (opcional para MVP)
- Ferramenta de design (Figma) para mockups (opcional)

## Observações

- **Google Calendar**: Usar stub para MVP, implementar depois
- **Notificações por Email**: Usar stub para MVP, implementar SES depois
- **Pagamentos**: Não incluir no MVP inicial
- **Relatórios**: Não incluir no MVP inicial
- **Mobile**: Não incluir no MVP inicial (focar em web responsivo)

## Decisão Necessária

**Você gostaria de:**
1. Continuar implementando o backend (AppointmentService) primeiro?
2. Começar o frontend em paralelo?
3. Definir melhor a arquitetura do frontend antes de começar?

**Recomendação**: Completar AppointmentService primeiro (1-2 dias), depois iniciar frontend com base sólida.
