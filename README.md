# PsiuMeet — App de Exemplo

> Aplicação de demonstração do [psiu-meet-client](https://github.com/Danielpvbrbr/psiu-meet-client) — mostra como integrar videochamadas WebRTC em um projeto React real.

---

## O que é isso?

Este repositório é um **exemplo completo e funcional** de como usar a biblioteca `psiu-meet-client`. Ele simula um sistema de aulas online onde:

- O **professor** cria uma sala com tempo limitado
- O **aluno** entra na sala usando a chave gerada
- O **timer** só consome tempo quando os dois estão conectados ao mesmo tempo
- A **sessão persiste** no `localStorage` — F5 reconecta automaticamente
- A **sala encerra** automaticamente quando o tempo acaba, com contagem regressiva

---

## Pré-requisitos

- Node.js 18+
- O [servidor de sinalização](https://github.com/Danielpvbrbr/psiu-meet-client) rodando localmente

---

## Instalação

```bash
git clone https://github.com/Danielpvbrbr/psiu-meet-client
cd psiu-meet-client
npm install
```

---

## Configuração

No `App.jsx`, altere a URL do servidor conforme seu ambiente:

```js
const SERVER_URL = 'http://localhost:3333';
```

---

## Rodando o servidor de sinalização

```bash
cd server
npm install
node server.js
```

O servidor sobe na porta `3333` por padrão. Acesse `http://localhost:3333/dashboard` para monitorar as salas ativas.

---

## Rodando o app

```bash
npm run dev
```

Acesse `http://localhost:5173` no navegador.

---

## Como usar o Painel de Teste

O app abre com um painel onde você pode editar o JSON livremente antes de conectar.

**Professor:**
```json
{
  "papel": "professor",
  "nome": "Daniel",
  "chave": "",
  "tempo": 60
}
```
Deixe `chave` vazio — o servidor gera um ID automaticamente. O `tempo` é em minutos.

**Aluno:**
```json
{
  "papel": "aluno",
  "nome": "Gabriel",
  "chave": "id-da-sala-aqui"
}
```
Cole o `roomId` gerado pelo professor no campo `chave`.

> Dica: abra duas abas no mesmo navegador — uma como professor e outra como aluno.

---

## Funcionalidades demonstradas

| Funcionalidade | Como testar |
|---|---|
| Criar sala | Clique em "Abrir como Professor" com `chave` vazio |
| Entrar na sala | Copie o `roomId` exibido e cole no JSON do aluno |
| Timer por consumo | O contador só avança quando os dois estão conectados |
| Pausar timer | Feche uma das abas — o contador para |
| Reconexão automática | Pressione F5 — a sessão é restaurada do `localStorage` |
| Encerramento automático | Aguarde o tempo acabar — aparece o modal de contagem |
| Feedback sonoro | O Provider está com `vibes` ativo — ouça ao entrar/sair |
| Mutar microfone | Clique no botão de microfone na barra de controles |
| Desligar câmera | Clique no botão de câmera na barra de controles |
| Vídeo arrastável | Arraste o seu vídeo (PiP) para qualquer canto da tela |

---

## Estrutura do projeto

```
src/
  App.jsx          — app completo de demonstração
  main.jsx         — entry point React
  index.css        — Tailwind CSS

server/
  server.js        — servidor de sinalização Node.js + Socket.io + SQLite
  package.json     — dependências do servidor
  psiu.db          — banco SQLite (gerado automaticamente)
```

---

## Tecnologias usadas

| | |
|---|---|
| [psiu-meet-client](https://www.npmjs.com/package/psiu-meet-client) | Biblioteca de videochamadas WebRTC |
| [React](https://react.dev) | Interface |
| [Tailwind CSS](https://tailwindcss.com) | Estilização |
| [react-draggable](https://www.npmjs.com/package/react-draggable) | Vídeo PiP arrastável |
| [lucide-react](https://lucide.dev) | Ícones |
| [Socket.io](https://socket.io) | Comunicação em tempo real |
| [better-sqlite3](https://www.npmjs.com/package/better-sqlite3) | Persistência do timer no servidor |

---

## Licença

MIT © [Daniel](https://github.com/Danielpvbrbr)
