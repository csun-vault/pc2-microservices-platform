import { Router } from "express";
import * as mc from "./microservices.controller";

const router = Router();

// Acciones generales
// 🟩 GET - Listar Microservicios - services/
router.get("/", (_req, res) => {res.json({status: "ok"})});

// 🟨 POST - Crear Microservicios - services/
//router.post("/", (_req, res) => {res.json({status: "ok"})});
router.post("/", mc.createService);

// 🟩 GET - Info microservicio por ID - services/:id
router.get("/:id", (_req, res) => {res.json({status: "ok"})});


// Acciones sobre contenedores
// 🟨 POST - Encender Microservicio - services/:id/start
router.post("/:id/start", (_req, res) => {res.json({status: "ok"})});

// 🟨 POST - Apagar Microservicio - services/:id/stop
router.post("/:id/stop", (_req, res) => {res.json({status: "ok"})});

// 🟨 POST - Reiniciar Microservicio - services/:id/restart
router.post("/:id/restart", (_req, res) => {res.json({status: "ok"})});

// 🟥 DELETE - Elimina Microservicio - services/:id/delete
router.delete("/:id/delete", (_req, res) => {res.json({status: "ok"})});

// 🟩 GET - Mostrar logs Microservicio - services/:id/logs
router.get("/:id/logs", (_req, res) => {res.json({status: "ok"})});


// Acciones de observabilidad
// 🟩 GET - Tomar la info del daemon de Docker - services/docker/version
router.get("/docker/version", (_req, res) => {res.json({status: "ok"})});

// 🟩 GET - Validar respuesta microservicio por ID - services/:id/health
router.get("/:id/health", (_req, res) => {res.json({status: "ok"})});

// 🟩 GET - Mostrar estadísticas Microservicio - services/:id/stats
router.get("/:id/stats", (_req, res) => {res.json({status: "ok"})});


export const microservicesRoutes = router;