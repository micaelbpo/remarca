# Remarca Frontend

Interface web para a plataforma de agendamento médico Remarca.

## Tecnologias

- React 19
- TypeScript
- Vite
- Chakra UI
- React Router
- Axios

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## Estrutura

```
src/
├── components/     # Componentes reutilizáveis
├── contexts/       # Contextos React (Auth, etc)
├── pages/          # Páginas da aplicação
├── services/       # Serviços de API
├── types/          # Tipos TypeScript
├── config/         # Configurações
├── App.tsx         # Componente principal
└── main.tsx        # Entry point
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do frontend:

```
VITE_API_BASE_URL=https://net3xvxf4e.execute-api.us-east-1.amazonaws.com/dev
```

## Páginas Implementadas

- ✅ Login
- ✅ Registro
- ✅ Dashboard básico
- 🚧 Dashboard Profissional (em desenvolvimento)
- 🚧 Dashboard Paciente (em desenvolvimento)
- 🚧 Agendamento (em desenvolvimento)
- 🚧 Configuração de Disponibilidade (em desenvolvimento)

## Deploy

O frontend pode ser hospedado em:
- Vercel (recomendado para MVP)
- AWS S3 + CloudFront
- Netlify

### Deploy no Vercel

1. Conecte o repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push
