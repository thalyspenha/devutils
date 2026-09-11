# Infraestrutura

## Resumo

Aplicação **desktop** distribuída como binário Electron. **Não há infraestrutura de servidor, container ou nuvem.** O "deploy" é o empacotamento de um instalável Linux.

## Docker

**Não existe.** Nenhum `Dockerfile`, `docker-compose.yml`, `.dockerignore` ou referência a container no repositório.

## CI / CD

**Não existe.** Sem `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/`, etc. Build e publicação são manuais.

## Build e empacotamento

Definido em `app/package.json`:

- `npm run build` = `tsc -b && vite build`
  1. `tsc -b` — type-check dos projetos referenciados (`tsconfig.app.json`, `tsconfig.node.json`), `noEmit`.
  2. `vite build` — bundle do renderer para `app/dist/`. `vite.config.ts` define `base: './'` para os assets funcionarem sob `file://` (produção Electron).
- `npm run dist` = `npm run build && electron-builder -l`
  3. `electron-builder -l` — empacota para **Linux** (`-l`, target `AppImage`), saída em `app/release/`.
- Há bloco `build` de configuração do electron-builder em `package.json`:
  - `appId: com.thalys.devutils`, `productName: DevUtils`, `executableName: devutils`
  - `directories.output: release` (o default seria `dist/`, que colidiria com a saída do Vite), `buildResources: build`
  - `files`: `dist/**/*`, `main.cjs`, `preload.cjs`, `!node_modules/**` — o renderer é 100% bundizado pelo Vite, então excluir `node_modules` reduz o asar de ~51 MB para ~1 MB. `main.cjs`/`preload.cjs` só usam APIs nativas do Electron.
  - `linux`: target `AppImage`, `category: Utility`. Ícone em `app/build/icon.png` (512×512).
- Em produção, `main.cjs` carrega `dist/index.html` via `loadFile` (caminho relativo a `app/`). O uso de `HashRouter` no renderer é o que viabiliza o roteamento sob `file://`.

> **Resolvido** (antes uma ressalva aqui): `JsonFormatterTool.tsx`, `Base64Tool.tsx` e `JwtDecoderTool.tsx` tinham `import React` não usado que quebrava `tsc -b` (`TS6133`). Removido. `npm run build` passa (exit 0), verificado.

## Ambiente de desenvolvimento

- `npm run dev` = `concurrently -k "vite" "npm run electron:dev"`.
- `npm run electron:dev` = `wait-on tcp:1234 && cross-env NODE_ENV=development electron .`.
- `main.cjs` (dev) faz `loadURL('http://localhost:1234')`.
- `vite.config.ts` define `server: { port: 1234, strictPort: true }` — casa com o `wait-on tcp:1234` e o `loadURL(:1234)`. (Antes o Vite subia na 5173 default e o fluxo dev não destravava — corrigido.)

## Configuração de runtime

| Item | Fonte | Valor |
|---|---|---|
| Ambiente | `process.env.NODE_ENV` | `development` (setado por `cross-env` no script) ou ausente (prod) |
| Dev server URL | hardcoded em `main.cjs` | `http://localhost:1234` |
| Prod entry | hardcoded em `main.cjs` | `dist/index.html` |
| Janela | hardcoded em `main.cjs` | 1000×700, mín. 800×600, `autoHideMenuBar`, `backgroundColor: #0f172a` |

- **Sem** arquivo `.env` (e `.env*` está no `.gitignore`).
- Versão de Node requerida: **`^24`** — declarada em `engines.node` (`app/package.json`) e `app/.node-version`. Sem `.nvmrc` (redundante com `.node-version`, não adicionado).

> ⚠️ **Node 26 quebra a extração do binário do Electron.** Foi observado empiricamente (Node 26.8.1 via `mise`) que o `npm install`/postinstall do pacote `electron` falha **silenciosamente**: `extract-zip@2.0.1` (→ `yauzl@2.10.0`) não descompacta o zip baixado (~117 MB, contém um binário de ~206 MB) — o processo termina com exit code 0, sem erro, mas `node_modules/electron/dist/` fica incompleto (só a pasta `locales/`), e `npm run dev`/`electron .` falha com `Error: Electron failed to install correctly, please delete node_modules/electron and try installing again`. Reproduzido e comparado lado a lado: **Node 24.21.0 extrai o mesmo zip normalmente** (< 1s). Causa exata não identificada (suspeita: regressão em streams/zlib do Node 26 interagindo com o `yauzl` 2.x, que está sem manutenção ativa). É por isso que a versão de Node deste projeto está fixada em `^24` (`engines` + `.node-version`).
>
> Se isso voltar a acontecer (build "instalado" mas `node_modules/electron/dist/` sem o binário `electron`): confirmar a versão do Node ativa (`node -v`), trocar para `^24`, rodar `rm -rf node_modules/electron && npm install` (ou `npm rebuild electron`) de novo.

## Versões de plataforma (declaradas em `app/package.json`)

| Componente | Versão declarada |
|---|---|
| Electron | `^41.0.2` |
| Vite | `^8.0.0` |
| React / React DOM | `^19.2.4` |
| TypeScript | `~5.9.3` |
| Node (dev/build) | `^24` (`engines.node` + `app/.node-version`) |

## Repositório

- Git remoto: `git@github.com-personal:thalyspenha/devutils.git` (host alias SSH `github.com-personal`).
- Branch principal: `main`.
- Raiz do repositório **não tem** `package.json` (só um `package-lock.json` stub com `"packages": {}`). O projeto real está em `app/`.

## Hospedagem / servidores / DNS / TLS

**Não aplicável.** É um app desktop; não há servidores para hospedar.

## Backups, escalabilidade, monitoramento de infra

**Não aplicável / Não identificado.**
