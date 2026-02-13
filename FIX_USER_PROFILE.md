# Como Corrigir o Problema "User profile not found"

## Problema
Você registrou um usuário antes do código que salva perfis no DynamoDB estar deployado. O usuário existe no Cognito mas não no DynamoDB, causando erro ao fazer login.

## Solução: Deletar e Registrar Novamente

### Passo 1: Deletar o Usuário do Cognito

1. Acesse o Console AWS Cognito:
   https://console.aws.amazon.com/cognito/v2/idp/user-pools

2. Clique em "remarca-users-dev"

3. Clique em "Users" no menu lateral

4. Encontre o usuário: `micael.poloni@me.com`

5. Clique no usuário

6. Clique em "Delete user" (botão vermelho no canto superior direito)

7. Confirme a exclusão

### Passo 2: Registrar Novamente

**Opção A: Via Frontend (Recomendado)**
1. Acesse: http://localhost:3000/register
2. Preencha o formulário com seus dados
3. Clique em "Cadastrar"
4. Aguarde o email de confirmação
5. Confirme o email
6. Faça login

**Opção B: Via Script PowerShell**
```powershell
.\test-frontend-registration.ps1
```

### Passo 3: Confirmar Email

1. Verifique seu email (incluindo spam)
2. Copie o código de verificação
3. Acesse: http://localhost:3000/confirm-email
4. Cole o código
5. Clique em "Confirmar Email"

### Passo 4: Fazer Login

1. Acesse: http://localhost:3000/login
2. Digite seu email e senha
3. Clique em "Entrar"
4. Você será redirecionado para o dashboard

## Verificar se Funcionou

Execute o diagnóstico:
```powershell
.\diagnose-user.ps1
```

Se o login funcionar, você verá:
- ✅ Login successful!
- ✅ Profile is complete!

## Por Que Isso Aconteceu?

O código que salva perfis no DynamoDB foi adicionado recentemente. Usuários registrados ANTES desse código não têm perfis no DynamoDB.

Agora, todo novo registro salva automaticamente:
- ✅ Usuário no Cognito (autenticação)
- ✅ Perfil no DynamoDB (dados adicionais)

## Precisa de Ajuda?

Se ainda tiver problemas:

1. Verifique se o deploy foi concluído:
   https://github.com/micaelbpo/remarca/actions

2. Teste o endpoint de debug (após deploy):
   ```powershell
   curl "https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev/debug/check-profile?email=seu@email.com"
   ```

3. Verifique os logs do CloudWatch no Console AWS

## Checklist

- [ ] Deletei o usuário do Cognito
- [ ] Registrei novamente via frontend ou script
- [ ] Recebi o email de confirmação
- [ ] Confirmei o email
- [ ] Consegui fazer login com sucesso
- [ ] Fui redirecionado para o dashboard correto
