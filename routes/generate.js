const express = require("express");
const TemplateGenerator = require("../lib/template-generator");
const LLMClient = require("../lib/llm-client");
const LegalValidator = require("../lib/legal-validator");

const router = express.Router();
const templateGen = new TemplateGenerator();
const llmClient = new LLMClient();
const validator = new LegalValidator();

/**
 * POST /api/generar/tutela
 * Generar documento de tutela
 */
router.post("/tutela", async (req, res) => {
  try {
    const { accionante, accionado, derechos, hechos, context } = req.body;

    if (!accionante || !accionado || !derechos) {
      return res.status(400).json({
        error: "Faltan datos requeridos: accionante, accionado, derechos"
      });
    }

    const documento = templateGen.generarTutela({
      demandante: accionante,
      demandado: accionado,
      derechos_invocados: derechos,
      hechos: {
        contexto: hechos || "",
        conducta_lesiva: "Según los hechos narrados",
        conexidad: ""
      }
    });

    if (context) {
      const hechosIA = await llmClient.generarConContexto(
        "hechos",
        { derechos, actor: accionado.entidad, detalles: context },
        context
      );

      if (hechosIA.exito) {
        documento.hechos.conducta_lesiva = hechosIA.contenido;
      }
    }

    const validacion = validator.validarDocumento(documento, "tutela");

    res.json({
      exito: true,
      documento,
      validacion,
      mensaje: validacion.valido
        ? "Documento generado exitosamente"
        : "Documento generado con advertencias"
    });
  } catch (error) {
    console.error("Error en /generar/tutela:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/generar/desacato
 * Generar documento de desacato
 */
router.post("/desacato", async (req, res) => {
  try {\n    const { accionante, sentencia_incumplida, conducta, perjuicio } = req.body;

    if (!accionante || !sentencia_incumplida) {
      return res.status(400).json({
        error: "Faltan datos: accionante, sentencia_incumplida"
      });
    }

    const documento = templateGen.generarDesacato({
      accionante,
      sentencia_incumplida,
      conducta_incumplida: conducta || {},
      perjuicio: perjuicio || {}
    });

    const validacion = validator.validarDocumento(documento, "desacato");

    res.json({
      exito: true,
      documento,
      validacion,
      mensaje: validacion.valido
        ? "Incidente generado exitosamente"
        : "Incidente generado con advertencias"
    });
  } catch (error) {
    console.error("Error en /generar/desacato:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/generar/texto/tutela
 * Generar texto formateado de tutela
 */
router.post("/texto/tutela", async (req, res) => {
  try {
    const { documento } = req.body;

    if (!documento) {
      return res.status(400).json({ error: "Se requiere documento" });
    }

    const texto = templateGen.generarTextoTutela(documento);

    res.json({
      exito: true,
      texto
    });
  } catch (error) {
    console.error("Error en /generar/texto/tutela:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/generar/texto/desacato
 * Generar texto formateado de desacato
 */
router.post("/texto/desacato", async (req, res) => {
  try {
    const { documento } = req.body;

    if (!documento) {
      return res.status(400).json({ error: "Se requiere documento" });
    }

    const texto = templateGen.generarTextoDesacato(documento);

    res.json({
      exito: true,
      texto
    });
  } catch (error) {
    console.error("Error en /generar/texto/desacato:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
