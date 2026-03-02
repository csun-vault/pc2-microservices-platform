// app.ts

// Import librerioas
import express from "express";

// Import rutas

// Express
export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended:true }))

// Middlewares

// Limitar conexiones por tiempo

// Inicializar rutas

// Error Handler



