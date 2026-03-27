import * as fs from "fs/promises";
import * as path from "path";
import type { ServicesLanguage } from "@shared/domain.types";
import { DOCKERFILES, SOURCE_FILENAME } from "./docker.constants";

export async function createBuildContext(params: {serviceId: string; language: ServicesLanguage; sourceCode: string; port: number }) {
    const { serviceId, language, sourceCode, port } = params;

    const buildDir = path.join("/tmp", `ms-build-${serviceId}`);

    await fs.mkdir(buildDir, { recursive: true });

    await fs.writeFile(
        path.join(buildDir, "Dockerfile"),
        DOCKERFILES[language](port),
        "utf-8"
    );

    await fs.writeFile(
        path.join(buildDir, SOURCE_FILENAME[language]),
        sourceCode,
        "utf-8"
    );

    return {
        buildDir,
        src: ["Dockerfile", SOURCE_FILENAME[language]],
    };
}

export async function removeBuildContext(buildDir: string) {
    await fs.rm(buildDir, { recursive: true, force: true });
}