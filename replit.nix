{ pkgs }: {
  deps = [
    pkgs.nodejs_22
    pkgs.nodePackages.pnpm
    pkgs.nodePackages.typescript-language-server
    pkgs.postgresql
    pkgs.openssl
  ];
}
