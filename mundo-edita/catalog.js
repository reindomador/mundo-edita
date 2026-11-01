/* ============================================================
   MUNDO EDITA - Datos compartidos
   Un solo lugar con la información de los cursos y el contacto.
   Lo usan: la web, el bot local y el prompt de la IA (server.js).
   Funciona tanto en el navegador como en Node (server.js).
   ============================================================ */

const CURSOS = [
  {
    id: "fotografia",
    titulo: "Fotografía & Edición de Fotos",
    precio: 55000,
    nivel: "Principiante a Avanzado",
    duracion: "9 meses",
    clases: 48,
    rating: 4.9,
    badge: "Más Popular",
    palabrasClave: ["foto", "fotografia", "camara", "photoshop", "lightroom", "retrato", "retocar", "retoque"],
    descripcion:
      "Aprende a tomar fotos profesionales con cámara o celular y a retocarlas en Photoshop y Lightroom. Incluye presets, raw files y proyecto final.",
    temas: [
      "Manejo de cámara en modo manual",
      "Composición y reglas fotográficas",
      "Iluminación natural y estudio",
      "Retoque de piel y retrato",
      "Lightroom y presets profesionales",
    ],
  },
  {
    id: "vfx",
    titulo: "Efectos Visuales VFX",
    precio: 60000,
    nivel: "Intermedio",
    duracion: "9 meses",
    clases: 40,
    rating: 4.8,
    badge: "Destacado",
    palabrasClave: ["vfx", "efectos", "after effects", "after", "chroma", "green screen", "pantalla verde", "particulas", "explosiones", "tracking"],
    descripcion:
      "Crea efectos impresionantes: explosiones, partículas mágicas, pantallas verdes, transiciones profesionales y animaciones para tus vídeos.",
    temas: [
      "After Effects desde cero a avanzado",
      "Green Screen / Chroma Key profesional",
      "Partículas, explosiones y efectos mágicos",
      "Máscaras, tracking y rotoscopia",
      "Transiciones cinematográficas",
    ],
  },
  {
    id: "color",
    titulo: "Colorización & Color Grading",
    precio: 50000,
    nivel: "Intermedio",
    duracion: "9 meses",
    clases: 32,
    rating: 4.7,
    badge: "Nuevo",
    palabrasClave: ["color", "colorizacion", "grading", "davinci", "resolve", "lut", "luts", "scopes", "paleta"],
    descripcion:
      "Domina el arte del color y transforma tus vídeos con paletas profesionales. Aprende DaVinci Resolve, scopes, LUTs y ambientaciones de cine.",
    temas: [
      "Teoría del color y psicología visual",
      "DaVinci Resolve: nodos y wheels",
      "Waveform, Vectorscope y scopes",
      "Creación de LUTs personalizadas",
      "Looks cinematográficos (Teal & Orange)",
    ],
  },
  {
    id: "motion",
    titulo: "Motion Graphics",
    precio: 55000,
    nivel: "Principiante",
    duracion: "9 meses",
    clases: 36,
    rating: 4.9,
    badge: "En Tendencia",
    palabrasClave: ["motion", "motion graphics", "animacion", "animar", "keyframes", "logos animados", "intro", "textos"],
    descripcion:
      "Crea animaciones de texto, logos y gráficos dinámicos. Aprende After Effects, keyframes, easing y da vida a tus proyectos visuales.",
    temas: [
      "Principios básicos de animación (12 Disney)",
      "Keyframes, gráficos y easing curves",
      "Animación de textos cinemáticos",
      "Logos animados e intros profesionales",
      "Shape layers y expresiones básicas",
    ],
  },
  {
    id: "audio",
    titulo: "Audio Profesional para Vídeo",
    precio: 52000,
    nivel: "Principiante",
    duracion: "9 meses",
    clases: 28,
    rating: 4.8,
    badge: "Premium",
    palabrasClave: ["audio", "sonido", "microfono", "microfonia", "mezcla", "masterizado", "eq", "foley", "ruido"],
    descripcion:
      "Haz que tus vídeos suenen como de cine. Aprende grabación, edición, mezcla y masterizado de audio, eliminación de ruido y diseño sonoro.",
    temas: [
      "Microfonía y técnicas de grabación",
      "Edición y limpieza de audio",
      "EQ, compresión y efectos",
      "Mezcla de voces, música y efectos",
      "Diseño sonoro y Foley para vídeos",
    ],
  },
  {
    id: "edicion",
    titulo: "Edición Avanzada & Workflow",
    precio: 58000,
    nivel: "Avanzado",
    duracion: "9 meses",
    clases: 56,
    rating: 5.0,
    badge: "Pro",
    palabrasClave: ["edicion", "editar", "premiere", "workflow", "multicamara", "proxies", "3d", "avanzada", "montaje", "video", "videos"],
    descripcion:
      "Técnicas avanzadas para editores expertos. Composición, efectos 3D, multicámara, proxies, workflow profesional y proyectos reales.",
    temas: [
      "Edición multicámara y sync de audio",
      "Composición avanzada con capas",
      "Integración 3D en Premiere / AE",
      "Proxies y rendimiento",
      "Proyectos reales: cortometraje y comercial",
    ],
  },
];

const CONTACTO = {
  instructor: "Rein Domador",
  instagram: "https://www.instagram.com/reindomador/",
  tiktok: "https://www.tiktok.com/@rein.domador",
  whatsapp: [
    { etiqueta: "+57 320 3007637", url: "https://wa.me/573203007637" },
    { etiqueta: "+57 321 2204077", url: "https://wa.me/573212204077" },
  ],
};

const INFO_MUNDO_EDITA = {
  nombre: "Mundo Edita",
  descripcion:
    "Mundo Edita es una plataforma de aprendizaje online con cursos y aulas para aprender fotografía, edición de fotos y edición de vídeo desde cero o para mejorar lo que ya sabes.",
  comoRegistrarse:
    "Para inscribirte ve a la pestaña 'Contacto' y llena el formulario con tu nombre y número de teléfono, o escríbenos directo por WhatsApp. Un asesor te contactará para darte los pasos de pago y acceso.",
  certificado: "Sí, todos los cursos entregan certificado digital al completar el 100% de las clases.",
  acceso: "Las clases quedan disponibles online y tienes acceso de por vida una vez te inscribes.",
  duracion: "Todos los cursos tienen una duración de 9 meses, con clases grabadas y ejercicios prácticos.",
  horario:
    "Las clases son online y las ves a tu ritmo, así que no tienes horario fijo. Además hay acompañamiento y feedback del instructor.",
  precios: "Los precios van desde $50.000 COP hasta $60.000 COP según el curso.",
};

/* Texto plano del catálogo para el prompt del sistema (usado en server.js) */
function textoCatalogo() {
  let texto = `CURSOS DISPONIBLES EN MUNDO EDITA:\n`;
  CURSOS.forEach((c) => {
    texto += `\n- ${c.titulo}\n`;
    texto += `  Precio: $${c.precio.toLocaleString("es-CO")} COP\n`;
    texto += `  Nivel: ${c.nivel}\n`;
    texto += `  Duración: ${c.duracion}\n`;
    texto += `  Clases: ${c.clases}\n`;
    texto += `  Calificación: ${c.rating}/5\n`;
    texto += `  Descripción: ${c.descripcion}\n`;
    texto += `  Temas: ${c.temas.join(", ")}\n`;
  });
  return texto;
}

const CATALOGO_MUNDO_EDITA = {
  CURSOS,
  CONTACTO,
  INFO_MUNDO_EDITA,
  textoCatalogo,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = CATALOGO_MUNDO_EDITA;
}
if (typeof window !== "undefined") {
  window.CATALOGO_MUNDO_EDITA = CATALOGO_MUNDO_EDITA;
}
