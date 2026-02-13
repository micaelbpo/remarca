# Deploy no Vercel - Guia Completo

## Pré-requisitos

1. Conta no Vercel (https://vercel.com)
2. Vercel CLI instalado (opcional, mas recomendado)

## Opção 1: Deploy via Interface Web (Recomendado)

### Passo 1: Preparar o Repositório
```bash
git add .
git commit -m "Preparar para deploy no Vercel"
git push origin main
```

### Passo 2: Importar Projeto no Vercel
1. Acesse https://vercel.com/new
2. Conecte sua conta GitHub/GitLab/Bitbucket
3. Selecione este repositório
4. Configure o projeto:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Passo 3: Configurar Variáveis de Ambiente
No painel do Vercel, adicione:
- `VITE_API_BASE_URL` = `https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev`

### Passo 4: Deploy
Clique em "Deploy" e aguarde o processo finalizar.

## Opção 2: Deploy via CLI

### Passo 1: Instalar Vercel CLI
```bash
npm install -g vercel
```

### Passo 2: Login
```bash
vercel login
```

### Passo 3: Deploy
```bash
# Deploy de preview
vercel

# Deploy de produção
vercel --prod
```

## Configuração Automática

O arquivo `vercel.json` na raiz do projeto já está configurado com:
- Build command correto
- Output directory
- Rewrites para SPA (Single Page Application)

## Variáveis de Ambiente

As variáveis de ambiente estão configuradas em:
- `.env` - desenvolvimento local
- `.env.production` - produção (Vercel)

Para adicionar/modificar variáveis no Vercel:
1. Acesse o dashboard do projeto
2. Settings → Environment Variables
3. Adicione as variáveis necessárias

## Domínio Customizado (Opcional)

1. No dashboard do Vercel, vá em Settings → Domains
2. Adicione seu domínio customizado
3. Configure os DNS conforme instruções do Vercel

## Atualizações Automáticas

Após o primeiro deploy:
- Cada push para `main` → deploy automático em produção
- Cada push para outras branches → deploy de preview

## Monitoramento

Acesse o dashboard do Vercel para:
- Ver logs de build
- Monitorar performance
- Verificar analytics
- Gerenciar deployments

## Troubleshooting

### Build falha
- Verifique se todas as dependências estão no `package.json`
- Confirme que o comando `npm run build` funciona localmente

### Rotas não funcionam (404)
- Verifique se o `vercel.json` tem as rewrites configuradas
- Confirme que está usando React Router corretamente

### API não conecta
- Verifique se `VITE_API_BASE_URL` está configurada
- Confirme que a API AWS está acessível publicamente
- Verifique CORS na API Gateway

## Links Úteis

- Dashboard: https://vercel.com/dashboard
- Documentação: https://vercel.com/docs
- CLI: https://vercel.com/docs/cli
