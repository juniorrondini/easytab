<p align="center">
  <img src="public/icons/icon128.png" width="96" height="96" alt="easytab logo" />
</p>

<h1 align="center">easytab</h1>

<p align="center">
  Organize o caos das suas abas antes que ele organize você.
</p>

<p align="center">
  <strong>Uma extensão Chrome MV3 para power users, devs e pesquisadores que vivem com 40, 80 ou 150 abas abertas.</strong>
</p>

<p align="center">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Chrome%20Extension-MV3-1f9cf0?style=for-the-badge" />
  <img alt="React" src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=111827" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-ready-3178c6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-fast-646cff?style=for-the-badge&logo=vite&logoColor=white" />
</p>

---

## O Que É

**easytab** é uma extensão para Google Chrome que transforma abas abertas em um painel de trabalho organizado: agrupa por contexto, detecta duplicadas, hiberna abas inativas e salva sessões por projeto.

Ela foi pensada para quem trabalha com múltiplos fluxos ao mesmo tempo:

- Desenvolvedores alternando entre GitHub, docs, localhost e Stack Overflow.
- Pesquisadores abrindo dezenas de fontes, vídeos e artigos.
- Freelancers separando abas por cliente.
- Criadores de conteúdo pesquisando referências sem perder o contexto.

## Por Que Isso Existe

O Chrome já permite grupos de abas. O problema é que organizar tudo manualmente quebra o fluxo.

O easytab faz o trabalho pesado:

- lê suas abas abertas;
- classifica por tema;
- cria grupos visuais;
- encontra duplicadas;
- salva o contexto inteiro como sessão;
- restaura tudo quando você precisar voltar ao projeto.

## Funcionalidades

### Dashboard Rápido

Abra a popup e veja imediatamente:

- total de abas abertas;
- quantidade de janelas;
- abas duplicadas encontradas;
- abas inativas;
- sessões salvas.

### Organização Inteligente

Um clique em **Organizar abas** cria grupos com nomes e cores:

- **Desenvolvimento**: GitHub, Stack Overflow, localhost, Vercel.
- **Documentação**: MDN, docs, npm, React, TypeScript, Tailwind.
- **Vídeos**: YouTube, Vimeo, Twitch.
- **Redes sociais**: X/Twitter, LinkedIn, Instagram, Facebook, Reddit.
- **Notícias**: portais e artigos.
- **Compras**: Amazon, Mercado Livre, Shopee, AliExpress.
- **Outros**: o que não encaixar nas regras anteriores.

### Duplicadas Sob Controle

O easytab detecta abas com a mesma URL e permite fechar duplicadas automaticamente, mantendo a aba ativa ou a mais recente.

### Hibernação De Abas

Abas inativas podem ser hibernadas para reduzir consumo de memória.

Quando uma aba é hibernada, ela é substituída por uma página interna com:

> Esta aba foi hibernada para economizar memória.

E um botão para restaurar a URL original.

### Sessões Por Projeto

Salve e restaure contextos completos:

- Projeto Remape
- Projeto Estudos Golang
- Pesquisa YouTube Shorts
- Trabalho Cliente X

Cada sessão guarda:

- nome;
- abas;
- data de criação;
- última restauração;
- quantidade de abas.

### Opções Avançadas

Configure:

- tempo para considerar uma aba inativa;
- agrupamento automático;
- hibernação automática;
- domínios ignorados;
- exportação de sessões em JSON;
- importação de sessões em JSON;
- limpeza de dados salvos.

## Stack

- Chrome Extension Manifest V3
- TypeScript
- React
- Vite
- Tailwind CSS
- lucide-react
- Chrome APIs:
  - `chrome.tabs`
  - `chrome.tabGroups`
  - `chrome.storage`
  - `chrome.runtime`
  - `chrome.alarms`

## Estrutura

```txt
src/
  background/
    service-worker.ts
  popup/
    Popup.tsx
    main.tsx
  options/
    Options.tsx
    main.tsx
  pages/
    HibernatePage.tsx
    main.tsx
  utils/
    duplicates.ts
    runtime.ts
    sessions.ts
    storage.ts
    tabClassifier.ts
  types/
    index.ts
public/
  manifest.json
  icons/
    icon.svg
    icon16.png
    icon32.png
    icon48.png
    icon128.png
```

## Como Rodar

```bash
npm install
npm run dev
npm run build
```

O build de produção fica em:

```txt
dist/
```

## Como Carregar No Chrome

1. Rode `npm run build`.
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `dist`.

## Status

Funcionalidades principais implementadas:

- Manifest V3 configurado.
- Popup funcional.
- Service worker com APIs reais do Chrome.
- Agrupamento por categoria com `chrome.tabGroups`.
- Detecção e fechamento de duplicadas.
- Hibernação de abas inativas e selecionadas.
- Página interna para restaurar abas hibernadas.
- Sessões com salvar, restaurar, renomear e excluir.
- Opções com persistência em `chrome.storage.local`.
- Importação e exportação JSON.
- Logo e ícones da extensão.

## Build Validado

```bash
npm run build
```

O build executa:

- `tsc --noEmit`
- `vite build`

Também foi feita checagem do pacote final para confirmar:

- Manifest V3;
- `popup.html`;
- `options.html`;
- `hibernate.html`;
- `service-worker.js`;
- permissões necessárias;
- ícones da extensão.

## Roadmap

- Regras customizadas por usuário.
- Sugestões por IA local ou provider opcional.
- Sincronização entre máquinas.
- Atalhos de teclado.
- Busca dentro das sessões.
- Exportação em Markdown.
- Estatísticas de uso por domínio.

## Contribuindo

Ideias, issues e PRs são bem-vindos.

Se você já perdeu tempo procurando “aquela aba que estava aberta em algum lugar”, este projeto é para você.

## Licença

MIT
