{
  description = "@stupa-makers/ui-kit — Angular UI component library";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      nodejs = pkgs.nodejs_22;

      ui-kit = pkgs.buildNpmPackage {
        pname = "stupa-makers-ui-kit";
        version = "0.1.0";
        src = ./.;

        inherit nodejs;
        npmDepsHash = "sha256-neU9RmDU4eL/M0U8uyUzfCjrmEy+Q2wGQhQj/PlaeR4=";

        # `npm run build` -> `ng build ui-kit`, emitting the packaged library to
        # ./dist (ng-package.json `dest`).
        npmBuildScript = "build";

        # Keep the Angular CLI non-interactive (no analytics consent prompt).
        env.NG_CLI_ANALYTICS = "false";
        CI = "true";

        installPhase = ''
          runHook preInstall
          mkdir -p $out
          cp -r dist/. $out/
          runHook postInstall
        '';

        meta = {
          description = "STUPA-MAKERS design system + Angular UI component library";
          homepage = "https://github.com/STUPA-MAKERS/ui-kit";
          license = pkgs.lib.licenses.gpl3Plus;
        };
      };
    in
    {
      packages.${system} = {
        default = ui-kit;
        ui-kit = ui-kit;
      };

      devShells.${system}.default = pkgs.mkShell {
        packages = [ nodejs ];
        shellHook = ''
          echo "ui-kit dev shell — node $(node --version), npm $(npm --version)"
          echo "Install deps with: npm ci   |   build: npm run build   |   test: npm test"
        '';
      };
    };
}
