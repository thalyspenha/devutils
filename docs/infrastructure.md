# Infraestrutura

## Resumo

Aplicação **desktop** distribuída como binário Electron. **Não há infraestrutura de servidor, container ou nuvem.** O "deploy" é o empacotamento de um instalável Linux.

## Docker

**Não existe.** Nenhum `Dockerfile`, `docker-compose.yml`, `.dockerignore` ou referência a container no repositório.

## CI / CD

**Não existe.** Sem `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/`, etc. Build e publicação são manuais.

## Build e empacotamento

Definido em `app/package.json`:

- `npm run build` = `tsc -b && vite build && electron-builder -l`
  1. `tsc -b` — type-check dos projetos referenciados (`tsconfig.app.json`, `tsconfig.node.json`), `noEmit`.
  2. `vite build` — bundle do renderer para `app/dist/`.
  3. `electron-builder -l` — empacota para **Linux** (`-l`). **Não há bloco `build` de configuração** do electron-builder em `package.json` nem arquivo `electron-builder.yml`; portanto valem os **defaults** da ferramenta (formato de saída, `appId`, ícones, diretório `dist/` do empacotador — Não identificado além do default).
- Em produção, `main.cjs` carrega `dist/index.html` via `loadFile` (caminho relativo a `app/`). O uso de `HashRouter` no renderer é o que viabiliza o roteamento sob `file://`.

> ⚠️ **Ponto de atenção (build):** os arquivos `JsonFormatterTool.tsx`, `Base64Tool.tsx` e `JwtDecoderTool.tsx` fazem `import React, { … }` mas nunca usam `React`. Com `noUnusedLocals: true` (ambos os tsconfig), `tsc -b` tende a falhar com `TS6133`. O `vite build` (esbuild) ignoraria isso. Não foi possível executar o build para confirmar (sem `node_modules` no ambiente de análise). Ver `docs/decisions.md` e `docs/testing.md`.

## Ambiente de desenvolvimento

- `npm run dev` = `concurrently -k "vite" "npm run electron:dev"`.
- `npm run electron:dev` = `wait-on tcp:1234 && cross-env NODE_ENV=development electron .`.
- `main.cjs` (dev) faz `loadURL('http://localhost:1234')`.

> ⚠️ **Inconsistência de porta:** o fluxo dev espera a porta **1234** (`wait-on tcp:1234`, `loadURL(:1234)`), mas `app/vite.config.ts` **não define `server.port`**. O default do Vite é **5173**. Como está, `wait-on` nunca destrava (ou destrava por outro motivo) e o Electron aponta para uma porta onde o Vite não está servindo. Para o dev funcionar como escrito, `vite.config.ts` precisaria de `server: { port: 1234 }` (ou os scripts/`main.cjs` precisariam usar 5173). Registrado aqui como divergência entre código e configuração.

## Configuração de runtime

| Item | Fonte | Valor |
|---|---|---|
| Ambiente | `process.env.NODE_ENV` | `development` (setado por `cross-env` no script) ou ausente (prod) |
| Dev server URL | hardcoded em `main.cjs` | `http://localhost:1234` |
| Prod entry | hardcoded em `main.cjs` | `dist/index.html` |
| Janela | hardcoded em `main.cjs` | 1000×700, mín. 800×600, `autoHideMenuBar`, `backgroundColor: #0f172a` |

- **Sem** arquivo `.env` (e `.env*` está no `.gitignore`).
- **Sem** `engines` no `package.json`, **sem** `.nvmrc` / `.node-version` → versão de Node/npm requerida: **Não identificado**.

## Versões de plataforma (declaradas em `app/package.json`)

| Componente | Versão declarada |
|---|---|
| Electron | `^41.0.2` |
| Vite | `^8.0.0` |
| React / React DOM | `^19.2.4` |
| TypeScript | `~5.9.3` |
| Node (dev/build) | Não identificado |

## Repositório

- Git remoto: `git@github.com-personal:thalyspenha/devutils.git` (host alias SSH `github.com-personal`).
- Branch principal: `main`.
- Raiz do repositório **não tem** `package.json` (só um `package-lock.json` stub com `"packages": {}`). O projeto real está em `app/`.

## Hospedagem / servidores / DNS / TLS

**Não aplicável.** É um app desktop; não há servidores para hospedar.

## Backups, escalabilidade, monitoramento de infra

**Não aplicável / Não identificado.**
