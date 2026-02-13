# Como Configurar Variáveis de Ambiente no Vercel

## Durante o Primeiro Deploy

Quando você importar o projeto no Vercel, antes de clicar em "Deploy":

1. Role a página até encontrar **"Environment Variables"**
2. Clique em **"Add"** ou no campo de input
3. Preencha:
   ```
   Name: VITE_API_BASE_URL
   Value: https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev
   ```
4. Selecione os ambientes: **Production**, **Preview**, **Development**
5. Clique em **"Add"**
6. Agora clique em **"Deploy"**

## Depois do Deploy (Adicionar ou Editar)

### Passo 1: Acessar Configurações
1. Vá para https://vercel.com/dashboard
2. Clique no seu projeto
3. Clique em **"Settings"** (no menu superior)

### Passo 2: Adicionar Variável
1. No menu lateral, clique em **"Environment Variables"**
2. Você verá um formulário com 3 campos:
   - **Key (Name)**: `VITE_API_BASE_URL`
   - **Value**: `https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev`
   - **Environments**: Marque todos (Production, Preview, Development)
3. Clique em **"Save"**

### Passo 3: Aplicar as Mudanças
1. Volte para a aba **"Deployments"**
2. Clique nos 3 pontinhos (...) do último deployment
3. Clique em **"Redeploy"**
4. Confirme clicando em **"Redeploy"** novamente

## Verificar se Funcionou

Após o deploy, você pode verificar se a variável está funcionando:

1. Acesse seu site no Vercel
2. Abra o Console do navegador (F12)
3. Digite: `console.log(import.meta.env.VITE_API_BASE_URL)`
4. Deve aparecer: `https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev`

## Importante ⚠️

- Variáveis que começam com `VITE_` são expostas no frontend
- Após adicionar/modificar variáveis, sempre faça um **Redeploy**
- As variáveis só são aplicadas durante o build, não em runtime

## Variáveis Locais vs Produção

- **Local** (desenvolvimento): `frontend/.env`
- **Produção** (Vercel): Configurado no dashboard
- **Fallback**: O código já tem um fallback no `api.ts`

```typescript
// frontend/src/config/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev';
```

Isso significa que mesmo sem configurar, vai usar a URL padrão da AWS.
