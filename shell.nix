# Ambiente de desenvolvimento do DevUtils.
#
#   nix-shell            # entra no shell manualmente
#   direnv allow         # (com o .envrc) carrega automático ao entrar na pasta
#
# O app real está em ./app — rode os comandos npm lá dentro:
#   cd app && npm install && npm run dev
{
  pkgs ? import <nixpkgs> { },
}:

let
  # Casa com "electron": "^41.0.2" do app/package.json.
  electron = pkgs.electron_41;
in
pkgs.mkShell {
  packages = [
    pkgs.nodejs_24 # traz npm; @types/node do projeto é ^24
    electron # usado só via ELECTRON_OVERRIDE_DIST_PATH (Electron não roda "puro" no NixOS)
    pkgs.resvg # regenerar o ícone: resvg app/build/icon.svg app/build/icon.png -w 512 -h 512
  ];

  # O pacote npm "electron" respeita esta env e usa o binário do nixpkgs
  # em vez de baixar um que não linka no NixOS. Afeta só o runtime (`npm run dev`);
  # o `npm run dist` (electron-builder) baixa o dist oficial p/ empacotar de forma portável.
  ELECTRON_OVERRIDE_DIST_PATH = "${electron}/libexec/electron";

  shellHook = ''
    echo "devutils — node $(node -v), electron ${electron.version} (nixpkgs)"
    echo "  cd app && npm install && npm run dev"
  '';
}
