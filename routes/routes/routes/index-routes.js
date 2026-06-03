const express = require("express");
const ChromaDBIndexer = require("../lib/chromadb-indexer");

const router = express.Router();
let indexer = null;

/**
 * Inicializar indexador
 */
async function inicializarIndexador() {
  if (!indexer) {
    indexer = new ChromaDBIndexer();
    await indexer.initialize();
  }
  return indexer;
}

/**
 * POST /api/indexar/pdfs
 * Indexar todos los PDFs disponibles
 */
router.post("/pdfs", async (req, res) => {
  try {
    const idx = await inicializarIndexador();
    const indexados = await idx.indexarPDFs();

    res.json({
      exito: true,
      totalIndexados: indexados.length,
      documentos: indexados,
      estadisticas: idx.obtenerEstadisticas()
    });
  } catch (error) {
    console.error("Error en /indexar/pdfs:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/indexar/buscar
 * Buscar documentos por pregunta
 */
router.get("/buscar", async (req, res) => {
  try {
    const { q, n } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Se requiere parámetro 'q' (pregunta)" });
    }

    const idx = await inicializarIndexador();
    const nResultados = parseInt(n) || 3;
    const resultados = idx.buscarSemantica(q, nResultados);

    res.json({
      exito: true,
      pregunta: q,
      totalResultados: resultados.length,
      resultados
    });
  } catch (error) {
    console.error("Error en /indexar/buscar:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/indexar/referencias
 * Obtener referencias citables
 */
router.get("/referencias", async (req, res) => {
  try {
    const { tipo, esHito } = req.query;
    const idx = await inicializarIndexador();

    const filtro = {};
    if (tipo) filtro.tipo = tipo;
    if (esHito === "true") filtro.esHito = true;

    const referencias = idx.obtenerReferencias(filtro);

    res.json({
      exito: true,
      totalReferencias: referencias.length,
      referencias
    });
  } catch (error) {
    console.error("Error en /indexar/referencias:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/indexar/estadisticas
 * Obtener estadísticas del índice
 */
router.get("/estadisticas", async (req, res) => {
  try {
    const idx = await inicializarIndexador();
    const estadisticas = idx.obtenerEstadisticas();

    res.json({
      exito: true,
      estadisticas
    });
  } catch (error) {
    console.error("Error en /indexar/estadisticas:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/indexar/documento/:id
 * Obtener documento completo por ID
 */
router.get("/documento/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const idx = await inicializarIndexador();
    const documento = idx.obtenerDocumento(id);

    if (!documento) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }

    res.json({
      exito: true,
      documento: {
        id: documento.id,
        archivo: documento.metadata.archivo,
        tipo: documento.metadata.tipo,
        contenido: documento.documento.substring(0, 1000) + "...",
        metadata: documento.metadata
      }
    });
  } catch (error) {
    console.error("Error en /indexar/documento/:id:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
