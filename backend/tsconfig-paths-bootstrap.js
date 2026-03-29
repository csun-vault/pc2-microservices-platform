const path = require("path");
const tsConfigPaths = require("tsconfig-paths");
const tsconfig = require("./tsconfig.json");

const originalPaths = tsconfig.compilerOptions.paths || {};

const runtimePaths = Object.fromEntries(
    Object.entries(originalPaths).map(([alias, paths]) => [
        alias,
        paths.map((p) => p.replace(/^src\//, "dist/app/src/"))
    ])
);

tsConfigPaths.register({
    baseUrl: path.resolve(__dirname),
    paths: runtimePaths,
});