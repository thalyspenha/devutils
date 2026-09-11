// Preload script — roda em contexto isolado (contextIsolation: true, sandbox: true).
// Nenhuma API é exposta ao renderer hoje: o app não usa IPC entre main e renderer
// (ver CLAUDE.md — "Sem IPC", "Sem estado global"). Antes de expor algo aqui via
// contextBridge.exposeInMainWorld, revisar segurança (superfície exposta ao renderer).
