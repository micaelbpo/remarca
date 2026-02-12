# Requirements Document - Plataforma de Agendamento Médico

## Introdução

O Remarca é uma plataforma SaaS serverless para remarcação e cancelamento de consultas médicas, permitindo que pacientes reagendem consultas sem fricção e profissionais de saúde gerenciem suas agendas de forma eficiente. O sistema opera em modelo de assinatura mensal, com arquitetura serverless na AWS (orçamento inicial de $10/mês), suportando inicialmente 3 profissionais e 100 pacientes.

## Glossário

- **Sistema**: A plataforma Remarca completa
- **Paciente**: Usuário final que agenda e remarca consultas
- **Profissional**: Profissional de saúde (médico, psicólogo, etc.) que oferece consultas
- **Administrador**: Usuário com permissões para gerenciar assinaturas e configurações do sistema
- **Consulta**: Agendamento de um horário específico entre paciente e profissional
- **Produto**: Tipo de serviço/consulta oferecido (ex: consulta psicológica, retorno)
- **Tenant**: Instância isolada de dados para cada clínica/profissional
- **Slot**: Horário disponível para agendamento
- **Google_Calendar**: Serviço externo de calendário do Google
- **Cognito**: Serviço AWS de autenticação e autorização
- **DynamoDB**: Banco de dados NoSQL da AWS
- **Lambda**: Função serverless da AWS
- **API_Gateway**: Serviço AWS de gerenciamento de APIs
- **SES**: Serviço AWS de envio de emails
- **SNS**: Serviço AWS de notificações

## Requisitos

### Requisito 1: Autenticação e Autorização

**User Story:** Como usuário do sistema, eu quero fazer login de forma segura, para que eu possa acessar funcionalidades específicas do meu perfil.

#### Acceptance Criteria

1. WHEN um usuário fornece credenciais válidas, THE Sistema SHALL autenticar o usuário via Cognito e retornar um token JWT
2. WHEN um token JWT é fornecido em uma requisição, THE Sistema SHALL validar o token e extrair as permissões do usuário
3. THE Sistema SHALL suportar três tipos de usuário: Administrador, Profissional e Paciente
4. WHEN um usuário tenta acessar um recurso sem permissão, THE Sistema SHALL retornar erro 403 (Forbidden)
5. WHEN um Paciente tenta acessar dados de outro Paciente, THE Sistema SHALL bloquear o acesso

### Requisito 2: Cadastro de Paciente

**User Story:** Como paciente, eu quero me cadastrar na plataforma, para que eu possa agendar e remarcar consultas.

#### Acceptance Criteria

1. WHEN um Paciente fornece nome, email, telefone e senha válidos, THE Sistema SHALL criar uma conta no Cognito e um registro no DynamoDB
2. WHEN um Paciente tenta se cadastrar com email já existente, THE Sistema SHALL retornar erro indicando duplicação
3. WHEN um Paciente completa o cadastro, THE Sistema SHALL enviar email de confirmação via SES
4. THE Sistema SHALL validar formato de email e telefone antes de criar o cadastro
5. THE Sistema SHALL armazenar dados do Paciente associados ao Tenant correto

### Requisito 3: Cadastro de Produtos (Serviços/Consultas)

**User Story:** Como profissional, eu quero cadastrar tipos de consultas que ofereço, para que pacientes possam agendar os serviços corretos.

#### Acceptance Criteria

1. WHEN um Profissional fornece nome, duração e descrição de um Produto, THE Sistema SHALL criar o registro no DynamoDB
2. THE Sistema SHALL associar cada Produto ao Tenant do Profissional
3. WHEN um Profissional lista seus Produtos, THE Sistema SHALL retornar apenas Produtos do seu Tenant
4. WHEN um Produto é criado, THE Sistema SHALL validar que a duração é maior que zero
5. THE Sistema SHALL permitir que um Profissional desative (soft delete) um Produto

### Requisito 4: Integração com Google Calendar

**User Story:** Como profissional, eu quero sincronizar minha agenda com o Google Calendar, para que eu possa gerenciar compromissos em uma única plataforma.

#### Acceptance Criteria

1. WHEN um Profissional autoriza acesso ao Google_Calendar, THE Sistema SHALL armazenar o token OAuth2 de forma segura no DynamoDB
2. WHEN uma Consulta é criada no Sistema, THE Sistema SHALL criar um evento correspondente no Google_Calendar
3. WHEN uma Consulta é cancelada no Sistema, THE Sistema SHALL remover o evento do Google_Calendar
4. WHEN uma Consulta é remarcada no Sistema, THE Sistema SHALL atualizar o evento no Google_Calendar
5. THE Sistema SHALL sincronizar eventos do Google_Calendar para identificar conflitos de horário

### Requisito 5: Disponibilidade de Horários

**User Story:** Como profissional, eu quero definir minha disponibilidade de horários, para que pacientes possam agendar apenas em horários que estou disponível.

#### Acceptance Criteria

1. WHEN um Profissional define horários de trabalho (dias da semana e intervalos), THE Sistema SHALL armazenar a configuração no DynamoDB
2. WHEN um Paciente busca horários disponíveis, THE Sistema SHALL retornar apenas Slots dentro da disponibilidade configurada
3. WHEN um Slot já possui uma Consulta agendada, THE Sistema SHALL excluir esse Slot da lista de disponíveis
4. THE Sistema SHALL considerar a duração do Produto ao calcular Slots disponíveis
5. WHEN há conflito com Google_Calendar, THE Sistema SHALL excluir o Slot da lista de disponíveis

### Requisito 6: Agendamento de Consulta pelo Paciente

**User Story:** Como paciente, eu quero agendar uma consulta, para que eu possa garantir atendimento com o profissional.

#### Acceptance Criteria

1. WHEN um Paciente seleciona um Profissional, Produto e Slot disponível, THE Sistema SHALL criar uma Consulta no DynamoDB
2. WHEN uma Consulta é criada, THE Sistema SHALL marcar o Slot como ocupado
3. WHEN uma Consulta é criada, THE Sistema SHALL enviar notificação por email via SES para Paciente e Profissional
4. WHEN um Paciente tenta agendar em Slot já ocupado, THE Sistema SHALL retornar erro de conflito
5. THE Sistema SHALL validar que o Slot está dentro da disponibilidade do Profissional antes de criar a Consulta

### Requisito 7: Reagendamento pelo Paciente

**User Story:** Como paciente, eu quero remarcar uma consulta existente, para que eu possa ajustar meu horário sem precisar cancelar e criar novo agendamento.

#### Acceptance Criteria

1. WHEN um Paciente seleciona uma Consulta existente e um novo Slot disponível, THE Sistema SHALL atualizar a Consulta no DynamoDB
2. WHEN uma Consulta é remarcada, THE Sistema SHALL liberar o Slot anterior e ocupar o novo Slot
3. WHEN uma Consulta é remarcada, THE Sistema SHALL enviar notificação por email via SES para Paciente e Profissional
4. WHEN um Paciente tenta remarcar para Slot já ocupado, THE Sistema SHALL retornar erro de conflito
5. THE Sistema SHALL atualizar o evento no Google_Calendar quando a Consulta for remarcada

### Requisito 8: Cancelamento pelo Paciente

**User Story:** Como paciente, eu quero cancelar uma consulta, para que eu possa liberar o horário quando não puder comparecer.

#### Acceptance Criteria

1. WHEN um Paciente cancela uma Consulta, THE Sistema SHALL marcar a Consulta como cancelada no DynamoDB
2. WHEN uma Consulta é cancelada, THE Sistema SHALL liberar o Slot para novos agendamentos
3. WHEN uma Consulta é cancelada, THE Sistema SHALL enviar notificação por email via SES para Paciente e Profissional
4. THE Sistema SHALL manter histórico de Consultas canceladas
5. THE Sistema SHALL remover o evento do Google_Calendar quando a Consulta for cancelada

### Requisito 9: Reagendamento pelo Profissional

**User Story:** Como profissional, eu quero remarcar consultas de pacientes, para que eu possa ajustar minha agenda em situações de imprevistos.

#### Acceptance Criteria

1. WHEN um Profissional seleciona uma Consulta existente e um novo Slot, THE Sistema SHALL atualizar a Consulta no DynamoDB
2. WHEN um Profissional remarca uma Consulta, THE Sistema SHALL liberar o Slot anterior e ocupar o novo Slot
3. WHEN um Profissional remarca uma Consulta, THE Sistema SHALL enviar notificação por email via SES para o Paciente
4. THE Sistema SHALL permitir que Profissional remarque múltiplas Consultas em lote
5. THE Sistema SHALL atualizar eventos no Google_Calendar para todas as Consultas remarcadas

### Requisito 10: Cancelamento pelo Profissional

**User Story:** Como profissional, eu quero cancelar consultas, para que eu possa gerenciar minha agenda em casos de ausência ou eventos.

#### Acceptance Criteria

1. WHEN um Profissional cancela uma Consulta, THE Sistema SHALL marcar a Consulta como cancelada no DynamoDB
2. WHEN um Profissional cancela uma Consulta, THE Sistema SHALL liberar o Slot para novos agendamentos
3. WHEN um Profissional cancela uma Consulta, THE Sistema SHALL enviar notificação por email via SES para o Paciente
4. THE Sistema SHALL permitir que Profissional cancele múltiplas Consultas em lote
5. THE Sistema SHALL remover eventos do Google_Calendar para todas as Consultas canceladas

### Requisito 11: Notificações por Email

**User Story:** Como usuário do sistema, eu quero receber notificações por email sobre mudanças em consultas, para que eu esteja sempre informado.

#### Acceptance Criteria

1. WHEN uma Consulta é criada, remarcada ou cancelada, THE Sistema SHALL enviar email via SES para os usuários envolvidos
2. THE Sistema SHALL usar templates de email formatados e profissionais
3. WHEN o envio de email falha, THE Sistema SHALL registrar o erro em logs mas não bloquear a operação principal
4. THE Sistema SHALL incluir detalhes da Consulta (data, hora, Profissional, Paciente, Produto) no email
5. THE Sistema SHALL enviar emails de forma assíncrona para não impactar performance

### Requisito 12: Multi-tenancy

**User Story:** Como administrador do sistema, eu quero que dados de diferentes clínicas/profissionais sejam isolados, para garantir privacidade e segurança.

#### Acceptance Criteria

1. THE Sistema SHALL armazenar um identificador de Tenant em todos os registros do DynamoDB
2. WHEN um usuário faz uma consulta, THE Sistema SHALL filtrar resultados apenas do Tenant do usuário
3. WHEN um Profissional é criado, THE Sistema SHALL associá-lo a um Tenant específico
4. THE Sistema SHALL validar que usuários não acessem dados de outros Tenants
5. THE Sistema SHALL usar o Tenant como partition key no DynamoDB para otimizar queries

### Requisito 13: Gerenciamento de Assinaturas (Admin)

**User Story:** Como administrador, eu quero gerenciar assinaturas de profissionais, para que eu possa controlar acesso e faturamento.

#### Acceptance Criteria

1. WHEN um Administrador cria uma assinatura, THE Sistema SHALL criar um registro no DynamoDB com status ativo
2. THE Sistema SHALL associar cada assinatura a um Profissional e Tenant
3. WHEN uma assinatura expira, THE Sistema SHALL bloquear acesso do Profissional às funcionalidades
4. THE Sistema SHALL permitir que Administrador ative, desative ou renove assinaturas
5. THE Sistema SHALL armazenar histórico de mudanças de status de assinaturas

### Requisito 14: Prevenção de Overbooking

**User Story:** Como profissional, eu quero garantir que não haja agendamentos duplicados no mesmo horário, para evitar conflitos na minha agenda.

#### Acceptance Criteria

1. WHEN dois Pacientes tentam agendar o mesmo Slot simultaneamente, THE Sistema SHALL permitir apenas o primeiro agendamento
2. THE Sistema SHALL usar transações do DynamoDB para garantir atomicidade em operações de agendamento
3. WHEN um Slot é ocupado, THE Sistema SHALL imediatamente removê-lo da lista de disponíveis
4. THE Sistema SHALL validar disponibilidade do Slot antes de confirmar qualquer agendamento
5. WHEN há conflito detectado, THE Sistema SHALL retornar erro específico de Slot indisponível

### Requisito 15: Conformidade LGPD

**User Story:** Como usuário do sistema, eu quero que meus dados pessoais sejam protegidos conforme LGPD, para garantir minha privacidade.

#### Acceptance Criteria

1. THE Sistema SHALL criptografar dados sensíveis (email, telefone) em repouso no DynamoDB
2. THE Sistema SHALL usar HTTPS para todas as comunicações via API_Gateway
3. WHEN um Paciente solicita exclusão de dados, THE Sistema SHALL remover todos os dados pessoais do DynamoDB
4. THE Sistema SHALL manter logs de acesso a dados pessoais
5. THE Sistema SHALL permitir que usuários exportem seus dados pessoais em formato legível

### Requisito 16: API RESTful

**User Story:** Como desenvolvedor frontend, eu quero consumir uma API RESTful bem estruturada, para que eu possa integrar facilmente com a interface.

#### Acceptance Criteria

1. THE Sistema SHALL expor endpoints REST via API_Gateway
2. THE Sistema SHALL retornar respostas em formato JSON
3. THE Sistema SHALL usar códigos HTTP apropriados (200, 201, 400, 401, 403, 404, 500)
4. THE Sistema SHALL validar payloads de entrada e retornar erros descritivos
5. THE Sistema SHALL implementar versionamento de API (ex: /v1/appointments)

### Requisito 17: Busca de Horários Disponíveis

**User Story:** Como paciente, eu quero buscar horários disponíveis de um profissional, para que eu possa escolher o melhor horário para mim.

#### Acceptance Criteria

1. WHEN um Paciente busca horários para um Profissional e Produto, THE Sistema SHALL retornar lista de Slots disponíveis
2. THE Sistema SHALL considerar disponibilidade configurada, Consultas existentes e eventos do Google_Calendar
3. THE Sistema SHALL permitir filtrar Slots por data inicial e final
4. THE Sistema SHALL retornar Slots ordenados cronologicamente
5. THE Sistema SHALL calcular Slots baseado na duração do Produto selecionado

### Requisito 18: Histórico de Consultas

**User Story:** Como usuário do sistema, eu quero visualizar histórico de consultas, para que eu possa acompanhar agendamentos passados e futuros.

#### Acceptance Criteria

1. WHEN um Paciente solicita seu histórico, THE Sistema SHALL retornar todas as Consultas (agendadas, canceladas, concluídas)
2. WHEN um Profissional solicita histórico, THE Sistema SHALL retornar Consultas apenas do seu Tenant
3. THE Sistema SHALL permitir filtrar histórico por status (agendada, cancelada, concluída)
4. THE Sistema SHALL permitir filtrar histórico por período de datas
5. THE Sistema SHALL retornar histórico ordenado por data da Consulta

### Requisito 19: Validação de Dados de Entrada

**User Story:** Como desenvolvedor do sistema, eu quero validar todos os dados de entrada, para prevenir erros e garantir integridade dos dados.

#### Acceptance Criteria

1. WHEN um payload é recebido via API_Gateway, THE Sistema SHALL validar tipos de dados e campos obrigatórios
2. WHEN dados inválidos são detectados, THE Sistema SHALL retornar erro 400 com mensagem descritiva
3. THE Sistema SHALL validar formatos de email, telefone e datas
4. THE Sistema SHALL validar que datas de agendamento são futuras
5. THE Sistema SHALL sanitizar inputs para prevenir injeção de código

### Requisito 20: Tratamento de Erros

**User Story:** Como usuário do sistema, eu quero receber mensagens de erro claras, para que eu possa entender e corrigir problemas.

#### Acceptance Criteria

1. WHEN ocorre um erro, THE Sistema SHALL retornar código HTTP apropriado e mensagem descritiva
2. THE Sistema SHALL registrar erros em CloudWatch Logs para debugging
3. WHEN ocorre erro de integração externa (Google_Calendar, SES), THE Sistema SHALL retornar erro específico
4. THE Sistema SHALL não expor detalhes internos de implementação em mensagens de erro
5. THE Sistema SHALL tratar exceções não previstas e retornar erro 500 genérico
