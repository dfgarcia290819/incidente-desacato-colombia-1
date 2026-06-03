const express = require("express");
const LegalValidator = require("../lib/legal-validator");
const LLMClient = require("../lib/llm-client");

const router = express.Router();
const validator = new LegalValidator();
const llmClient = new LLMClient();

/**
 * POST /api/validar/documento
 * Validar conformidad legal de documento
 */
router.post("/documento", async (req, res) => {
  try {
    const { documento, tipo } = req.body;

    if (!documento) {
      return res.status(400).json({ error: "Se requiere documento" });
    }

    const tipoDocumento = tipo || "tutela";
    const validacion = validator.validarDocumento(documento, tipoDocumento);
    const recomendaciones = validator.obtenerRecomendaciones(validacion);

    res.json({
      exito: true,
      validacion,
      recomendaciones,
      puntuacion: validacion.puntuacion,
      estado: validacion.valido ? "VÁLIDO" : "REQUIERE CORRECCIONES"
    });
  } catch (error) {
    console.error("Error en /validar/documento:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/validar/cita
 * Validar formato de cita jurisprudencial
 */
router.post("/cita", async (req, res) => {
  try {
    const { cita } = req.body;

    if (!cita) {
      return res.status(400).json({ error: "Se requiere cita" });
    }

    const resultado = validator.verificarCita(cita);

    if (resultado.valida) {
      res.json({
        exito: true,
        cita: resultado.cita,
        tribunal: resultado.tribunal,
        mensaje: "Cita válida"
      });
    } else {
      res.status(400).json({
        exito: false,
        error: resultado.error
      });
    }
  } catch (error) {
    console.error("Error en /validar/cita:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/validar/coherencia
 * Validar coherencia jurídica con IA
 */
router.post("/coherencia", async (req, res) => {
  try {
    const { documento } = req.body;

    if (!documento) {
      return res.status(400).json({ error: "Se requiere documento" });
    }

    const analisis = await llmClient.validarCoherenciaJuridica(documento);

    res.json({
      exito: analisis.exito,
      analisis: analisis.contenido || analisis.error,
      tokens_usados: analisis.tokens_usados
    });
  } catch (error) {
    console.error("Error en /validar/coherencia:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/validar/reglas/:tipo
 * Obtener reglas de validación para un tipo de documento
 */
router.get("/reglas/:tipo", (req, res) => {
  try {
    const { tipo } = req.params;
    const tiposValidos = ["tutela", "desacato"];

    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        error: `Tipo inválido. Use: ${tiposValidos.join(", ")}`
      });
    }

    const reglas = {
      tutela: {
        seccionesObligatorias: [
          "accionante",
          "accionado",
          "derechos_vulnerados",
          "hechos",
          "fundamentos_juridicos",
          "petitorio"
        ],
        citacionesMinimas: {
          constitucion: 1,
          jurisprudencia: 1
        }
      },
      desacato: {
        seccionesObligatorias: [
          "accionante",
          "sentencia_incumplida",
          "conducta_incumplida",
          "perjuicio",
          "peticion_sancion"
        ]
      }
    };

    res.json({
      exito: true,
      tipo,
      reglas: reglas[tipo] || {}
    });
  } catch (error) {
    console.error("Error en /validar/reglas:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
