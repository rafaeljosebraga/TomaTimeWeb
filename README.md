# Tomatimer

Aplicação web de gestão de foco baseada na técnica Pomodoro. O Tomatimer permite configurar ciclos de estudo, acompanhar sessões de foco e organizar tarefas em um painel responsivo, com persistência local no navegador.

## Equipe

- João Kennedy
- Pedro Reis
- Rafael José
- André Felipe

## Objetivo

O projeto foi desenvolvido para estudantes que desejam organizar sessões de estudo com ciclos de foco e pausa, mantendo o controle do tempo e das tarefas relacionadas em um único ambiente.

O sistema é single-user e executa inteiramente no navegador. Não há autenticação, backend ou sincronização entre dispositivos.

## Funcionalidades

### Temporizador e sessões

- Criação, edição, exclusão e seleção de presets de estudo.
- Configuração de tempo de foco, pausa curta, quantidade de ciclos antes da pausa longa e pausa longa.
- Fases de foco, pausa curta e pausa longa.
- Controles para iniciar, pausar, retomar, pular fase, reiniciar ciclos e encerrar sessão.
- Troca de preset com encerramento automático da sessão atual.
- Snapshot dos parâmetros do preset no início da sessão.
- Retomada automática após atualização ou reabertura da aplicação.
- Recalculo temporal por timestamps absolutos.
- Descarte contextual de sessões restauradas.
- Alerta sonoro ao final de cada fase.

### Tarefas de estudo

- Criação, edição e exclusão de tarefas.
- Estados: backlog, a fazer, em execução, concluída e cancelada.
- Prioridades: baixa, média e alta.
- Ordenação fixa por prioridade e estado.
- Painel lateral no desktop e layout responsivo em telas menores.
- Confirmação obrigatória para exclusões.

### Interface

- Interface em português.
- Tema claro e escuro.
- Estilos visuais para o temporizador.
- Layout responsivo para desktop e dispositivos móveis.
- Gaveteiros mobile com animações e suporte a arraste para fechar.
- Controles acessíveis por teclado e com rótulos semânticos.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- Lucide React
- Vitest
- Testing Library
- Docker e Docker Compose
- Node.js 22+ para o ambiente local

## Arquitetura

O código está organizado por responsabilidade:

```text
src/
├── components/       # Componentes React e componentes visuais
├── lib/domain/       # Regras de negócio, timer, validações e ordenação
├── lib/storage/      # Persistência e leitura do localStorage
├── types/            # Tipos compartilhados do domínio
├── App.tsx           # Composição principal da aplicação
├── main.tsx          # Entrada do Vite e inicialização do React
└── index.css         # Estilos globais e tema
```

### Persistência

Todos os dados são armazenados localmente no navegador:

- `pomodoro.presets`: presets de estudo;
- `pomodoro.activePresetId`: preset atualmente selecionado;
- `pomodoro.sessaoAtiva`: sessão ativa e seus timestamps;
- `pomodoro.tarefas`: tarefas de estudo.

As sessões usam timestamps absolutos e um snapshot do preset para que alterações posteriores no preset não modifiquem uma sessão já iniciada.

## Requisitos

Para executar sem Docker:

- Node.js 22 ou superior;
- npm;
- navegador moderno com suporte a `localStorage`.

Para executar com Docker:

- Docker;
- Docker Compose.

## Execução sem Docker

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse `http://localhost:5173`.

## Execução com Docker

Suba o servidor de desenvolvimento:

```bash
docker compose up --build app
```

Acesse `http://localhost:5173`.

O serviço `app` monta o código local no container e mantém o diretório de dependências isolado no volume `/app/node_modules`.

Para executar os testes no container:

```bash
docker compose run --rm test
```

Para encerrar os serviços:

```bash
docker compose down
```

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor Vite em modo desenvolvimento. |
| `npm run typecheck` | Executa a checagem de tipos TypeScript. |
| `npm run test` | Executa o Vitest em modo interativo. |
| `npm run test:run` | Executa todos os testes uma vez. |
| `npm run test:coverage` | Executa os testes com relatório de cobertura. |
| `npm run build:vite` | Executa o typecheck incremental e gera o build Vite. |
| `npm run build` | Script legado de build Next.js mantido no manifest. |
| `npm run start` | Script legado de execução Next.js mantido no manifest. |

Para validar o fluxo principal do projeto, utilize:

```bash
npm run typecheck
npm run test:run
npm run build:vite
```

## Integração contínua

O GitHub Actions executa validações em pull requests e pushes para `main`, incluindo instalação das dependências, typecheck, testes automatizados e validação de build.

## Escopo e limitações

O projeto atualmente não contempla:

- autenticação ou login;
- backend ou banco de dados remoto;
- sincronização entre dispositivos;
- colaboração ou compartilhamento;
- notificações push ou do navegador;
- filtros, etiquetas ou subtarefas;
- integração com calendários;
- aplicativo nativo;
- analytics, histórico ou gamificação;
- internacionalização.

## Licença

Não há uma licença de código definida no repositório neste momento.
