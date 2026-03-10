import { Router } from "express";

const router = Router();

// Ruta de check
router.get("/", (_req, res) => {res.json({status: "ok"})});

export const healthRoutes = router;