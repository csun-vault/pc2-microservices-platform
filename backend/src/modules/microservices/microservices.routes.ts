import { Router } from "express";
import * as mc from "./microservices.controller";

const router = Router();

// Acciones generales
// 🟩 GET - Listar Microservicios - services/
router.get("/", mc.listServices);

// 🟨 POST - Crear Microservicios - services/
router.post("/", mc.createService);

// 🟩 GET - Info microservicio por ID - services/:id
router.get("/:id", mc.getServiceById);


// Acciones sobre contenedores
// 🟨 POST - Encender Microservicio - services/:id/start
router.post("/:id/start", mc.startService);

// 🟨 POST - Apagar Microservicio - services/:id/stop
router.post("/:id/stop", mc.stopService);

// 🟨 POST - Reiniciar Microservicio - services/:id/restart
router.post("/:id/restart", mc.restartService);

// 🟥 DELETE - Elimina Microservicio - services/:id/delete
router.delete("/:id/delete", mc.deleteService);

// 🟩 GET - Obtener el codigo fuente de un microservicio - services/:id/source
router.get("/:id/source", mc.getSourceCode);

// 🟨 POST - Invocar microservicio como proxy - services/:id/invoke
router.post("/:id/invoke", mc.invokeService);

// 🟩 GET - Mostrar logs Microservicio - services/:id/logs
router.get("/:id/logs", (_req, res) => {res.json({status: "ok"})});

export const microservicesRoutes = router;