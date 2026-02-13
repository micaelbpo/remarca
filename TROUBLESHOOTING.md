# Troubleshooting - Remarca

## Problema: "User profile not found" ao fazer login

### Sintoma
Após confirmar o email e tentar fazer login, você recebe:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User profile not found. Please contact support."
  }
}
```

### Causa
Este erro ocorre quando:
1. O usuário foi registrado ANTES do código que salva perfis no DynamoDB estar deployado
2. O usuário existe no Cognito, mas não tem perfil no DynamoDB
3. O registro foi feito em uma versão antiga do código

### Solução

**Opção 1: Registrar um novo usuário (RECOMENDADO)**
```powershell
# Use o script de teste rápido
.\quick-test.ps1

# Ou registre manualmente com seu email real
```

**Opção 2: Deletar o usuário antigo e registrar novamente**

Via Console AWS:
1. Acesse: https://console.aws.amazon.com/cognito/
2. Selecione "User Pools" → "remarca-users-dev"
3. Vá em "Users"
4. Encontre e delete o usuário problemático
5. Registre novamente

**Opção 3: Adicionar perfil manualmente no DynamoDB**

Via Console AWS:
1. Acesse: https://console.aws.amazon.com/dynamodb/
2. Selecione a tabela "remarca-dev"
3. Clique em "Create item"
4. Adicione:
   ```json
   {
     "PK": "USER#<cognito-user-id>",
     "SK": "PROFILE",
     "id": "<cognito-user-id>",
     "email": "seu@email.com",
     "name": "Seu Nome",
     "tenantId": "tenant-001",
     "userType": "PROFESSIONAL",
     "createdAt": "2026-02-13T18:00:00.000Z",
     "updatedAt": "2026-02-13T18:00:00.000Z"
   }
   ```

### Como evitar no futuro

Este problema não ocorrerá mais porque:
1. ✅ O código de registro agora salva automaticamente no DynamoDB
2. ✅ O código de login verifica se o perfil existe
3. ✅ Mensagens de erro são claras

### Verificar se o problema está resolvido

Execute o script de teste completo:
```powershell
.\test-full-flow.ps1
```

Se o teste passar, o problema está resolvido! 🎉

---

## Problema: Não estou recebendo email de confirmação

### Sintoma
Após registrar, não recebo o código de verificação no email.

### Causas possíveis
1. Email está na pasta de spam/lixo eletrônico
2. Cognito User Pool não está configurado para enviar emails
3. Limite de emails do Cognito foi atingido (50/dia no tier gratuito)

### Solução

**1. Verificar spam/lixo eletrônico**
- Remetente: `no-reply@verificationemail.com` ou similar
- Assunto: "Código de Verificação - Remarca" ou código padrão do Cognito

**2. Aguardar alguns minutos**
- Emails do Cognito podem demorar até 5 minutos

**3. Verificar configuração do Cognito**
O `template.yaml` deve ter:
```yaml
AutoVerifiedAttributes:
  - email
EmailConfiguration:
  EmailSendingAccount: COGNITO_DEFAULT
VerificationMessageTemplate:
  DefaultEmailOption: CONFIRM_WITH_CODE
  EmailMessage: 'Seu código de verificação do Remarca é: {####}'
  EmailSubject: 'Código de Verificação - Remarca'
```

**4. Reenviar código via Console AWS**
1. Acesse: https://console.aws.amazon.com/cognito/
2. Selecione "User Pools" → "remarca-users-dev"
3. Vá em "Users"
4. Encontre o usuário
5. Clique em "Resend confirmation code"

---

## Problema: Deploy falhou no GitHub Actions

### Verificar logs
1. Acesse: https://github.com/micaelbpo/remarca/actions
2. Clique no workflow que falhou
3. Verifique os logs de erro

### Causas comuns
- Erro de sintaxe no código
- Erro no template.yaml
- Permissões IAM insuficientes
- Timeout no build

---

## Scripts úteis

### Teste completo do fluxo
```powershell
.\test-full-flow.ps1
```

### Teste rápido com novo usuário
```powershell
.\quick-test.ps1
```

### Teste de registro
```powershell
.\test-register.ps1
```

### Teste de login
```powershell
.\test-login.ps1
```

---

## Contatos e recursos

- **API Base URL**: https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev
- **GitHub**: https://github.com/micaelbpo/remarca
- **AWS Console**: https://console.aws.amazon.com/
