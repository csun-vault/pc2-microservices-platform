import { Router } from "express";
import * as dc from "./docker.controller";
import { dockerGuard } from "@middlewares/dockerGuard.middleware";

const router = Router();

// Acciones generales
// 🟩 GET - Tomar la info del daemon de Docker - docker
router.get("/version", dc.getDaemonVersion );

// 🟩 GET - Listar Contenedores - docker/containers
router.get("/containers/", dockerGuard, dc.listAllContainers);

export const dockerRoutes = router;