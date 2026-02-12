# Implementation Plan: Plataforma de Agendamento Médico

## Overview

Este plano de implementação divide o desenvolvimento da plataforma Remarca em tarefas incrementais e gerenciáveis. Cada tarefa constrói sobre as anteriores, validando funcionalidades core através de código. O plano segue a arquitetura serverless AWS definida no design, utilizando Node.js/TypeScript, DynamoDB, Lambda, API Gateway, Cognito e integrações com Google Calendar e SES.

## Tasks

- [x] 1. Configurar infraestrutura base e projeto
  - Criar template AWS SAM com configurações de Lambda, API Gateway, DynamoDB e Cognito
  - Configurar estrutura de pastas do projeto TypeScript
  - Instalar dependências (aws-sdk, fast-check, jest, typescript)
  - Configurar tsconfig.json e jest.config.js
  - Criar layer compartilhado com utilitários comuns
  - _Requisitos: Todos (infraestrutura base)_

- [x] 2. Implementar serviço de autenticação
  - [x] 2.1 Criar interfaces e tipos TypeScript para AuthService
    - Definir interfaces User, AuthToken, TokenPayload, UserType
    - Criar tipos de erro customizados para autenticação
    - _Requisitos: 1.1, 1.2_
  
  - [x] 2.2 Implementar AuthService com integração Cognito
    - Implementar register() para criar usuários no Cognito
    - Implementar login() para autenticar e retornar JWT
    - Implementar validateToken() para validar e extrair payload
    - Implementar hasPermission() para verificar permissões
    - _Requisitos: 1.1, 1.2, 1.4_
  
  - [ ]* 2.3 Escrever teste de propriedade para autenticação round-trip
    - **Property 1: Autenticação Round-Trip**
    - **Valida: Requisitos 1.1, 1.2**
  
  - [ ]* 2.4 Escrever teste de propriedade para isolamento de permissões
    - **Property 2: Isolamento de Permissões**
    - **Valida: Requisitos 1.4, 1.5**
  
  - [ ]* 2.5 Escrever testes unitários para casos de erro
    - Testar credenciais inválidas
    - Testar token expirado
    - Testar token malformado
    - _Requisitos: 1.1, 1.2_


- [x] 3. Implementar modelos de dados e DynamoDB
  - [x] 3.1 Criar interfaces TypeScript para entidades
    - Definir interfaces Patient, Professional, Product, Appointment, Subscription
    - Definir tipos de chave DynamoDB (PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK)
    - Criar helpers para construção de chaves (ex: `USER#${userId}`)
    - _Requisitos: 2.1, 3.1, 6.1, 13.1_
  
  - [x] 3.2 Implementar DynamoDB repository layer
    - Criar classe DynamoDBRepository com métodos CRUD genéricos
    - Implementar put(), get(), query(), update(), delete()
    - Adicionar suporte a transações para operações atômicas
    - Implementar criptografia/descriptografia de campos sensíveis (email, telefone)
    - _Requisitos: 2.1, 12.1, 15.1_
  
  - [ ]* 3.3 Escrever teste de propriedade para isolamento multi-tenant
    - **Property 5: Isolamento Multi-tenant**
    - **Valida: Requisitos 2.5, 3.2, 3.3, 12.2, 12.4, 18.2**
  
  - [ ]* 3.4 Escrever teste de propriedade para associação de tenant
    - **Property 6: Associação de Tenant em Criação**
    - **Valida: Requisitos 12.1, 12.3**
  
  - [ ]* 3.5 Escrever teste de propriedade para criptografia de dados sensíveis
    - **Property 29: Criptografia de Dados Sensíveis**
    - **Valida: Requisitos 15.1**

- [ ] 4. Implementar PatientService
  - [ ] 4.1 Criar PatientService com operações CRUD
    - Implementar createPatient() com validação de email/telefone
    - Implementar getPatient() com filtro por tenant
    - Implementar updatePatient() e listPatients()
    - Implementar deletePatient() para conformidade LGPD
    - _Requisitos: 2.1, 2.2, 2.5, 15.3_
  
  - [ ]* 4.2 Escrever teste de propriedade para unicidade de email
    - **Property 3: Unicidade de Email**
    - **Valida: Requisitos 2.2**
  
  - [ ]* 4.3 Escrever teste de propriedade para validação de formato
    - **Property 4: Validação de Formato de Dados**
    - **Valida: Requisitos 2.4, 19.3**
  
  - [ ]* 4.4 Escrever teste de propriedade para exclusão LGPD
    - **Property 30: Exclusão de Dados LGPD**
    - **Valida: Requisitos 15.3**
  
  - [ ]* 4.5 Escrever testes unitários para casos extremos
    - Testar cadastro com campos vazios
    - Testar atualização de paciente inexistente
    - _Requisitos: 2.1, 2.4_


- [ ] 5. Implementar ProfessionalService e ProductService
  - [ ] 5.1 Criar ProfessionalService
    - Implementar createProfessional(), getProfessional(), updateProfessional()
    - Implementar setAvailability() e getAvailability() para horários de trabalho
    - Adicionar suporte para armazenar Google Calendar token criptografado
    - _Requisitos: 3.1, 5.1_
  
  - [ ] 5.2 Criar ProductService
    - Implementar createProduct() com validação de duração > 0
    - Implementar getProduct(), listProducts() com filtro por tenant
    - Implementar updateProduct() e deactivateProduct() (soft delete)
    - _Requisitos: 3.1, 3.4, 3.5_
  
  - [ ]* 5.3 Escrever teste de propriedade para validação de duração
    - **Property 7: Validação de Duração de Produto**
    - **Valida: Requisitos 3.4**
  
  - [ ]* 5.4 Escrever teste de propriedade para soft delete
    - **Property 8: Soft Delete de Produto**
    - **Valida: Requisitos 3.5**
  
  - [ ]* 5.5 Escrever testes unitários para disponibilidade
    - Testar configuração de horários válidos
    - Testar horários sobrepostos
    - _Requisitos: 5.1_

- [ ] 6. Checkpoint - Validar serviços base
  - Executar todos os testes (unitários e de propriedade)
  - Verificar que todos os serviços base estão funcionando
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [ ] 7. Implementar GoogleCalendarService
  - [ ] 7.1 Criar GoogleCalendarService com OAuth2
    - Implementar authorizeCalendar() para armazenar token OAuth2
    - Implementar createEvent() para criar eventos no Google Calendar
    - Implementar updateEvent() e deleteEvent()
    - Implementar getEvents() para buscar eventos e detectar conflitos
    - Adicionar retry logic com exponential backoff
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 7.2 Escrever teste de propriedade para sincronização round-trip
    - **Property 9: Sincronização Google Calendar - Round Trip**
    - **Valida: Requisitos 4.2, 4.3, 8.5, 10.5**
  
  - [ ]* 7.3 Escrever teste de propriedade para atualização de evento
    - **Property 10: Atualização de Evento no Google Calendar**
    - **Valida: Requisitos 4.4, 7.5, 9.5**
  
  - [ ]* 7.4 Escrever teste de propriedade para detecção de conflitos
    - **Property 11: Detecção de Conflitos com Google Calendar**
    - **Valida: Requisitos 4.5, 5.5**
  
  - [ ]* 7.5 Escrever testes unitários com mocks
    - Testar falha de API do Google Calendar
    - Testar token expirado
    - _Requisitos: 4.1, 4.2_


- [ ] 8. Implementar AvailabilityService
  - [ ] 8.1 Criar AvailabilityService para cálculo de slots
    - Implementar getAvailableSlots() considerando disponibilidade configurada
    - Filtrar slots já ocupados por consultas existentes
    - Filtrar slots com conflitos no Google Calendar
    - Calcular slots baseado na duração do produto
    - Implementar isSlotAvailable() para validação individual
    - _Requisitos: 5.2, 5.3, 5.4, 5.5, 17.1, 17.2, 17.5_
  
  - [ ]* 8.2 Escrever teste de propriedade para slots dentro da disponibilidade
    - **Property 12: Slots Dentro da Disponibilidade Configurada**
    - **Valida: Requisitos 5.2, 6.5**
  
  - [ ]* 8.3 Escrever teste de propriedade para exclusão de slots ocupados
    - **Property 13: Exclusão de Slots Ocupados**
    - **Valida: Requisitos 5.3, 14.3**
  
  - [ ]* 8.4 Escrever teste de propriedade para duração de slots
    - **Property 14: Duração de Slots Baseada em Produto**
    - **Valida: Requisitos 5.4, 17.5**
  
  - [ ]* 8.5 Escrever teste de propriedade para filtro de data
    - **Property 36: Filtro de Data em Busca de Slots**
    - **Valida: Requisitos 17.3**
  
  - [ ]* 8.6 Escrever teste de propriedade para ordenação cronológica
    - **Property 37: Ordenação Cronológica de Slots**
    - **Valida: Requisitos 17.4**
  
  - [ ]* 8.7 Escrever testes unitários para casos extremos
    - Testar profissional sem disponibilidade configurada
    - Testar período sem slots disponíveis
    - _Requisitos: 5.2, 17.1_

- [ ] 9. Implementar NotificationService
  - [ ] 9.1 Criar NotificationService com SES
    - Implementar sendEmail() com templates HTML
    - Criar templates para APPOINTMENT_CREATED, RESCHEDULED, CANCELLED
    - Implementar notifyAppointmentCreated(), notifyAppointmentRescheduled(), notifyAppointmentCancelled()
    - Adicionar tratamento de erro resiliente (não bloquear operação principal)
    - Implementar envio assíncrono usando SQS (opcional para MVP)
    - _Requisitos: 11.1, 11.3, 11.4_
  
  - [ ]* 9.2 Escrever teste de propriedade para resiliência de notificações
    - **Property 24: Resiliência de Notificações**
    - **Valida: Requisitos 11.3**
  
  - [ ]* 9.3 Escrever teste de propriedade para conteúdo de notificações
    - **Property 25: Conteúdo de Notificações**
    - **Valida: Requisitos 11.4**
  
  - [ ]* 9.4 Escrever testes unitários com mocks
    - Testar falha de SES
    - Testar templates com dados faltando
    - _Requisitos: 11.1, 11.3_


- [ ] 10. Implementar AppointmentService - Parte 1 (Criação)
  - [ ] 10.1 Criar AppointmentService com createAppointment()
    - Implementar validação de slot disponível
    - Implementar validação de data futura
    - Usar transação DynamoDB para garantir atomicidade
    - Marcar slot como ocupado após criação
    - Integrar com GoogleCalendarService para criar evento
    - Integrar com NotificationService para enviar emails
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 19.4_
  
  - [ ]* 10.2 Escrever teste de propriedade para criação ocupa slot
    - **Property 15: Criação de Consulta Ocupa Slot**
    - **Valida: Requisitos 6.2**
  
  - [ ]* 10.3 Escrever teste de propriedade para prevenção de overbooking
    - **Property 17: Prevenção de Overbooking**
    - **Valida: Requisitos 6.4, 7.4, 14.5**
  
  - [ ]* 10.4 Escrever teste de propriedade para atomicidade concorrente
    - **Property 18: Atomicidade em Agendamento Concorrente**
    - **Valida: Requisitos 14.1**
  
  - [ ]* 10.5 Escrever teste de propriedade para validação de datas futuras
    - **Property 42: Validação de Datas Futuras**
    - **Valida: Requisitos 19.4**
  
  - [ ]* 10.6 Escrever testes unitários para casos de erro
    - Testar agendamento em slot ocupado
    - Testar agendamento com data passada
    - Testar agendamento fora da disponibilidade
    - _Requisitos: 6.4, 6.5, 19.4_

- [ ] 11. Implementar AppointmentService - Parte 2 (Reagendamento e Cancelamento)
  - [ ] 11.1 Implementar rescheduleAppointment()
    - Validar novo slot disponível
    - Liberar slot anterior e ocupar novo slot (transação)
    - Atualizar evento no Google Calendar
    - Enviar notificações
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 11.2 Implementar cancelAppointment()
    - Marcar consulta como cancelada
    - Liberar slot para novos agendamentos
    - Remover evento do Google Calendar
    - Enviar notificações
    - Manter histórico de cancelamento
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 11.3 Escrever teste de propriedade para liberação de slot em reagendamento
    - **Property 19: Liberação de Slot em Reagendamento**
    - **Valida: Requisitos 7.2, 9.2**
  
  - [ ]* 11.4 Escrever teste de propriedade para liberação de slot em cancelamento
    - **Property 20: Liberação de Slot em Cancelamento**
    - **Valida: Requisitos 8.2, 10.2**
  
  - [ ]* 11.5 Escrever teste de propriedade para persistência de histórico
    - **Property 21: Persistência de Histórico de Cancelamentos**
    - **Valida: Requisitos 8.4**
  
  - [ ]* 11.6 Escrever testes unitários
    - Testar reagendamento para slot ocupado
    - Testar cancelamento de consulta já cancelada
    - _Requisitos: 7.4, 8.1_


- [ ] 12. Implementar operações em lote para profissionais
  - [ ] 12.1 Implementar bulkRescheduleAppointments()
    - Validar todos os novos slots
    - Atualizar múltiplas consultas em transação
    - Atualizar todos os eventos no Google Calendar
    - Enviar notificações para todos os pacientes
    - Retornar resultado com sucessos e falhas
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 12.2 Implementar bulkCancelAppointments()
    - Cancelar múltiplas consultas em transação
    - Liberar todos os slots
    - Remover todos os eventos do Google Calendar
    - Enviar notificações para todos os pacientes
    - Retornar resultado com sucessos e falhas
    - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 12.3 Escrever teste de propriedade para reagendamento em lote
    - **Property 22: Operações em Lote - Reagendamento**
    - **Valida: Requisitos 9.4, 9.5**
  
  - [ ]* 12.4 Escrever teste de propriedade para cancelamento em lote
    - **Property 23: Operações em Lote - Cancelamento**
    - **Valida: Requisitos 10.4, 10.5**
  
  - [ ]* 12.5 Escrever testes unitários
    - Testar lote com algumas consultas inválidas
    - Testar lote vazio
    - _Requisitos: 9.4, 10.4_

- [ ] 13. Checkpoint - Validar funcionalidades de agendamento
  - Executar todos os testes de agendamento
  - Testar fluxo completo: criar → remarcar → cancelar
  - Verificar sincronização com Google Calendar
  - Verificar envio de notificações
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [ ] 14. Implementar histórico e busca de consultas
  - [ ] 14.1 Implementar listAppointments() com filtros
    - Implementar filtro por paciente
    - Implementar filtro por profissional
    - Implementar filtro por status (SCHEDULED, CANCELLED, COMPLETED)
    - Implementar filtro por período de datas
    - Implementar ordenação por data
    - Garantir isolamento por tenant
    - _Requisitos: 18.1, 18.2, 18.3, 18.4, 18.5_
  
  - [ ]* 14.2 Escrever teste de propriedade para completude de histórico
    - **Property 38: Completude de Histórico de Consultas**
    - **Valida: Requisitos 18.1**
  
  - [ ]* 14.3 Escrever teste de propriedade para filtro de status
    - **Property 39: Filtro de Status em Histórico**
    - **Valida: Requisitos 18.3**
  
  - [ ]* 14.4 Escrever teste de propriedade para filtro de período
    - **Property 40: Filtro de Período em Histórico**
    - **Valida: Requisitos 18.4**
  
  - [ ]* 14.5 Escrever teste de propriedade para ordenação
    - **Property 41: Ordenação de Histórico**
    - **Valida: Requisitos 18.5**
  
  - [ ]* 14.6 Escrever testes unitários
    - Testar histórico vazio
    - Testar filtros combinados
    - _Requisitos: 18.1, 18.3_


- [ ] 15. Implementar SubscriptionService (Admin)
  - [ ] 15.1 Criar SubscriptionService
    - Implementar createSubscription() com status ACTIVE
    - Implementar getSubscription() e listSubscriptions()
    - Implementar updateSubscriptionStatus() para ativar/desativar/renovar
    - Implementar isSubscriptionActive() para validação de acesso
    - Armazenar histórico de mudanças de status
    - _Requisitos: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ] 15.2 Adicionar middleware de validação de assinatura
    - Criar middleware para verificar assinatura ativa antes de operações
    - Bloquear acesso de profissionais com assinatura expirada
    - Retornar erro 403 apropriado
    - _Requisitos: 13.3_
  
  - [ ]* 15.3 Escrever teste de propriedade para criação de assinatura ativa
    - **Property 26: Criação de Assinatura Ativa**
    - **Valida: Requisitos 13.1, 13.2**
  
  - [ ]* 15.4 Escrever teste de propriedade para bloqueio por assinatura expirada
    - **Property 27: Bloqueio por Assinatura Expirada**
    - **Valida: Requisitos 13.3**
  
  - [ ]* 15.5 Escrever teste de propriedade para histórico de mudanças
    - **Property 28: Histórico de Mudanças de Assinatura**
    - **Valida: Requisitos 13.5**
  
  - [ ]* 15.6 Escrever testes unitários
    - Testar renovação de assinatura expirada
    - Testar listagem de assinaturas por status
    - _Requisitos: 13.4, 13.5_

- [ ] 16. Implementar funcionalidades LGPD
  - [ ] 16.1 Implementar auditoria de acesso a dados pessoais
    - Criar middleware de logging para operações com dados pessoais
    - Registrar userId, timestamp, operação e recurso no CloudWatch
    - _Requisitos: 15.4_
  
  - [ ] 16.2 Implementar exportação de dados
    - Criar endpoint para exportar dados pessoais do usuário
    - Retornar JSON com todos os dados (perfil, consultas, etc)
    - _Requisitos: 15.5_
  
  - [ ]* 16.3 Escrever teste de propriedade para auditoria
    - **Property 31: Auditoria de Acesso a Dados Pessoais**
    - **Valida: Requisitos 15.4**
  
  - [ ]* 16.4 Escrever teste de propriedade para exportação
    - **Property 32: Exportação de Dados LGPD**
    - **Valida: Requisitos 15.5**
  
  - [ ]* 16.5 Escrever testes unitários
    - Testar exportação de usuário sem dados
    - Testar logs de auditoria
    - _Requisitos: 15.4, 15.5_


- [ ] 17. Implementar validação e tratamento de erros
  - [ ] 17.1 Criar middleware de validação de payloads
    - Implementar validação de tipos de dados e campos obrigatórios
    - Validar formatos de email, telefone e datas
    - Sanitizar inputs para prevenir injeção
    - Retornar erros 400 com mensagens descritivas
    - _Requisitos: 19.1, 19.2, 19.3, 19.5_
  
  - [ ] 17.2 Criar middleware de tratamento de erros global
    - Capturar exceções não tratadas
    - Retornar códigos HTTP apropriados (400, 401, 403, 404, 500)
    - Registrar erros no CloudWatch
    - Não expor detalhes internos em mensagens de erro
    - _Requisitos: 20.1, 20.2, 20.4, 20.5_
  
  - [ ] 17.3 Implementar tratamento específico para erros de integração
    - Detectar falhas de Google Calendar API
    - Detectar falhas de SES
    - Retornar erros específicos (502/503)
    - _Requisitos: 20.3_
  
  - [ ]* 17.4 Escrever teste de propriedade para validação de payload
    - **Property 35: Validação de Payload com Erros Descritivos**
    - **Valida: Requisitos 16.4, 19.1, 19.2**
  
  - [ ]* 17.5 Escrever teste de propriedade para sanitização
    - **Property 43: Sanitização de Inputs**
    - **Valida: Requisitos 19.5**
  
  - [ ]* 17.6 Escrever teste de propriedade para códigos HTTP
    - **Property 34: Códigos HTTP Apropriados**
    - **Valida: Requisitos 16.3, 20.1**
  
  - [ ]* 17.7 Escrever teste de propriedade para logging de erros
    - **Property 44: Logging de Erros**
    - **Valida: Requisitos 20.2**
  
  - [ ]* 17.8 Escrever teste de propriedade para erros de integração
    - **Property 45: Erros de Integração Externa**
    - **Valida: Requisitos 20.3**
  
  - [ ]* 17.9 Escrever teste de propriedade para não exposição de detalhes
    - **Property 46: Não Exposição de Detalhes Internos**
    - **Valida: Requisitos 20.4**
  
  - [ ]* 17.10 Escrever teste de propriedade para exceções não previstas
    - **Property 47: Tratamento de Exceções Não Previstas**
    - **Valida: Requisitos 20.5**
  
  - [ ]* 17.11 Escrever testes unitários
    - Testar validação com múltiplos erros
    - Testar diferentes tipos de exceções
    - _Requisitos: 19.1, 20.1_

- [ ] 18. Checkpoint - Validar validação e tratamento de erros
  - Executar todos os testes de validação
  - Testar cenários de erro em todos os endpoints
  - Verificar logs no CloudWatch
  - Perguntar ao usuário se há dúvidas ou ajustes necessários


- [ ] 19. Implementar Lambda handlers e API Gateway
  - [ ] 19.1 Criar Lambda handler para autenticação
    - Implementar POST /auth/register
    - Implementar POST /auth/login
    - Implementar GET /auth/validate
    - Integrar com AuthService
    - _Requisitos: 1.1, 1.2, 16.1_
  
  - [ ] 19.2 Criar Lambda handler para pacientes
    - Implementar POST /patients (criar)
    - Implementar GET /patients/:id (buscar)
    - Implementar PUT /patients/:id (atualizar)
    - Implementar DELETE /patients/:id (deletar - LGPD)
    - Implementar GET /patients (listar)
    - Adicionar middleware de autenticação e validação
    - _Requisitos: 2.1, 2.2, 15.3, 16.1_
  
  - [ ] 19.3 Criar Lambda handler para profissionais
    - Implementar POST /professionals (criar)
    - Implementar GET /professionals/:id (buscar)
    - Implementar PUT /professionals/:id (atualizar)
    - Implementar POST /professionals/:id/availability (configurar disponibilidade)
    - Implementar GET /professionals/:id/availability (buscar disponibilidade)
    - _Requisitos: 3.1, 5.1, 16.1_
  
  - [ ] 19.4 Criar Lambda handler para produtos
    - Implementar POST /products (criar)
    - Implementar GET /products/:id (buscar)
    - Implementar GET /products (listar)
    - Implementar PUT /products/:id (atualizar)
    - Implementar DELETE /products/:id (desativar)
    - _Requisitos: 3.1, 3.4, 3.5, 16.1_
  
  - [ ] 19.5 Criar Lambda handler para consultas
    - Implementar POST /appointments (criar)
    - Implementar GET /appointments/:id (buscar)
    - Implementar GET /appointments (listar com filtros)
    - Implementar PUT /appointments/:id/reschedule (remarcar)
    - Implementar PUT /appointments/:id/cancel (cancelar)
    - Implementar POST /appointments/bulk-reschedule (reagendar em lote)
    - Implementar POST /appointments/bulk-cancel (cancelar em lote)
    - _Requisitos: 6.1, 7.1, 8.1, 9.1, 10.1, 18.1, 16.1_
  
  - [ ] 19.6 Criar Lambda handler para disponibilidade
    - Implementar GET /availability (buscar slots disponíveis)
    - Aceitar query params: professionalId, productId, startDate, endDate
    - _Requisitos: 17.1, 17.2, 17.3, 16.1_
  
  - [ ] 19.7 Criar Lambda handler para assinaturas (admin)
    - Implementar POST /subscriptions (criar)
    - Implementar GET /subscriptions/:id (buscar)
    - Implementar GET /subscriptions (listar)
    - Implementar PUT /subscriptions/:id/status (atualizar status)
    - Restringir acesso apenas para administradores
    - _Requisitos: 13.1, 13.4, 16.1_
  
  - [ ] 19.8 Criar Lambda handler para LGPD
    - Implementar GET /me/export (exportar dados)
    - Implementar GET /me/audit-logs (buscar logs de auditoria)
    - _Requisitos: 15.4, 15.5, 16.1_
  
  - [ ]* 19.9 Escrever teste de propriedade para respostas JSON
    - **Property 33: Respostas em JSON Válido**
    - **Valida: Requisitos 16.2**
  
  - [ ]* 19.10 Escrever testes de integração
    - Testar fluxo completo de autenticação
    - Testar fluxo completo de agendamento
    - Testar isolamento multi-tenant via API
    - _Requisitos: 1.1, 6.1, 12.2_


- [ ] 20. Configurar API Gateway e deploy
  - [ ] 20.1 Configurar API Gateway HTTP API no SAM template
    - Definir rotas para todos os endpoints
    - Configurar CORS para frontend
    - Configurar authorizer com Cognito
    - Configurar throttling e rate limiting
    - _Requisitos: 16.1, 16.5_
  
  - [ ] 20.2 Configurar variáveis de ambiente
    - Configurar variáveis para Cognito (User Pool ID, Client ID)
    - Configurar variáveis para DynamoDB (Table Name, Region)
    - Configurar variáveis para Google Calendar (Client ID, Secret)
    - Configurar variáveis para SES (Region, From Email)
    - Configurar variáveis por ambiente (dev, staging, production)
    - _Requisitos: Todos_
  
  - [ ] 20.3 Configurar CloudWatch Logs e Alarms
    - Configurar log groups para cada Lambda
    - Criar alarmes para taxa de erro > 5%
    - Criar alarmes para duração de Lambda > 3s
    - Criar alarmes para custo mensal > $12
    - _Requisitos: 20.2_
  
  - [ ] 20.4 Deploy em ambiente de desenvolvimento
    - Executar `sam build`
    - Executar `sam deploy --guided` para dev
    - Validar que todas as Lambdas foram criadas
    - Validar que API Gateway está acessível
    - Validar que DynamoDB table foi criada
    - _Requisitos: Todos_

- [ ] 21. Checkpoint - Validar deploy e infraestrutura
  - Testar todos os endpoints via Postman/curl
  - Verificar logs no CloudWatch
  - Verificar métricas no CloudWatch
  - Verificar custos no AWS Cost Explorer
  - Perguntar ao usuário se há dúvidas ou ajustes necessários

- [ ] 22. Implementar testes de propriedade restantes
  - [ ]* 22.1 Escrever teste de propriedade para notificações em operações
    - **Property 16: Notificações em Operações de Consulta**
    - **Valida: Requisitos 6.3, 7.3, 8.3, 9.3, 10.3, 11.1**
  
  - [ ]* 22.2 Escrever testes de integração end-to-end
    - Testar fluxo: cadastrar paciente → agendar → remarcar → cancelar
    - Testar fluxo: profissional cancela múltiplas consultas
    - Testar fluxo: buscar slots → agendar → verificar slot ocupado
    - _Requisitos: 2.1, 6.1, 7.1, 8.1, 10.4_

- [ ] 23. Documentação e preparação para produção
  - [ ] 23.1 Criar documentação da API
    - Documentar todos os endpoints com exemplos
    - Documentar códigos de erro e mensagens
    - Documentar autenticação e autorização
    - Criar collection do Postman
    - _Requisitos: 16.1_
  
  - [ ] 23.2 Criar guia de deploy
    - Documentar pré-requisitos (AWS CLI, SAM CLI, Node.js)
    - Documentar processo de deploy por ambiente
    - Documentar configuração de variáveis de ambiente
    - Documentar processo de rollback
    - _Requisitos: Todos_
  
  - [ ] 23.3 Criar README do projeto
    - Descrever arquitetura e tecnologias
    - Incluir instruções de setup local
    - Incluir instruções de execução de testes
    - Incluir estimativa de custos AWS
    - _Requisitos: Todos_

- [ ] 24. Checkpoint final - Validação completa do MVP
  - Executar todos os testes (unitários, propriedades, integração)
  - Validar cobertura de testes > 80%
  - Validar que todos os requisitos foram implementados
  - Validar custos AWS dentro do orçamento ($10/mês)
  - Realizar testes manuais de todos os fluxos principais
  - Perguntar ao usuário se o MVP está pronto para produção

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam corretude universal
- Testes unitários validam exemplos específicos e casos extremos
- Arquitetura serverless permite começar com custos baixos (~$5-7/mês) e escalar automaticamente
- Property-based testing usa biblioteca fast-check com mínimo 100 iterações por teste
- Cada teste de propriedade deve referenciar sua propriedade no documento de design
