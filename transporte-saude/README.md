# TransporteSaúde 🚑

Sistema de controle de transporte gratuito de saúde municipal.

## Funcionalidades

- **Portal do Motorista** — roteiro do dia, agendadas, histórico, assinatura digital, abastecimento
- **Portal Admin** — criação/edição de viagens (em qualquer status), cadastros completos, dashboard
- **Relatórios** — prestação de contas, combustível, por motorista/veículo/destino, exportação
- **Painel do Paciente** — consulta de viagens e status por CPF ou nome
- **Assinatura Digital** — coleta de assinatura com o dedo na tela
- **Controle de Abastecimento** — litros, valor, KM, nota fiscal

## Configuração rápida

```bash
# 1. Instalar dependências
npm install

# 2. Rodar localmente
npm run dev

# 3. Acessar no navegador
# http://localhost:5173

# 4. Testar no celular (mesma rede Wi-Fi)
npm run dev -- --host
# Acesse o IP exibido no terminal pelo celular
```

## Publicar no Vercel (acesso pelo celular de qualquer lugar)

1. Instalar Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Publicar:
   ```bash
   vercel
   ```
3. Acessar a URL gerada e **"Adicionar à Tela Inicial"** no celular

## Estrutura do projeto

```
src/
  App.jsx          — Componente raiz, gerenciamento de estado global
  data.js          — Dados mock e constantes (substituir por API no futuro)
  UI.jsx           — Componentes de UI reutilizáveis
  Modals.jsx       — Todos os modais (CRUD, assinatura, abastecimento)
  DriverView.jsx   — Portal do motorista
  AdminView.jsx    — Painel administrativo
  Relatorios.jsx   — Relatórios e prestação de contas
  PainelPaciente.jsx — Consulta de viagens pelo paciente
```

## Integração com banco de dados (futuro)

Para conectar ao Supabase (recomendado):

1. Criar conta em supabase.com
2. Criar as tabelas: pacientes, destinos, motoristas, veiculos, viagens, passageiros_viagem
3. Substituir os dados em `data.js` por chamadas à API do Supabase
4. Adicionar autenticação via Supabase Auth

## Suporte

Secretaria de Saúde — (67) 3300-0000
