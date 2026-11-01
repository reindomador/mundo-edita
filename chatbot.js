/* ============================================================
   MUNDO EDITA - Chatbot (widget + motor de respuestas)
   Híbrido: intenta responder con la IA del servidor (/api/chat)
   y si no hay API key o no hay conexión, responde localmente
   usando el catálogo de courses.
   ============================================================ */

(function () {
  "use strict";

  const CATALOGO = window.CATALOGO_MUNDO_EDITA;
  if (!CATALOGO) {
    console.warn("chatbot.js: no se encontró catalog.js");
    return;
  }

  const { CURSOS, CONTACTO, INFO_MUNDO_EDITA } = CATALOGO;

  /* ---------------- Utilidades ---------------- */
  /* ---------------- Estado Local (Memoria a corto plazo) ---------------- */
  let temaActual = null; // Guardará el objeto curso si se está hablando de uno

  function normalizar(texto) {
    const r = String(texto == null ? "" : texto)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/v/g, "b")
      .replace(/\s+/g, " ")
      .trim();

    // Filtro de "ruido" (stopwords) para mejorar el matching
    const ruido = ["el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "a", "en", "con", "para", "por", "que", "es", "son", "me", "te", "lo"];
    return r.split(" ").filter(p => !ruido.includes(p)).join(" ");
  }

  function normalizarCompleto(texto) {
    // Versión sin quitar ruido para frases exactas
    return String(texto == null ? "" : texto)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/v/g, "b")
      .replace(/\s+/g, " ")
      .trim();
  }

  function precioBonito(valor) {
    return "$" + valor.toLocaleString("es-CO") + " COP";
  }

  /* Distancia de Levenshtein: sirve para entender palabras mal escritas */
  function distancia(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 2) return 99;

    const fila = [];
    for (let j = 0; j <= b.length; j++) fila[j] = j;

    for (let i = 1; i <= a.length; i++) {
      let diagonal = fila[0];
      fila[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const anterior = fila[j];
        fila[j] = Math.min(
          fila[j] + 1,
          fila[j - 1] + 1,
          diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
        diagonal = anterior;
      }
    }
    return fila[b.length];
  }

  /* Cuántos errores de escritura toleramos según el largo de la palabra */
  function tolerancia(palabra) {
    if (palabra.length <= 4) return 0;
    if (palabra.length <= 7) return 1;
    return 2;
  }

  /* Palabra sin la "h" inicial (hola = ola, haber = aber) */
  function sinH(palabra) {
    return palabra.charAt(0) === "h" ? palabra.slice(1) : palabra;
  }

  /* ¿La palabra del usuario coincide con la clave? (igual, raíz o con typo) */
  function coincidePalabra(palabra, clave) {
    if (!palabra || !clave) return false;
    if (palabra === clave) return true;
    if (palabra.length < 3 || clave.length < 3) return false;
    if (sinH(palabra) === sinH(clave)) return true;
    if (clave.length >= 4 && palabra.startsWith(clave)) return true; // inscrib- -> inscribirme
    const tol = Math.min(tolerancia(clave), tolerancia(palabra));
    return tol > 0 && distancia(palabra, clave) <= tol;
  }

  /* Coincide una clave (palabra o frase) dentro del texto normalizado */
  function coincide(conEspacios, palabras, clave) {
    const k = normalizar(clave);
    if (!k) return false;

    const partes = k.split(" ");
    if (partes.length === 1) return palabras.some((p) => coincidePalabra(p, k));

    // Frase: buscamos la ventana de palabras que se parezca (aguanta typos)
    for (let i = 0; i + partes.length <= palabras.length; i++) {
      let todas = true;
      for (let j = 0; j < partes.length; j++) {
        if (!coincidePalabra(palabras[i + j], partes[j])) {
          todas = false;
          break;
        }
      }
      if (todas) return true;
    }
    return false;
  }

  function puntuar(texto, claves) {
    const palabras = texto ? texto.split(" ") : [];
    const conEspacios = " " + texto + " ";
    let puntos = 0;
    claves.forEach((c) => {
      if (coincide(conEspacios, palabras, c)) puntos += 2;
    });
    return puntos;
  }

  /* ---------------- Motor local ---------------- */
  function buscarCurso(texto) {
    const palabras = texto ? texto.split(" ") : [];
    const conEspacios = " " + texto + " ";
    let mejor = null;
    let mejorPuntaje = 0;

    CURSOS.forEach((curso) => {
      let puntaje = 0;
      const tituloNorm = normalizar(curso.titulo);
      if (tituloNorm && texto.includes(tituloNorm)) puntaje += 5;

      curso.palabrasClave.forEach((p) => {
        if (coincide(conEspacios, palabras, p)) puntaje += 2;
      });

      tituloNorm.split(" ").forEach((palabra) => {
        if (palabra.length > 4 && palabras.some((p) => coincidePalabra(p, palabra))) puntaje += 1;
      });

      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejor = curso;
      }
    });

    return mejorPuntaje >= 2 ? mejor : null;
  }

  function fichaCurso(curso) {
    return (
      `${curso.titulo}\n` +
      `Precio: ${precioBonito(curso.precio)}\n` +
      `Nivel: ${curso.nivel} · ${curso.duracion} · ${curso.clases} clases · ${curso.rating}/5\n\n` +
      `${curso.descripcion}\n\n` +
      `Temas: ${curso.temas.join(", ")}.\n\n` +
      `¿Te interesa? Escríbenos por WhatsApp o ve a la pestaña "Contacto" para inscribirte.`
    );
  }

  function listaCursos() {
    const lineas = CURSOS.map(
      (c) => `• ${c.titulo} — ${precioBonito(c.precio)} (${c.nivel}, ${c.clases} clases)`
    ).join("\n");
    return (
      `Estos son los cursos de ${INFO_MUNDO_EDITA.nombre}:\n\n${lineas}\n\n` +
      `¿Quieres que te cuente los detalles de alguno en especial?`
    );
  }

  /* Afirmaciones sueltas: "ya", "listo", "ok", "ya hice el pago"... */
  const AFIRMACIONES = [
    "ya", "si", "sip", "hecho", "listo", "ok", "okey", "vale", "perfecto", "entendido",
    "simon", "dale", "claro", "obvio", "bueno", "bien", "genial", "excelente", "lo",
  ];
  const AFIRMACIONES_VERBO = [
    "ya lo hice", "ya rellene", "ya mande", "ya envie", "ya termine", "ya pague",
    "hice", "rellene", "mande", "envie", "termine", "pague",
  ];

  function esAfirmacion(texto, palabras) {
    if (palabras.length > 0 && palabras.length <= 3 && palabras.every((p) => AFIRMACIONES.includes(p))) {
      return true;
    }
    return palabras.length <= 5 && puntuar(texto, AFIRMACIONES_VERBO) > 0;
  }

  /* Lista de cursos (solo si no hay una intención más específica) */
  const CLAVES_LISTA = [
    "cursos", "catalogo", "cuales cursos", "que cursos", "que curso hay", "cuantos cursos",
    "que ofrecen", "que tienen", "clases disponibles", "temas", "lista de cursos",
    "todos los cursos", "cuales son", "oferta academica", "que enseñan", "que dictan",
  ];

  /* Intenciones. En caso de empate gana la que esté más arriba en la lista. */
  const INTENCIONES = [
    {
      claves: [
        "quien eres", "que eres", "que eres tu", "tu nombre", "como te llamas",
        "quien es mr rein", "eres mr rein", "quien es mister rein", "que es mr rein",
        "mr rein", "mister rein", "quien te creo", "quien te hizo", "eres humano",
        "eres un robot", "eres una ia", "eres real", "quien es el bot", "que bot eres",
      ],
      responder: () =>
        "¡Qué onda! 😎 Soy Mr. Rein, tu guía personal en Mundo Edita. Estoy aquí para enseñarte fotografía, edición de video y VFX desde cero. ¿Quieres ver qué cursos tenemos?",
    },
    {
      claves: [
        "que haces", "q haces", "k haces", "para que sirves", "que puedes hacer",
        "ayudame", "ayuda", "opciones", "en que me puedes ayudar", "que sabes hacer",
        "que servicios",
      ],
      responder: () =>
        "¡Hago de todo un poco, bro! 🎬 Puedo mostrarte los precios de los cursos, explicarte de qué trata cada uno, decirte cómo inscribirte o pasarte nuestro WhatsApp. ¿Qué te interesa aprender hoy?",
    },
    {
      claves: [
        "cual me recomiendas", "que me recomiendas", "recomiendas", "recomiendan",
        "aconsejas", "no se cual", "cual es mejor", "cual me sirve", "por donde empiezo",
        "con cual empiezo", "que curso me sirve", "recomiendame", "cual hago primero",
        "que me aconsejas", "que curso es mejor",
      ],
      responder: () => {
        const popular = CURSOS.find((c) => c.badge === "Más Popular") || CURSOS[0];
        const pro = CURSOS.find((c) => c.badge === "Pro");
        return (
          `Te cuento, bro. 👇\n\n` +
          `• Si vas empezando: ${popular.titulo} (${precioBonito(popular.precio)}). Es el más popular y arranca desde lo básico.\n` +
          (pro ? `• Si ya editas y quieres subir de nivel: ${pro.titulo} (${precioBonito(pro.precio)}) es el más avanzado.\n` : "") +
          `• Si quieres algo visual: Colorización & Color Grading o Motion Graphics.\n\n¿Cuál va más con lo que quieres hacer?`
        );
      },
    },
    {
      claves: [
        "nequi", "daviplata", "transferencia", "tarjeta", "efectivo", "cuotas",
        "bancolombia", "paypal", "consignacion", "abono", "medios de pago",
        "formas de pago", "como pago", "puedo pagar", "se puede pagar",
      ],
      responder: () =>
        `El pago lo coordinas directo con un asesor, bro. 💳 Escríbenos por WhatsApp (${CONTACTO.whatsapp[0].etiqueta}) o deja tus datos en la pestaña "Contacto" y te pasan los medios de pago y los pasos exactos.`,
    },
    {
      claves: [
        "inscrib", "registr", "matricular", "matricula", "comprar", "pagar", "pago",
        "cupo", "unirme", "participar", "entrar", "anotarme", "empezar", "comenzar",
        "adquirir", "como empiezo", "como hago", "pasos", "proceso", "como entro",
        "quiero entrar", "como estudio",
      ],
      responder: () =>
        "¡Es súper fácil! 🚀\n1. Ve a la pestaña \"Contacto\" y llena el formulario.\n2. O escríbenos directo al WhatsApp que está en la pestaña de \"Contacto\" del chat.\n3. ¡Y listo! Te damos acceso de una. ¿Quieres ver los precios antes?",
    },
    {
      claves: [
        "precio", "precios", "cuanto vale", "cuanto cuesta", "cuanto cuestan",
        "cuanto es", "cuanto sale", "cuanto me sale", "cuanto esta", "cuanto cobran",
        "cuanto dinero", "valor", "costo", "costos", "tarifa", "cuanto debo pagar",
        "cuanto tengo que pagar", "a como",
      ],
      responder: (curso) => {
        if (curso) {
          return `El curso de ${curso.titulo} está en ${precioBonito(curso.precio)}. 🔥 Incluye ${curso.clases} clases y certificado. ¿Te lo anoto?`;
        }
        return (
          `Tenemos cursos desde ${precioBonito(50000)} hasta ${precioBonito(60000)}. 💸\n\n` +
          CURSOS.map((c) => `• ${c.titulo}: ${precioBonito(c.precio)}`).join("\n") +
          `\n\n¿Quieres que te cuente de alguno en especial?`
        );
      },
    },
    {
      claves: [
        "certificado", "certificados", "certificacion", "diploma", "diplomas",
        "titulo", "constancia", "avalado", "aval",
      ],
      responder: () =>
        `¡Claro que sí, bro! 🎓 ${INFO_MUNDO_EDITA.certificado} ¡Para que lo metas al portafolio!`,
    },
    {
      claves: [
        "duracion", "dura", "cuanto dura", "cuantas semanas", "cuantos meses", "meses",
        "cuanto tiempo dura", "que tiempo dura", "cuando termino", "cuando acabo",
      ],
      responder: (curso) => {
        if (curso) {
          return `El curso de ${curso.titulo} dura ${curso.duracion} y tiene ${curso.clases} clases. 📅 Puedes ir a tu ritmo, así que puedes acabarlo antes si le metes ganas.`;
        }
        return `${INFO_MUNDO_EDITA.duracion} 📅 Y como son grabadas, tú decides el ritmo. ¿Quieres ver los cursos?`;
      },
    },
    {
      claves: [
        "horario", "horarios", "a que hora", "clases en vivo", "en vivo", "clases fijas",
        "presencial", "virtual", "online", "a mi ritmo", "cuando son las clases",
        "que dias", "tengo que conectarme",
      ],
      responder: () => `${INFO_MUNDO_EDITA.horario} ⏰`,
    },
    {
      claves: [
        "acceso", "de por vida", "para siempre", "vence", "caduca", "expira",
        "cuanto tiempo tengo", "cuanto tiempo lo puedo ver", "se me borra", "lo pierdo",
      ],
      responder: () => `¡Acceso de por vida, bro! ♾️ ${INFO_MUNDO_EDITA.acceso}`,
    },
    {
      claves: [
        "whatsapp", "whats", "wasap", "contacto", "contactarlos", "telefono", "numero",
        "escribirles", "hablar con alguien", "correo", "email", "instagram", "redes",
        "tiktok", "atencion", "como los contacto", "hablar con un asesor", "hablar con ustedes",
      ],
      responder: () => {
        const lines = CONTACTO.whatsapp.map((w) => `• WhatsApp ${w.etiqueta}: ${w.url}`).join("\n");
        return (
          `¡Claro, bro! 📲 Estos son los canales de Mundo Edita:\n\n${lines}\n` +
          `• Instagram: ${CONTACTO.instagram}\n• TikTok: ${CONTACTO.tiktok}\n\n` +
          `También puedes ir a la pestaña "Contacto" y dejar tus datos.`
        );
      },
    },
    {
      claves: [
        "profesor", "profe", "instructor", "docente", "maestro", "quien enseña",
        "quien dicta", "quien da las clases", "rein domador", "quien es rein",
        "quien es el profe", "quien es el instructor", "cuantas personas enseñan",
      ],
      responder: () =>
        `El profe es ${CONTACTO.instructor}, el que está detrás de Mundo Edita. 🎥 Él dicta las clases y comparte su proceso real de trabajo. Puedes ver su trabajo acá: ${CONTACTO.instagram}`,
    },
    {
      claves: [
        "mundo edita", "que es esto", "de que trata", "plataforma", "la pagina",
        "la web", "empresa", "ustedes", "quienes son", "que es esta pagina",
        "a que se dedican", "de que se trata",
      ],
      responder: () =>
        `${INFO_MUNDO_EDITA.descripcion}\n\nHoy tenemos ${CURSOS.length} cursos: ${CURSOS.map((c) => c.titulo).join(", ")}. ¿Cuál te llama la atención?`,
    },
    {
      claves: [
        "requisitos", "que necesito", "necesito saber", "conocimientos previos",
        "desde cero", "principiante", "no se nada", "experiencia", "edad",
        "computador", "computadora", "pc", "laptop", "celular", "tablet", "camara",
        "programa", "programas", "software", "herramientas", "que debo tener",
        "que equipo",
      ],
      responder: () =>
        "¡Cero requisitos previos, bro! 🙌 Todos los cursos están hechos para arrancar desde cero: solo necesitas un computador (o un celular para empezar), internet y ganas de practicar. Y el software también te lo enseñamos desde lo básico. 💪",
    },
  ];

  /* Cortesías: se revisan de últimas para no tapar una pregunta real */
  const CORTESIA = [
    {
      claves: [
        "hola", "ola", "buenas", "buenos dias", "buenas tardes", "buenas noches",
        "buen dia", "hey", "holi", "saludos", "que onda", "klk", "hablalo", "epa",
        "wassup", "que tal", "q tal", "k tal", "que mas", "q mas",
      ],
      responder: () => {
        const msgs = [
          "¡Qué onda bro! 👋 Aquí Mr. Rein al habla. ¿Listo para volverte un pro en la edición hoy?",
          "¡Klk bro! 👋 ¿En qué te puedo ayudar hoy con los cursos?",
          "¡Hablalo! 👋 Aquí Mr. Rein listo para la acción. ¿Qué curso te llama la atención?",
          "¡Epa! 👋 ¿Cómo va todo? ¿Listo para aprender algo nuevo en Mundo Edita?"
        ];
        return msgs[Math.floor(Math.random() * msgs.length)];
      },
    },
    {
      claves: [
        "como estas", "como te va", "como andas", "todo bien", "que cuenta",
        "que cuentas", "que me cuentas", "que me cuenta", "como va todo",
        "que hay de nuevo", "que dice", "que dices", "todo melo", "todo firme",
      ],
      responder: () => {
        const msgs = [
          "¡Todo firme bro! � Aquí dándole a la edición. ¿Y tú qué cuentas? ¿Listo para un curso?",
          "¡Excelente, bro! 🔥 Con toda la energía para enseñarte algo hoy. ¿Qué te interesa aprender?",
          "¡Al 100%, bro! 🚀 ¿Tú cómo vas? ¿Te animas a ver los precios de los cursos?",
          "¡Todo melo, bro! 🎬 Aquí esperando a ver qué vamos a editar hoy. ¿En qué te ayudo?"
        ];
        return msgs[Math.floor(Math.random() * msgs.length)];
      },
    },
    {
      claves: ["gracias", "muchas gracias", "mil gracias", "te agradezco", "thanks", "thank you"],
      responder: () => {
        const msgs = [
          "¡Con gusto, bro! 💪 Pa' eso estoy.",
          "¡De nada, bro! Dale con toda a ese aprendizaje. 🔥",
          "¡Para eso estamos, bro! Si te animas con algún curso, me avisas. 😉"
        ];
        return msgs[Math.floor(Math.random() * msgs.length)];
      },
    },
    {
      claves: ["adios", "chao", "chau", "bye", "nos vemos", "hasta luego", "hasta pronto", "me voy", "goodbye"],
      responder: () =>
        "¡Nos pillamos, bro! 👋 Cuando quieras seguir aprendiendo, aquí está Mr. Rein. ¡Éxitos con la edición! 🔥",
    },
  ];

  /* Easter egg: calculadora (solo si el mensaje es pura operación) */
  function calcular(textoOriginal) {
    const solo = String(textoOriginal == null ? "" : textoOriginal).toLowerCase().replace(/[^0-9+\-*/(). ]/g, "");
    if (!/[0-9]/.test(solo) || !/[+\-*/]/.test(solo)) return null;
    try {
      const resultado = eval(solo); // eslint-disable-line no-eval
      if (!isFinite(resultado)) return null;
      return `Esa está fácil, bro. El resultado es ${resultado}. 😎 Pero mejor hablemos de edición, ¿no crees?`;
    } catch (e) {
      return null;
    }
  }

  function respuestaLocal(textoOriginal) {
    const t = normalizar(textoOriginal);
    const tc = normalizarCompleto(textoOriginal);
    const palabras = t ? t.split(" ") : [];
    const palabrasCompletas = tc ? tc.split(" ") : [];
    const curso = buscarCurso(t);

    // Si detectamos un curso, lo guardamos en la memoria de corto plazo
    if (curso) temaActual = curso;

    const ultimoBot = [...conversacion].reverse().find(m => m.rol === "bot");
    const contexto = ultimoBot ? normalizarCompleto(ultimoBot.texto) : "";

    // --- 0. NEGACIONES ---
    const negaciones = ["no", "nada", "tampoco", "nunca", "jamas", "ninguno", "no gracias", "pasa", "nop"];
    if (palabrasCompletas.length <= 2 && negaciones.some(n => tc.includes(n))) {
      return "¡Vale, bro! Sin lío. Si cambias de opinión o quieres saber de otra cosa, aquí estoy. 🔥";
    }

    // --- 1. AFIRMACIONES CON CONTEXTO ---
    if (esAfirmacion(tc, palabrasCompletas)) {
      if (contexto.includes("ayudo") || contexto.includes("necesitas") || contexto.includes("cuentas") || contexto.includes("aprender hoy")) {
        return "¡Dime qué tienes en mente, bro! 🎬 ¿Quieres ver los **precios**, el **catálogo** de cursos o prefieres hablar con un **asesor**?";
      }
      if (contexto.includes("precios") || contexto.includes("cuanto cuesta") || contexto.includes("valor") || contexto.includes("cuanto vale")) {
        if (temaActual) return fichaCurso(temaActual);
        return (
          `¡De una, bro! 💸 Aquí te los dejo:\n\n` +
          CURSOS.map((c) => `• ${c.titulo}: ${precioBonito(c.precio)}`).join("\n") +
          `\n\n¿Te cuento de alguno en especial o quieres inscribirte ya?`
        );
      }
      if (contexto.includes("cursos") || contexto.includes("interesa aprender") || contexto.includes("edicion") || contexto.includes("fotografia")) {
        return listaCursos();
      }
      if (contexto.includes("whatsapp") || contexto.includes("asesor") || contexto.includes("contacto")) {
        const lines = CONTACTO.whatsapp.map((w) => `• WhatsApp ${w.etiqueta}: ${w.url}`).join("\n");
        return `¡Dale! 📲 Escríbenos aquí:\n\n${lines}`;
      }
      if (temaActual) return `¡Eso es, bro! 🔥 ¿Quieres que te inscriba ya al curso de ${temaActual.titulo} o tienes alguna otra duda?`;
      return "¡Eso es, bro! 🔥 Si ya dejaste tus datos en el formulario, dime qué curso te interesa para darte los detalles.";
    }

    // --- 2. INTENCIONES PRINCIPALES ---
    let mejor = null;
    let mejorPuntos = 0;
    INTENCIONES.forEach((intencion) => {
      const puntos = puntuar(t, intencion.claves);
      if (puntos > mejorPuntos) {
        mejorPuntos = puntos;
        mejor = intencion;
      }
    });
    if (mejor && mejorPuntos >= 2) return mejor.responder(curso || temaActual, t);

    // --- 3. LISTA DE CURSOS ---
    if (puntuar(t, CLAVES_LISTA) >= 2) return listaCursos();

    // --- 4. CALCULADORA ---
    const calculo = calcular(textoOriginal);
    if (calculo) return calculo;

    // --- 5. DETECTAR CURSO O CONTEXTO DE CURSO ---
    if (curso) return fichaCurso(curso);
    if (temaActual && (puntuar(t, ["cuanto", "precio", "valor", "detalles", "info", "clases", "temas"]) >= 1)) {
      return fichaCurso(temaActual);
    }

    // --- 6. CORTESÍAS (Saludos, gracias, etc.) ---
    let cortesia = null;
    let cortesiaPuntos = 0;
    CORTESIA.forEach((intencion) => {
      const puntos = puntuar(t, intencion.claves);
      if (puntos > cortesiaPuntos) {
        cortesiaPuntos = puntos;
        cortesia = intencion;
      }
    });
    if (cortesia && cortesiaPuntos >= 2) return cortesia.responder(curso || temaActual, t);

    // --- 7. FALLBACK ---
    const respuestasFallback = [
      "No te entendí muy bien, bro. 😅 Pero puedo ayudarte con los cursos, los precios, los certificados o cómo inscribirte. ¿Qué te interesa?",
      "¡Esa me dejó pensando! 🤔 Prueba preguntarme por los cursos, por los precios o por el WhatsApp, que de eso sí sé un montón.",
      "Mr. Rein todavía está aprendiendo, pero te puedo decir que el curso de Fotografía está brutal. ¿Quieres ver el precio?",
      "¡Qué onda! No pesqué esa pregunta. ¿Quieres que hablemos de los cursos o prefieres que te pase el WhatsApp?",
    ];
    return respuestasFallback[Math.floor(Math.random() * respuestasFallback.length)];
  }

  /* ---------------- Estado ---------------- */
  const CLAVE_HISTORIAL = "mundoEditaChat";
  let conversacion = [];
  let modo = "local";
  let enviando = false;

  function guardarHistorial() {
    try {
      localStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(conversacion.slice(-30)));
    } catch (e) {
      /* localStorage puede no estar disponible */
    }
  }

  function cargarHistorial() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_HISTORIAL));
      if (Array.isArray(datos)) {
        conversacion = datos.filter((m) => m && m.texto);
      }
    } catch (e) {
      conversacion = [];
    }
  }

  /* ---------------- Elementos del DOM ---------------- */
  const lanzador = document.getElementById("chat-lanzador");
  const panel = document.getElementById("chat-panel");
  const botonCerrar = document.getElementById("chat-cerrar");
  const botonBorrar = document.getElementById("chat-borrar");
  const contMsgs = document.getElementById("chat-mensajes");
  const contSugerencias = document.getElementById("chat-sugerencias");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const botonEnviar = document.getElementById("chat-enviar");
  const contCursos = document.getElementById("chat-cursos");
  const badgeModo = document.getElementById("chat-modo");

  if (!lanzador || !panel) {
    return;
  }

  /* ---------------- Render ---------------- */
  function agregarMensaje(rol, texto) {
    const div = document.createElement("div");
    div.className = "chat-mensaje " + (rol === "usuario" ? "usuario" : "bot");

    if (rol === "usuario") {
      div.textContent = texto;
      contMsgs.appendChild(div);
      contMsgs.scrollTop = contMsgs.scrollHeight;
    } else {
      // Efecto de escritura para el bot
      div.textContent = "";
      contMsgs.appendChild(div);

      let i = 0;
      const velocidad = 15; // milisegundos por carácter

      function escribir() {
        if (i < texto.length) {
          div.textContent += texto.charAt(i);
          i++;
          contMsgs.scrollTop = contMsgs.scrollHeight;
          setTimeout(escribir, velocidad);
        }
      }
      escribir();
    }

    return div;
  }

  function mostrarEscribiendo() {
    const div = document.createElement("div");
    div.className = "chat-mensaje bot escribiendo";
    div.textContent = "Escribiendo...";
    contMsgs.appendChild(div);
    contMsgs.scrollTop = contMsgs.scrollHeight;
    return div;
  }

  function renderHistorial() {
    contMsgs.innerHTML = "";
    if (conversacion.length === 0) {
      agregarMensaje(
        "bot",
        "¡Hola! 👋 Soy Mr. Rein, tu asistente de Mundo Edita. Puedo contarte sobre los cursos, precios, certificados y cómo inscribirte. ¿Qué necesitas?"
      );
      return;
    }
    conversacion.forEach((m) => agregarMensaje(m.rol, m.texto));
  }

  function borrarHistorial() {
    if (confirm("¿Seguro que quieres borrar toda la conversación con Mr. Rein?")) {
      conversacion = [];
      localStorage.removeItem(CLAVE_HISTORIAL);
      renderHistorial();
    }
  }

  function renderSugerencias() {
    const sugerencias = [
      "¿Qué cursos tienen?",
      "Precios de los cursos",
      "¿Cómo me inscribo?",
      "¿Dan certificado?",
      "Hablar por WhatsApp",
    ];
    contSugerencias.innerHTML = "";
    sugerencias.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chat-chip";
      btn.textContent = s;
      btn.addEventListener("click", () => enviarMensaje(s));
      contSugerencias.appendChild(btn);
    });
  }

  function renderCursos() {
    if (!contCursos) return;
    contCursos.innerHTML = "";
    CURSOS.forEach((curso) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chat-curso-item";

      const nombre = document.createElement("span");
      nombre.className = "chat-curso-nombre";
      nombre.textContent = curso.titulo;

      const meta = document.createElement("span");
      meta.className = "chat-curso-meta";
      meta.textContent = `${precioBonito(curso.precio)} · ${curso.nivel} · ${curso.clases} clases`;

      btn.appendChild(nombre);
      btn.appendChild(meta);
      btn.addEventListener("click", () => {
        cambiarVistaChat("chat");
        enviarMensaje("Cuéntame sobre el curso de " + curso.titulo);
      });
      contCursos.appendChild(btn);
    });
  }

  function renderContacto() {
    const contenedor = document.getElementById("chat-contacto");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    CONTACTO.whatsapp.forEach((w) => {
      const a = document.createElement("a");
      a.className = "chat-opcion whatsapp";
      a.href = w.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "WhatsApp " + w.etiqueta;
      contenedor.appendChild(a);
    });

    const ig = document.createElement("a");
    ig.className = "chat-opcion";
    ig.href = CONTACTO.instagram;
    ig.target = "_blank";
    ig.rel = "noopener";
    ig.textContent = "Instagram @reindomador";
    contenedor.appendChild(ig);

    const registro = document.createElement("button");
    registro.type = "button";
    registro.className = "chat-opcion";
    registro.textContent = "Ir al formulario de registro";
    registro.addEventListener("click", () => {
      cerrarChat();
      if (typeof window.mostrarTabSitio === "function") {
        window.mostrarTabSitio("contacto", true);
      }
      const destino = document.getElementById("registro");
      if (destino) destino.scrollIntoView({ behavior: "smooth" });
    });
    contenedor.appendChild(registro);
  }

  /* ---------------- Lógica híbrida ---------------- */
  async function obtenerRespuesta(texto) {
    const historial = conversacion.slice(-8).map((m) => ({
      role: m.rol === "usuario" ? "user" : "assistant",
      content: m.texto,
    }));

    try {
      const respuesta = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: texto, history: historial }),
      });
      if (respuesta.ok) {
        const datos = await respuesta.json();
        if (datos && datos.source === "ai" && datos.reply) {
          return datos.reply;
        }
      }
    } catch (error) {
      /* sin servidor o sin internet -> usamos el bot local */
    }

    return respuestaLocal(texto);
  }

  function enviarMensaje(texto) {
    const limpio = (texto || "").trim();
    if (!limpio || enviando) return;

    enviando = true;
    if (botonEnviar) botonEnviar.disabled = true;

    conversacion.push({ rol: "usuario", texto: limpio });
    agregarMensaje("usuario", limpio);
    guardarHistorial();

    const indicador = mostrarEscribiendo();

    obtenerRespuesta(limpio).then((respuesta) => {
      indicador.remove();
      conversacion.push({ rol: "bot", texto: respuesta });
      agregarMensaje("bot", respuesta);
      guardarHistorial();
      enviando = false;
      if (botonEnviar) botonEnviar.disabled = false;
    });
  }

  /* ---------------- Pestañas del chat ---------------- */
  function cambiarVistaChat(vista) {
    document.querySelectorAll(".chat-tab").forEach((tab) => {
      tab.classList.toggle("activo", tab.dataset.ctab === vista);
    });
    document.querySelectorAll(".chat-vista").forEach((v) => {
      v.classList.toggle("activo", v.dataset.cvista === vista);
    });
  }

  /* ---------------- Abrir / cerrar ---------------- */
  function abrirChat() {
    panel.classList.remove("oculto");
    lanzador.classList.add("oculto");
    if (input) input.focus();
  }

  function cerrarChat() {
    panel.classList.add("oculto");
    lanzador.classList.remove("oculto");
  }

  /* ---------------- Estado del modo ---------------- */
  function consultarEstado() {
    fetch("/api/chat/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((datos) => {
        if (!datos) {
          if (badgeModo) badgeModo.textContent = "Modo local";
          return;
        }
        modo = datos.modo;
        if (badgeModo) {
          if (datos.modo === "ia") {
            badgeModo.textContent = "IA conectada · " + datos.proveedor;
            badgeModo.classList.add("ia");
          } else {
            badgeModo.textContent = "Modo local (sin API key)";
          }
        }
      })
      .catch(() => {
        if (badgeModo) badgeModo.textContent = "Modo local";
      });
  }

  /* ---------------- Inicialización ---------------- */
  function iniciar() {
    cargarHistorial();
    renderHistorial();
    renderSugerencias();
    renderCursos();
    renderContacto();
    consultarEstado();

    lanzador.addEventListener("click", abrirChat);
    if (botonCerrar) botonCerrar.addEventListener("click", cerrarChat);
    if (botonBorrar) botonBorrar.addEventListener("click", borrarHistorial);

    document.querySelectorAll(".chat-tab").forEach((tab) => {
      tab.addEventListener("click", () => cambiarVistaChat(tab.dataset.ctab));
    });

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const texto = input.value;
        input.value = "";
        enviarMensaje(texto);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
