// app.ts

// Import librerias
import "dotenv/config";
import express from "express";


// Import rutas
import { healthRoutes } from "@routes/health.routes"
import { microservicesRoutes } from "@modules/microservices/microservices.routes";
import { errorHandlerMiddleware } from "./middlewares/errorHandler";

// Express
export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended:true }))

// Middlewares

// Inicializar rutas
app.use("/health", healthRoutes)
app.use("/services", microservicesRoutes)

// Error Handler
app.use(errorHandlerMiddleware);


