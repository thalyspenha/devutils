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

> ⚠️ **Electron em NixOS:** o binário `electron@41` baixado pelo npm não roda direto (`libglib-2.0.so.0: cannot open shared object file`). Precisa de `nix-ld`, um FHS env, ou rodar via o `electron` do nixpkgs. Não afeta o empacotamento final (a AppImage traz o runtime).

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
