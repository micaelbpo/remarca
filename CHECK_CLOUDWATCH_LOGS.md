# Como Verificar Logs do CloudWatch

## Problema
O registro retorna sucesso mas o perfil não é salvo no DynamoDB. Precisamos ver os logs para identificar o erro.

## Passo a Passo

### 1. Acessar CloudWatch
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups

### 2. Encontrar o Log Group
Procure por: `/aws/lambda/remarca-dev-RegisterFunction-*`

Exemplo: `/aws/lambda/remarca-dev-RegisterFunction-tnKIdXt46Ynv`

### 3. Ver os Logs Mais Recentes
1. Clique no Log Group
2. Clique em "Log streams"
3. Clique no stream mais recente (topo da lista)
4. Procure por logs com timestamp próximo a: `2026-02-13T18:54:25`

### 4. O Que Procurar

Procure por estas mensagens na ordem:

```
✅ "Registering new user" - Início do registro
✅ "User registered successfully in Cognito" - Cognito OK
✅ "Attempting to save user profile to DynamoDB" - Tentando salvar
❌ "User profile stored in DynamoDB successfully" - DEVE aparecer
❌ "Failed to register user" - Se aparecer, há erro
```

### 5. Erros Comuns

**Se ver: "AccessDeniedException" ou "not authorized"**
- Lambda não tem permissão para escrever no DynamoDB
- Solução: Verificar IAM policies no template.yaml

**Se ver: "ValidationException"**
- Dados inválidos sendo enviados ao DynamoDB
- Solução: Verificar estrutura do userProfile

**Se ver: "ResourceNotFoundException"**
- Tabela DynamoDB não existe
- Solução: Verificar se a tabela foi criada

**Se NÃO ver "Attempting to save user profile to DynamoDB"**
- O código não chegou até essa parte
- Há um erro antes disso

## Copiar os Logs

Por favor, copie e cole aqui os logs completos da função RegisterFunction para o timestamp `2026-02-13T18:54:25`.

Procure especialmente por:
- Mensagens de erro (ERROR)
- Stack traces
- Mensagens sobre DynamoDB

## Alternativa: Verificar via AWS CLI

Se tiver AWS CLI instalado:

```powershell
# Listar log groups
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/remarca-dev-Register"

# Ver logs recentes (substitua LOG_GROUP_NAME)
aws logs tail /aws/lambda/remarca-dev-RegisterFunction-XXXXX --follow
```
