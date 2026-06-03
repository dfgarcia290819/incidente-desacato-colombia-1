/**
 * Validador de documentos jurídicos
 * Verifica conformidad legal y estructura de documentos
 */
class LegalValidator {
  constructor() {
    this.plantillasValidacion = this.cargarPlantillasValidacion();
  }

  /**
   * Cargar plantillas de validación
   */
  cargarPlantillasValidacion() {
    return {
      tutela: {
        seccionesObligatorias: [
          "demandante",
          "demandado",
          "derechos_invocados",
          "hechos",
          "fundamentos_juridicos",
          "petitorio"
        ],
        camposRequeridos: {
          demandante: ["nombre", "cedula"],
          demandado: ["entidad"],
          hechos: ["contexto", "conducta_lesiva"],
          petitorio: ["texto"]
        },
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
        ],
        camposRequeridos: {
          accionante: ["nombre"],
          sentencia_incumplida: ["numero"],
          conducta_incumplida: ["descripcion"],
          perjuicio: ["daño_causado"]
        }
      }
    };
  }

  /**
   * Validar documento completo
   */
  validarDocumento(documento, tipo = "tutela") {
    const plantilla = this.plantillasValidacion[tipo];
    const errores = [];
    const advertencias = [];
    let puntuacion = 100;

    // Verificar secciones obligatorias
    for (const seccion of plantilla.seccionesObligatorias) {
      if (!documento[seccion]) {
        errores.push(`Falta sección obligatoria: ${seccion}`);
        puntuacion -= 15;
      } else {
        // Verificar campos dentro de cada sección
        if (plantilla.camposRequeridos[seccion]) {
          for (const campo of plantilla.camposRequeridos[seccion]) {
            if (!documento[seccion][campo]) {
              advertencias.push(`Campo vacío en ${seccion}: ${campo}`);
              puntuacion -= 5;
            }
          }
        }
      }
    }

    // Verificar citaciones mínimas para tutela
    if (tipo === "tutela" && plantilla.citacionesMinimas) {
      if (documento.fundamentos_juridicos) {
        const numConstituciones = documento.fundamentos_juridicos.constitucion?.length || 0;
        const numJurisprudencia = documento.fundamentos_juridicos.jurisprudencia?.length || 0;

        if (numConstituciones < plantilla.citacionesMinimas.constitucion) {
          advertencias.push("Se recomienda citar al menos un artículo constitucional");
          puntuacion -= 10;
        }

        if (numJurisprudencia < plantilla.citacionesMinimas.jurisprudencia) {
          advertencias.push("Se recomienda citar jurisprudencia de la Corte Constitucional");
          puntuacion -= 10;
        }
      }
    }

    // Validar longitud de textos
    if (documento.hechos?.contexto && documento.hechos.contexto.length < 50) {
      advertencias.push("La descripción de hechos es muy breve");
      puntuacion -= 5;
    }

    // Asegurar que puntuación no sea negativa
    puntuacion = Math.max(0, puntuacion);

    return {
      valido: errores.length === 0,
      puntuacion,
      errores,
      advertencias,
      totalProblemas: errores.length + advertencias.length
    };
  }

  /**
   * Verificar formato de cita jurisprudencial
   */
  verificarCita(cita) {
    // Formato: T-123/92, SU-456/89, C-789/95, etc.
    const patrones = {
      tutela: /^T-\d{1,3}\/\d{2}$/,
      sentencia_unificada: /^SU-\d{1,3}\/\d{2}$/,
      sentencia_constitucionalidad: /^C-\d{1,3}\/\d{2}$/,
      sentencia_opinion: /^O-\d{1,3}\/\d{2}$/
    };

    for (const [tipo, patron] of Object.entries(patrones)) {
      if (patron.test(cita.toUpperCase())) {
        return {
          valida: true,
          cita: cita.toUpperCase(),
          tribunal: tipo,
          error: null
        };
      }
    }

    return {
      valida: false,
      cita: cita,
      tribunal: null,
      error: "Formato de cita no válido. Use: T-123/92, SU-456/89, C-789/95, O-123/92"
    };
  }

  /**
   * Validar coherencia de derechos
   */
  validarCoherenciaDerechos(derechos) {
    const derechosValidos = [
      "Derecho a la vida",
      "Derecho a la integridad personal",
      "Derecho a la libertad de conciencia",
      "Derecho a la libertad de expresión",
      "Derecho a la igualdad",
      "Derecho a la salud",
      "Derecho a la educación",
      "Derecho al trabajo",
      "Derecho a la vivienda",
      "Derecho a la dignidad",
      "Derecho a la privacy",
      "Derecho a la familia",
      "Derecho a la participación política"
    ];

    const incoherencias = [];

    for (const derecho of derechos) {
      if (!derechosValidos.includes(derecho)) {
        incoherencias.push(`Derecho no reconocido constitucionalmente: ${derecho}`);
      }
    }

    return {
      coherentes: incoherencias.length === 0,
      incoherencias
    };
  }

  /**
   * Obtener recomendaciones basadas en validación
   */
  obtenerRecomendaciones(validacion) {
    const recomendaciones = [];

    if (validacion.errores.length > 0) {
      recomendaciones.push({
        tipo: "ERROR",
        mensaje: "Corrige los errores antes de presentar el documento",
        detalles: validacion.errores
      });
    }

    if (validacion.advertencias.length > 0) {
      recomendaciones.push({
        tipo: "ADVERTENCIA",
        mensaje: "Se recomiendan las siguientes mejoras",
        detalles: validacion.advertencias
      });
    }

    if (validacion.puntuacion === 100) {
      recomendaciones.push({
        tipo: "ÉXITO",
        mensaje: "Documento cumple con todos los requisitos"
      });
    }

    return recomendaciones;
  }

  /**
   * Validar estructura de párrafo jurídico
   */
  validarParrafoJuridico(texto) {
    const problemas = [];
    const minimo_caracteres = 100;
    const maximo_lineas = 15;

    if (texto.length < minimo_caracteres) {
      problemas.push("El párrafo es demasiado corto");
    }

    const numLineas = texto.split('\n').length;
    if (numLineas > maximo_lineas) {
      problemas.push("El párrafo es demasiado largo");
    }

    // Verificar puntuación
    if (!texto.match(/[.!?]$/)) {
      problemas.push("El párrafo debe terminar con puntuación");
    }

    // Verificar mayúsculas al inicio
    if (!texto.match(/^[A-Z]/)) {
      problemas.push("El párrafo debe comenzar con mayúscula");
    }

    return {
      valido: problemas.length === 0,
      problemas
    };
  }

  /**
   * Extraer derechos mencionados en texto
   */
  extraerDerechos(texto) {
    const derechosPatrones = {
      "Derecho a la vida": /vida|sobrevivencia|existencia/gi,
      "Derecho a la salud": /salud|medicina|atención médica|tratamiento/gi,
      "Derecho a la educación": /educación|enseñanza|formación|escuela/gi,
      "Derecho a la vivienda": /vivienda|casa|hogar|alojamiento/gi,
      "Derecho al trabajo": /trabajo|empleo|labor|ocupación/gi,
      "Derecho a la dignidad": /dignidad|honor|respeto|consideración/gi,
      "Derecho a la familia": /familia|padre|madre|hijo|matrimonio/gi,
      "Derecho a la igualdad": /igualdad|discriminación|trato|equidad/gi
    };

    const derechosEncontrados = new Set();

    for (const [derecho, patron] of Object.entries(derechosPatrones)) {
      if (patron.test(texto)) {
        derechosEncontrados.add(derecho);
      }
    }

    return Array.from(derechosEncontrados);
  }

  /**
   * Validar nombres de entidades públicas conocidas
   */
  validarEntidadPublica(nombre) {
    const entidadesValidas = [
      "Ministerio de Salud",
      "Ministerio de Educación",
      "Ministerio del Trabajo",
      "Instituto Colombiano de Bienestar Familiar",
      "ICBF",
      "Policía Nacional",
      "Ejército Nacional",
      "Fiscalía General de la Nación",
      "Defensoría del Pueblo",
      "Procuraduría General de la Nación",
      "Superintendencia de Salud",
      "Secretaría Distrital de Salud",
      "Hospital",
      "Empresa de Servicios Públicos"
    ];

    const encontrada = entidadesValidas.some(entidad =>
      nombre.toUpperCase().includes(entidad.toUpperCase())
    );

    return {
      valida: encontrada,
      recomendacion: encontrada ? "Entidad válida" : "Especifique mejor el nombre de la entidad"
    };
  }
}

module.exports = LegalValidator;
