# Guia de Deploy com GitHub Actions

Este projeto usa GitHub Actions para deploy automático na AWS. Você só precisa fazer `git push` e o deploy acontece automaticamente!

## 📋 Pré-requisitos

1. **Conta AWS** (pode usar free tier)
2. **Repositório no GitHub**
3. **Credenciais AWS** (Access Key ID e Secret Access Key)

## 🔧 Configuração Inicial (Uma Vez Só)

### Passo 1: Criar Usuário IAM na AWS

1. **Login no Console AWS**: https://console.aws.amazon.com
2. **Vá para IAM** (Identity and Access Management)
3. **Criar usuário**:
   - Nome: `github-actions-deploy`
   - Tipo de acesso: ✅ Programmatic access (Access Key)

4. **Adicionar permissões**:
   - Anexar policy: `AdministratorAccess` (para desenvolvimento)
   - Ou criar policy customizada com permissões específicas

5. **Salvar credenciais**:
   - Access Key ID: `AKIA...`
   - Secret Access Key: `wJalr...`
   - ⚠️ **IMPORTANTE**: Salve em local seguro!

### Passo 2: Adicionar Secrets no GitHub

1. **Vá para seu repositório no GitHub**
2. **Settings** → **Secrets and variables** → **Actions**
3. **Clique em "New repository secret"**

Adicione estes 2 secrets:

**Secret 1:**
- Name: `AWS_ACCESS_KEY_ID`
- Value: [Cole o Access Key ID da AWS]

**Secret 2:**
- Name: `AWS_SECRET_ACCESS_KEY`
- Value: [Cole o Secret Access Key da AWS]

### Passo 3: Criar Branches

```bash
# Branch principal (produção)
git checkout -b main

# Branch de desenvolvimento
git checkout -b develop
```

## 🚀 Como Usar

### Deploy Automático

**Para ambiente de desenvolvimento:**
```bash
git checkout develop
git add .
git commit -m "feat: nova funcionalidade"
git push origin develop
```

**Para produção:**
```bash
git checkout main
git merge develop
git push origin main
```

O GitHub Actions vai:
1. ✅ Instalar dependências
2. ✅ Rodar testes
3. ✅ Fazer build com SAM
4. ✅ Deploy na AWS
5. ✅ Mostrar URL da API

### Deploy Manual

Você também pode executar o deploy manualmente:

1. Vá para **Actions** no GitHub
2. Selecione **Deploy to AWS**
3. Clique em **Run workflow**
4. Escolha a branch (develop ou main)
5. Clique em **Run workflow**

## 📊 Workflows Disponíveis

### 1. Deploy to AWS (`deploy.yml`)
- **Quando executa**: Push para `main` ou `develop`
- **O que faz**: 
  - Roda testes
  - Build da aplicação
  - Deploy na AWS
  - Mostra URL da API

### 2. Run Tests (`test.yml`)
- **Quando executa**: Pull Request ou Push
- **O que faz**:
  - Roda linter
  - Roda testes unitários
  - Gera relatório de cobertura
  - Comenta no PR com resultados

## 🌍 Ambientes

| Branch | Ambiente | Stack Name | URL |
|--------|----------|------------|-----|
| `develop` | Desenvolvimento | `remarca-dev` | Gerada após deploy |
| `main` | Produção | `remarca-prod` | Gerada após deploy |

## 🔍 Verificar Deploy

Após o push, você pode:

1. **Ver o progresso**:
   - GitHub → **Actions** → Clique no workflow em execução

2. **Ver logs**:
   - Clique no job "deploy"
   - Veja cada step sendo executado

3. **Pegar URL da API**:
   - No final dos logs, procure: "🚀 API deployed at: https://..."
   - Ou vá no Console AWS → CloudFormation → Outputs

## 🐛 Troubleshooting

### Erro: "AWS credentials not found"
- Verifique se adicionou os secrets no GitHub
- Nomes devem ser exatamente: `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`

### Erro: "Stack already exists"
- Normal na primeira vez
- O SAM vai atualizar a stack existente

### Erro: "Tests failed"
- O deploy continua mesmo se testes falharem (por enquanto)
- Para bloquear deploy com testes falhando, remova `continue-on-error: true`

### Erro: "Insufficient permissions"
- O usuário IAM precisa de mais permissões
- Adicione `AdministratorAccess` ou permissões específicas

## 💰 Custos

- **GitHub Actions**: 2000 minutos/mês grátis
- **AWS**: ~$5-7/mês (dentro do free tier)

## 🔒 Segurança

✅ **Boas práticas implementadas:**
- Credenciais AWS em secrets (nunca no código)
- Secrets criptografados pelo GitHub
- Logs não mostram valores sensíveis
- Deploy apenas de branches específicas

❌ **Nunca faça:**
- Commitar credenciais AWS no código
- Compartilhar secrets
- Usar credenciais pessoais (crie usuário específico)

## 📝 Próximos Passos

Após configurar:

1. ✅ Adicionar secrets no GitHub
2. ✅ Fazer primeiro push
3. ✅ Verificar deploy no Actions
4. ✅ Testar API com a URL gerada
5. ✅ Configurar domínio customizado (opcional)

## 🆘 Precisa de Ajuda?

Se encontrar problemas:
1. Verifique os logs no GitHub Actions
2. Verifique CloudFormation no Console AWS
3. Verifique CloudWatch Logs para erros das Lambdas

---

**Pronto!** Agora você tem CI/CD profissional sem precisar instalar nada no seu computador! 🎉
