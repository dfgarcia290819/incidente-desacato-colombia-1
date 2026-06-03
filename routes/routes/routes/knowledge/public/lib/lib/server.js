const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Importar rutas
const generateRoutes = require("./routes/generate");
const validateRoutes = require("./routes/validate");
const indexRoutes = require("./routes/index-routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Rutas API
app.use("/api/generar", generateRoutes);
app.use("/api/validar", validateRoutes);
app.use("/api/indexar", indexRoutes);

// Ruta raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Ruta de salud
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Rutas API documentadas
app.get("/api", (req, res) => {
  res.json({
    mensaje: "Asistente Jurídico Colombiano API",
    version: "1.0.0",
    endpoints: {
      generación: {
        "POST /api/generar/tutela": "Generar documento de tutela",
        "POST /api/generar/desacato": "Generar documento de desacato",
        "POST /api/generar/texto/tutela": "Generar texto formateado de tutela",
        "POST /api/generar/texto/desacato": "Generar texto formateado de desacato"
      },
      validación: {
        "POST /api/validar/documento": "Validar documento jurídico",
        "POST /api/validar/cita": "Validar cita jurisprudencial",
        "POST /api/validar/coherencia": "Validar coherencia jurídica con IA",
        "GET /api/validar/reglas/:tipo": "Obtener reglas de validación"
      },
      indexación: {
        "POST /api/indexar/pdfs": "Indexar PDFs disponibles",
        "GET /api/indexar/buscar": "Buscar documentos",
        "GET /api/indexar/referencias": "Obtener referencias citables",
        "GET /api/indexar/estadisticas": "Obtener estadísticas",
        "GET /api/indexar/documento/:id": "Obtener documento por ID"
      }
    }
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.path,
    method: req.method
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    mensaje: err.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     ⚖️  Asistente Jurídico Colombiano - API Iniciada       ║
╠════════════════════════════════════════════════════════════╣
║  🚀 Servidor corriendo en: http://localhost:${PORT}        ║
║  📚 Documentación: http://localhost:${PORT}/api             ║
║  🌐 Interfaz Web: http://localhost:${PORT}/                ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
