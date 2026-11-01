const express = require("express");
const path = require("path");
const fs = require("fs");

/* Cargar variables de entorno (.env) si existe.
   Aquí se leen las API keys de IA (OPENAI_API_KEY, GEMINI_API_KEY, etc). */
const rutaEnv = path.join(__dirname, ".env");
if (fs.existsSync(rutaEnv) && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(rutaEnv);
  } catch (error) {
    console.warn("No se pudo cargar el archivo .env:", error.message);
  }
}

const { CONTACTO, INFO_MUNDO_EDITA, textoCatalogo } = require("./catalog.js");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ============================================================
   CHATBOT HÍBRIDO
   - Si hay una API key configurada -> responde la IA.
   - Si no hay key (o falla) -> el navegador usa el bot local.
   ============================================================ */

function detectarProveedor() {
  const env = process.env;
  if (env.OPENAI_API_KEY) {
    return { nombre: "openai", key: env.OPENAI_API_KEY, modelo: env.OPENAI_MODEL || "gpt-4o-mini" };
  }
  if (env.GEMINI_API_KEY || env.GOOGLE_API_KEY) {
    return { nombre: "gemini", key: env.GEMINI_API_KEY || env.GOOGLE_API_KEY, modelo: env.GEMINI_MODEL || "gemini-2.0-flash" };
  }
  if (env.OPENROUTER_API_KEY) {
    return { nombre: "openrouter", key: env.OPENROUTER_API_KEY, modelo: env.OPENROUTER_MODEL || "openai/gpt-4o-mini" };
  }
  if (env.ANTHROPIC_API_KEY) {
    return { nombre: "anthropic", key: env.ANTHROPIC_API_KEY, modelo: env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest" };
  }
  return null;
}

const PROMPT_SISTEMA =
  `Eres el asistente virtual de "${INFO_MUNDO_EDITA.nombre}", una plataforma de cursos online de fotografía y edición. ` +
  `Atiendes a estudiantes y visitantes de la página web.\n\n` +
  `INSTRUCCIONES:\n` +
  `- Responde SIEMPRE en español, de forma cercana, breve y clara (máximo 4-6 líneas).\n` +
  `- Ayuda a elegir cursos, explica precios, nivel, duración, qué incluye y cómo inscribirse.\n` +
  `- Guía al usuario a la pestaña "Contacto" o al WhatsApp para inscribirse y pagar.\n` +
  `- Si preguntan algo que no tiene que ver con Mundo Edita, redirige amablemente a los cursos.\n` +
  `- No inventes cursos, precios ni datos que no estén en la información de abajo.\n\n` +
  `INFORMACIÓN OFICIAL:\n` +
  `Descripción: ${INFO_MUNDO_EDITA.descripcion}\n` +
  `Registro: ${INFO_MUNDO_EDITA.comoRegistrarse}\n` +
  `Certificado: ${INFO_MUNDO_EDITA.certificado}\n` +
  `Acceso: ${INFO_MUNDO_EDITA.acceso}\n` +
  `Duración: ${INFO_MUNDO_EDITA.duracion}\n` +
  `Horarios: ${INFO_MUNDO_EDITA.horario}\n` +
  `Instructor: ${CONTACTO.instructor}\n` +
  `WhatsApp: ${CONTACTO.whatsapp.map((w) => w.etiqueta).join(" / ")}\n` +
  `Instagram: ${CONTACTO.instagram}\n\n` +
  textoCatalogo();

function limpiarHistorial(historial) {
  if (!Array.isArray(historial)) return [];
  return historial
    .filter((m) => m && typeof m.content === "string" && m.content.trim() !== "")
    .slice(-8)
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content.slice(0, 1500) }));
}

async function llamarOpenAI(prov, mensaje, historial) {
  const respuesta = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${prov.key}` },
    body: JSON.stringify({
      model: prov.model,
      temperature: 0.4,
      messages: [{ role: "system", content: PROMPT_SISTEMA }, ...historial, { role: "user", content: mensaje }],
    }),
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error((datos.error && datos.error.message) || "Error de OpenAI");
  return datos.choices[0].message.content.trim();
}

async function llamarOpenRouter(prov, mensaje, historial) {
  const respuesta = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${prov.key}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Mundo Edita",
    },
    body: JSON.stringify({
      model: prov.model,
      temperature: 0.4,
      messages: [{ role: "system", content: PROMPT_SISTEMA }, ...historial, { role: "user", content: mensaje }],
    }),
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error((datos.error && datos.error.message) || "Error de OpenRouter");
  return datos.choices[0].message.content.trim();
}

async function llamarGemini(prov, mensaje, historial) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${prov.modelo}:generateContent?key=${prov.key}`;
  const contents = historial.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  contents.push({ role: "user", parts: [{ text: mensaje }] });

  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: PROMPT_SISTEMA }] },
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
    }),
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error((datos.error && datos.error.message) || "Error de Gemini");
  const texto = datos.candidates && datos.candidates[0] && datos.candidates[0].content &&
    datos.candidates[0].content.parts.map((p) => p.text).join("");
  if (!texto) throw new Error("Gemini no devolvió respuesta");
  return texto.trim();
}

async function llamarAnthropic(prov, mensaje, historial) {
  const respuesta = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": prov.key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: prov.modelo,
      max_tokens: 600,
      system: PROMPT_SISTEMA,
      messages: [...historial, { role: "user", content: mensaje }],
    }),
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error((datos.error && datos.error.message) || "Error de Anthropic");
  return datos.content[0].text.trim();
}

async function llamarIA(prov, mensaje, historial) {
  switch (prov.nombre) {
    case "openai":
      return llamarOpenAI(prov, mensaje, historial);
    case "openrouter":
      return llamarOpenRouter(prov, mensaje, historial);
    case "gemini":
      return llamarGemini(prov, mensaje, historial);
    case "anthropic":
      return llamarAnthropic(prov, mensaje, historial);
    default:
      throw new Error("Proveedor de IA no soportado");
  }
}

/* Estado del bot: el navegador lo consulta al cargar */
app.get("/api/chat/status", (req, res) => {
  const prov = detectarProveedor();
  res.json({ modo: prov ? "ia" : "local", proveedor: prov ? prov.nombre : null });
});

app.post("/api/chat", async (req, res) => {
  const mensaje = ((req.body && req.body.message) || "").toString().slice(0, 2000).trim();
  if (!mensaje) {
    return res.status(400).json({ error: "Mensaje vacío" });
  }

  const prov = detectarProveedor();
  if (!prov) {
    return res.json({ source: "local", reply: null, motivo: "sin_api_key" });
  }

  try {
    const historial = limpiarHistorial(req.body && req.body.history);
    const reply = await llamarIA(prov, mensaje, historial);
    return res.json({ source: "ai", provider: prov.nombre, reply });
  } catch (error) {
    console.error("Error al consultar la IA:", error.message);
    return res.json({ source: "local", reply: null, error: error.message });
  }
});

app.listen(3000, () => {
  const prov = detectarProveedor();
  console.log("MUNDO EDITA - SERVIDOR ACTUALIZADO");
  console.log(prov ? `Chatbot IA activo con: ${prov.nombre}` : "Chatbot en modo LOCAL (sin API key configurada)");
});
