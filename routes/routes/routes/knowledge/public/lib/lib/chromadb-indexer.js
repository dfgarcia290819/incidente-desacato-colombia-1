const fs = require("fs");
const path = require("path");

/**
 * Indexador ChromaDB para búsqueda semántica
 * Gestiona documentos jurídicos y búsquedas
 */
class ChromaDBIndexer {
  constructor() {
    this.documentos = [];
    this.indices = new Map();
    this.metadata = new Map();
    this.estadisticas = {
      totalDocumentos: 0,
      totalBusquedas: 0,
      documentosIndexados: 0
    };
  }

  /**
   * Inicializar indexador
   */
  async initialize() {
    console.log("Inicializando ChromaDB Indexer...");
    await this.cargarDocumentos();
    return true;
  }

  /**
   * Cargar documentos disponibles
   */
  async cargarDocumentos() {
    try {
      const knowledgePath = path.join(__dirname, "../knowledge");
      
      if (fs.existsSync(knowledgePath)) {
        const archivos = fs.readdirSync(knowledgePath);
        
        for (const archivo of archivos) {
          if (archivo.endsWith(".json")) {
            const contenido = fs.readFileSync(
              path.join(knowledgePath, archivo),
              "utf-8"
            );
            const datos = JSON.parse(contenido);
            this.agregarDocumento(archivo, datos);
          }
        }
      }

      this.estadisticas.totalDocumentos = this.documentos.length;
      console.log(`Se cargaron ${this.documentos.length} documentos`);
    } catch (error) {
      console.error("Error cargando documentos:", error.message);
    }
  }

  /**
   * Agregar documento al índice
   */
  agregarDocumento(archivo, contenido) {
    const id = `doc_${this.documentos.length}`;
    
    const documento = {
      id,
      archivo,
      documento: JSON.stringify(contenido),
      metadata: {
        archivo,
        tipo: this.extraerTipo(archivo),
        fecha_indexacion: new Date().toISOString(),
        tamaño: JSON.stringify(contenido).length
      }
    };

    this.documentos.push(documento);
    this.indices.set(id, documento);
    this.metadata.set(id, documento.metadata);
    this.estadisticas.documentosIndexados++;
  }

  /**
   * Extraer tipo de documento
   */
  extraerTipo(archivo) {
    if (archivo.includes("jurisprudencia")) return "jurisprudencia";
    if (archivo.includes("sentencia")) return "sentencia";
    if (archivo.includes("normativa")) return "normativa";
    return "documento";
  }

  /**
   * Buscar documentos por semántica
   */
  buscarSemantica(pregunta, nResultados = 3) {
    this.estadisticas.totalBusquedas++;
    
    const palabrasClave = this.extraerPalabrasClave(pregunta);
    const resultados = [];

    for (const [id, documento] of this.indices) {
      const contenido = documento.documento.toLowerCase();
      let puntuacion = 0;

      // Calcular relevancia basada en palabras clave
      for (const palabra of palabrasClave) {
        const ocurrencias = (contenido.match(new RegExp(palabra, "g")) || []).length;
        puntuacion += ocurrencias * 10;
      }

      if (puntuacion > 0) {
        resultados.push({
          id,
          titulo: `${documento.metadata.tipo}: ${documento.metadata.archivo}`,
          puntuacion,
          metadata: documento.metadata,
          resumen: this.extraerResumen(contenido, palabrasClave)
        });
      }
    }

    // Ordenar por puntuación descendente
    resultados.sort((a, b) => b.puntuacion - a.puntuacion);

    return resultados.slice(0, nResultados);
  }

  /**
   * Extraer palabras clave de pregunta
   */
  extraerPalabrasClave(pregunta) {
    const stopwords = [
      "el", "la", "de", "que", "y", "a", "en", "se", "es", "por", "con",
      "para", "una", "como", "del", "fue", "son", "más", "un", "o", "los"
    ];

    return pregunta
      .toLowerCase()
      .split(/\s+/)
      .filter(palabra => palabra.length > 3 && !stopwords.includes(palabra));
  }

  /**
   * Extraer resumen de contenido
   */
  extraerResumen(contenido, palabrasClave) {
    const maxCaracteres = 200;
    
    for (const palabra of palabrasClave) {
      const indice = contenido.indexOf(palabra);
      if (indice !== -1) {
        const inicio = Math.max(0, indice - 50);
        const fin = Math.min(contenido.length, indice + 150);
        const resumen = contenido.substring(inicio, fin);
        return `...${resumen}...`;
      }
    }

    return contenido.substring(0, maxCaracteres) + "...";
  }

  /**
   * Obtener referencias citables
   */
  obtenerReferencias(filtro = {}) {
    const referencias = [];

    for (const documento of this.documentos) {
      if (filtro.tipo && documento.metadata.tipo !== filtro.tipo) {
        continue;
      }

      // Para jurisprudencia, extraer sentencias
      try {
        const contenido = JSON.parse(documento.documento);
        
        if (contenido.sentencias_hito) {
          for (const sentencia of contenido.sentencias_hito) {
            referencias.push({
              id: `${documento.id}_${sentencia.numero}`,
              numero: sentencia.numero,
              fecha: sentencia.fecha,
              tema: sentencia.tema,
              tipo: "sentencia_hito",
              esHito: true
            });
          }
        }

        if (contenido.articulos_cp_aplicables) {
          for (const [clave, articulo] of Object.entries(contenido.articulos_cp_aplicables)) {
            referencias.push({
              id: `${documento.id}_art_${articulo.numero}`,
              numero: articulo.numero,
              tema: "Artículo Constitucional",
              tipo: "articulo_constitucional",
              esHito: false
            });
          }
        }
      } catch (e) {
        // Documento no es JSON, ignorar
      }
    }

    return referencias;
  }

  /**
   * Obtener documento completo por ID
   */
  obtenerDocumento(id) {
    return this.indices.get(id) || null;
  }

  /**
   * Obtener estadísticas del índice
   */
  obtenerEstadisticas() {
    return {
      ...this.estadisticas,
      documentos: this.documentos.map(doc => ({
        id: doc.id,
        archivo: doc.metadata.archivo,
        tipo: doc.metadata.tipo,
        fecha: doc.metadata.fecha_indexacion
      }))
    };
  }

  /**
   * Indexar archivos PDF (simulado)
   */
  async indexarPDFs() {
    const pdfPath = path.join(__dirname, "../pdfs");
    const indexados = [];

    try {
      if (!fs.existsSync(pdfPath)) {
        fs.mkdirSync(pdfPath, { recursive: true });
        return indexados;
      }

      const archivos = fs.readdirSync(pdfPath);
      
      for (const archivo of archivos) {
        if (archivo.endsWith(".pdf")) {
          indexados.push({
            archivo,
            estado: "indexado",
            fecha: new Date().toISOString()
          });
        }
      }

      return indexados;
    } catch (error) {
      console.error("Error indexando PDFs:", error.message);
      return [];
    }
  }

  /**
   * Buscar por criterios específicos
   */
  buscarPorCriterio(criterio) {
    const resultados = [];

    for (const documento of this.documentos) {
      const contenido = documento.documento.toLowerCase();
      
      if (contenido.includes(criterio.toLowerCase())) {
        resultados.push({
          id: documento.id,
          archivo: documento.metadata.archivo,
          coincidencias: (contenido.match(new RegExp(criterio, "gi")) || []).length
        });
      }
    }

    return resultados.sort((a, b) => b.coincidencias - a.coincidencias);
  }

  /**
   * Obtener jurisprudencia relevante
   */
  obtenerJurisprudencia(tema) {
    const resultados = [];

    for (const documento of this.documentos) {
      if (documento.metadata.tipo === "jurisprudencia") {
        try {
          const contenido = JSON.parse(documento.documento);
          
          if (contenido.sentencias_hito) {
            for (const sentencia of contenido.sentencias_hito) {
              if (sentencia.tema.toLowerCase().includes(tema.toLowerCase())) {
                resultados.push(sentencia);
              }
            }
          }
        } catch (e) {
          // Ignorar error
        }
      }
    }

    return resultados;
  }
}

module.exports = ChromaDBIndexer;
