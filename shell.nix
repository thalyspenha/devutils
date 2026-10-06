{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  packages = with pkgs; [
    nodejs_24 # Node ^24 obrigatório (ver docs/infrastructure.md, D18)
    electron_44 # binário do npm não roda no NixOS (sem /lib FHS)
    fpm # o fpm baixado pelo electron-builder (target deb) também não roda
  ];
  # Faz o pacote npm `electron` usar o binário do nixpkgs (só dev; o
  # electron-builder empacota o Electron baixado do npm).
  ELECTRON_OVERRIDE_DIST_PATH = "${pkgs.electron_44}/bin";
  ELECTRON_SKIP_BINARY_DOWNLOAD = "1";
  USE_SYSTEM_FPM = "true";
}
