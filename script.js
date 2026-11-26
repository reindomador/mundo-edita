const supabaseClient = window.supabase?.createClient(
    "https://covhskrfzbxvqeansydu.supabase.co",
    "sb_publishable_NfugEcJyrHuhReHg2q7ETw__k4RXHMy"
) || null;

document.addEventListener("DOMContentLoaded", function () {
    iniciarTabs();
    iniciarCursos();
    iniciarRegistro();
    iniciarEstudiantes();
    iniciarDirectorioPerfiles();
    iniciarAnuncios();
    iniciarAnimaciones();
    iniciarPerfil();
    iniciarInscripciones();
});


// 1. PESTAÑAS DEL SITIO (Inicio / Cursos / Contacto)
function mostrarTabSitio(nombre, sinScroll) {
    document.querySelectorAll(".tab-panel").forEach(function (panel) {
        panel.classList.toggle("activo", panel.dataset.panel === nombre);
    });

    document.querySelectorAll(".nav-links .tab-btn").forEach(function (boton) {
        boton.classList.toggle("activo", boton.dataset.tab === nombre);
    });

    if (!sinScroll) {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

// Se expone para que el chatbot pueda cambiar de pestaña
window.mostrarTabSitio = mostrarTabSitio;

function iniciarTabs() {
    document.querySelectorAll("[data-tab]").forEach(function (elemento) {
        elemento.addEventListener("click", function () {
            mostrarTabSitio(elemento.dataset.tab, !!elemento.dataset.scroll);

            if (elemento.dataset.curso) {
                const selectorCurso = document.getElementById("inscripcion-curso");
                if (selectorCurso) selectorCurso.value = elemento.dataset.curso;
            }

            if (elemento.dataset.scroll) {
                const destino = document.getElementById(elemento.dataset.scroll);
                if (destino) {
                    setTimeout(function () {
                        destino.scrollIntoView({ behavior: "smooth" });
                    }, 50);
                }
            }
        });
    });
}


// 2. CURSOS (los botones "Inscribirse" llevan a Contacto)
function iniciarCursos() {
    document.querySelectorAll(".card-btn").forEach(function (boton) {
        boton.addEventListener("click", function () {
            const tarjeta = boton.closest(".card");
            const titulo = tarjeta.querySelector(".card-title").textContent;
            abrirSolicitudInscripcion(titulo);
        });
    });
}

function abrirSolicitudInscripcion(curso) {
    const selectorCurso = document.getElementById("inscripcion-curso");
    if (selectorCurso) selectorCurso.value = curso;
    mostrarTabSitio("perfil", true);

    const destino = document.getElementById("solicitud-inscripcion");
    if (destino) {
        setTimeout(function () {
            destino.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    }
}


// 3. FORMULARIO DE REGISTRO CON VALIDACIONES
function iniciarRegistro() {
    const formulario = document.getElementById("registrationForm");
    if (!formulario) return;

    const nombreInput = document.getElementById("name");
    const correoInput = document.getElementById("email");
    const telefonoInput = document.getElementById("phone");
    const mensaje = document.getElementById("message");

    formulario.addEventListener("submit", async function (e) {
        e.preventDefault();

        const nombreIngresado = nombreInput.value.trim();
        const correoIngresado = correoInput.value.trim();
        const telefonoIngresado = telefonoInput.value.trim();
        const cursoIngresado = document.getElementById("course")?.value || "Fotografía & Edición de Fotos";
        const numeros = telefonoIngresado.replace(/\D/g, "");

        if (nombreIngresado === "") {
            mensaje.textContent = "Por favor, escribe tu nombre.";
            mensaje.style.color = "#ff4d4d";
            nombreInput.focus();
            return;
        }

        if (!/^[a-záéíóúüñ\s'-]+$/i.test(nombreIngresado)) {
            mensaje.textContent = "Escribe un nombre válido.";
            mensaje.style.color = "#ff4d4d";
            nombreInput.focus();
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoIngresado)) {
            mensaje.textContent = "Escribe un correo electrónico válido.";
            mensaje.style.color = "#ff4d4d";
            correoInput.focus();
            return;
        }

        if (!/^[0-9+\s()-]+$/.test(telefonoIngresado) ||
            numeros.length < 7 || numeros.length > 15) {
            mensaje.textContent = "Escribe un número de teléfono válido.";
            mensaje.style.color = "#ff4d4d";
            telefonoInput.focus();
            return;
        }

        if (!supabaseClient) {
            mensaje.textContent = "No se pudo conectar con el servicio. Recarga la página e inténtalo de nuevo.";
            mensaje.style.color = "#ef8fb9";
            return;
        }

        const botonEnviar = formulario.querySelector('button[type="submit"]');
        botonEnviar.disabled = true;
        botonEnviar.textContent = "Enviando...";
        mensaje.className = "";
        mensaje.textContent = "Guardando tus datos...";
        mensaje.style.color = "var(--color-primario)";

        try {
            const { error } = await supabaseClient
                .from("leads")
                .insert([{
                    nombre: nombreIngresado,
                    correo: correoIngresado,
                    telefono: telefonoIngresado,
                    curso: cursoIngresado
                }]);

            if (error) throw error;

            mensaje.className = "success-message";
            mensaje.textContent = `¡Gracias, ${nombreIngresado}! Tus datos se guardaron correctamente. Nos pondremos en contacto contigo.`;
            mensaje.style.color = "";
            formulario.reset();
        } catch (error) {
            console.error("Error al guardar el registro en Supabase:", error);
            const detalleError = (error?.message || "").toLowerCase();

            if (error?.code === "PGRST204" || (detalleError.includes("column") && detalleError.includes("schema cache"))) {
                mensaje.textContent = "Falta la columna correo en Supabase. En SQL Editor ejecuta: ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS correo TEXT;";
            } else if (error?.code === "42501" || detalleError.includes("row-level security")) {
                mensaje.textContent = "Supabase bloqueó el registro. Hay que revisar la política RLS de inserción en la tabla leads.";
            } else {
                mensaje.textContent = "No pudimos guardar tus datos. Revisa en Supabase que exista la tabla public.leads y que permita inserciones.";
            }
            mensaje.style.color = "#ef8fb9";
        } finally {
            botonEnviar.disabled = false;
            botonEnviar.textContent = "Registrarse";
        }
    });
}


// 4. ESTUDIANTES (Lista fija)
function iniciarEstudiantes() {
    const tabla = document.querySelector("table tbody");
    if (!tabla) return;

    // Lista completa de estudiantes
    const estudiantes = [
        { nombre: "Rein", edad: 25, genero: "Masculino", progreso: 95 },
        { nombre: "Subaru", edad: 18, genero: "Masculino", progreso: 80 },
        { nombre: "Clain", edad: 28, genero: "Masculino", progreso: 89 },
        { nombre: "Lloyd", edad: 26, genero: "Masculino", progreso: 85 },
        { nombre: "Rem", edad: 19, genero: "Femenino", progreso: 92 },
        { nombre: "Emilia", edad: 20, genero: "Femenino", progreso: 88 }
    ];

    function mostrarEstudiantes() {
        tabla.innerHTML = "";
        estudiantes.forEach(function (estudiante) {
            const fila = document.createElement("tr");
            [estudiante.nombre, estudiante.edad, estudiante.genero, estudiante.progreso + "%"]
                .forEach(function (dato) {
                    const celda = document.createElement("td");
                    celda.textContent = dato;
                    fila.appendChild(celda);
                });
            tabla.appendChild(fila);
        });
    }

    mostrarEstudiantes();
}

function iniciarDirectorioPerfiles() {
    const grid = document.getElementById("directorio-perfiles");
    const vacio = document.getElementById("directorio-vacio");
    const estado = document.getElementById("directorio-estado");
    const busqueda = document.getElementById("buscar-perfiles");
    const botonRecargar = document.getElementById("directorio-recargar");
    const botonPestana = document.querySelector('.nav-links [data-tab="estudiantes"]');
    if (!grid || !vacio || !estado || !busqueda || !botonRecargar || !botonPestana) return;

    let perfilesPublicos = [];
    let cargado = false;
    let cargando = false;

    function normalizar(texto) {
        return (texto || "")
            .toLocaleLowerCase("es")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function crearTarjeta(perfil) {
        const nombre = (perfil.nombre_mostrar || perfil.nombre_google || "Estudiante").trim();
        const iniciales = nombre.split(/\s+/).slice(0, 2).map(function (parte) {
            return parte.charAt(0);
        }).join("").toUpperCase();

        const tarjeta = document.createElement("article");
        tarjeta.className = "directorio-tarjeta";

        const cabecera = document.createElement("div");
        cabecera.className = "directorio-tarjeta-cabecera";

        const avatar = document.createElement("div");
        avatar.className = "directorio-avatar";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = iniciales || "ME";

        if (typeof perfil.foto_url === "string" && perfil.foto_url.startsWith("https://")) {
            const foto = document.createElement("img");
            foto.src = perfil.foto_url;
            foto.alt = "";
            foto.loading = "lazy";
            foto.addEventListener("error", function () {
                foto.remove();
            });
            avatar.appendChild(foto);
        }

        const identidad = document.createElement("div");
        identidad.className = "directorio-identidad";

        const etiqueta = document.createElement("span");
        etiqueta.className = "directorio-etiqueta";
        etiqueta.textContent = "Estudiante";

        const titulo = document.createElement("h2");
        titulo.textContent = nombre;

        identidad.append(etiqueta, titulo);
        cabecera.append(avatar, identidad);

        const bio = document.createElement("p");
        bio.className = "directorio-bio";
        bio.textContent = (perfil.bio || "").trim() || "Este estudiante aún no agregó una descripción.";

        tarjeta.append(cabecera, bio);
        return tarjeta;
    }

    function mostrarResultados() {
        const termino = normalizar(busqueda.value.trim());
        const resultados = perfilesPublicos.filter(function (perfil) {
            const contenido = normalizar(
                (perfil.nombre_mostrar || "") + " " +
                (perfil.nombre_google || "") + " " +
                (perfil.bio || "")
            );
            return contenido.includes(termino);
        });

        grid.replaceChildren();

        if (perfilesPublicos.length === 0) {
            estado.textContent = "Directorio de estudiantes";
            vacio.textContent = "Aún no hay perfiles públicos. Cuando alguien decida compartir el suyo, aparecerá aquí.";
            vacio.hidden = false;
            return;
        }

        estado.textContent = resultados.length === 1
            ? "1 perfil público"
            : resultados.length + " perfiles públicos";

        if (resultados.length === 0) {
            vacio.textContent = "No encontramos perfiles con ese nombre o interés. Prueba otra búsqueda.";
            vacio.hidden = false;
            return;
        }

        vacio.hidden = true;
        resultados.forEach(function (perfil) {
            grid.appendChild(crearTarjeta(perfil));
        });
    }

    async function cargarPerfiles() {
        if (cargando) return;
        if (!supabaseClient) {
            estado.textContent = "El directorio no está disponible ahora mismo.";
            vacio.textContent = "No se pudo conectar con el servicio. Recarga la página para intentarlo de nuevo.";
            vacio.hidden = false;
            return;
        }

        cargando = true;
        botonRecargar.disabled = true;
        estado.textContent = "Buscando perfiles públicos...";
        vacio.hidden = true;

        try {
            const { data, error } = await supabaseClient
                .from("perfiles")
                .select("nombre_mostrar,nombre_google,bio,foto_url")
                .eq("es_publico", true)
                .order("nombre_mostrar", { ascending: true })
                .limit(100);

            if (error) throw error;

            perfilesPublicos = data || [];
            cargado = true;
            mostrarResultados();
        } catch (error) {
            console.error("No se pudieron cargar los perfiles públicos:", error);
            estado.textContent = "No se pudo cargar el directorio.";
            vacio.textContent = "Revisa tu conexión y pulsa Actualizar para volver a intentarlo.";
            vacio.hidden = false;
            cargado = false;
        } finally {
            cargando = false;
            botonRecargar.disabled = false;
        }
    }

    botonPestana.addEventListener("click", function () {
        if (!cargado) cargarPerfiles();
    });
    botonRecargar.addEventListener("click", cargarPerfiles);
    busqueda.addEventListener("input", mostrarResultados);
}


// 5. SOLICITUDES DE INSCRIPCION Y REVISION ADMINISTRATIVA
function iniciarInscripciones() {
    const formulario = document.getElementById("inscripcion-form");
    const selectorCurso = document.getElementById("inscripcion-curso");
    const listaPropia = document.getElementById("mis-inscripciones-lista");
    const mensaje = document.getElementById("inscripciones-mensaje");
    const avisoLogin = document.getElementById("inscripciones-login");
    const panelAdmin = document.getElementById("admin-inscripciones");
    const listaAdmin = document.getElementById("admin-inscripciones-lista");
    if (!formulario || !selectorCurso || !listaPropia || !mensaje || !avisoLogin || !panelAdmin || !listaAdmin) return;

    const ADMIN_EMAIL = "caperarojasnicolassantiago@gmail.com";
    let usuarioActual = null;
    let cargando = false;

    function mostrarMensaje(texto, tipo) {
        mensaje.textContent = texto || "";
        mensaje.className = tipo || "";
    }

    function vacio(contenedor, texto) {
        const aviso = document.createElement("p");
        aviso.className = "inscripciones-vacio";
        aviso.textContent = texto;
        contenedor.replaceChildren(aviso);
    }

    function crearTarjeta(inscripcion, perfil, admin) {
        const nombres = perfil?.nombre_mostrar || perfil?.nombre_google || "Estudiante";
        const tarjeta = document.createElement("article");
        tarjeta.className = "inscripcion-tarjeta";

        const contenido = document.createElement("div");
        contenido.className = "inscripcion-datos";
        const curso = document.createElement("h5");
        curso.textContent = inscripcion.curso;
        const detalle = document.createElement("p");
        const fecha = inscripcion.solicitado_en
            ? new Date(inscripcion.solicitado_en).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })
            : "";
        detalle.textContent = admin
            ? nombres + (perfil?.correo ? " · " + perfil.correo : "") + (fecha ? " · " + fecha : "")
            : (fecha ? "Solicitud enviada el " + fecha : "Solicitud enviada");

        const estado = document.createElement("span");
        estado.className = "inscripcion-estado estado-" + inscripcion.estado;
        estado.textContent = {
            pendiente: "Pendiente",
            aceptada: "Aceptada",
            rechazada: "No aceptada"
        }[inscripcion.estado] || inscripcion.estado;

        contenido.append(curso, detalle);
        tarjeta.append(contenido, estado);

        if (admin && inscripcion.estado === "pendiente") {
            const acciones = document.createElement("div");
            acciones.className = "inscripcion-acciones";
            [["aceptada", "Aceptar"], ["rechazada", "Rechazar"]].forEach(function ([estadoNuevo, etiqueta]) {
                const boton = document.createElement("button");
                boton.type = "button";
                boton.className = "inscripcion-accion inscripcion-accion-" + estadoNuevo;
                boton.dataset.id = inscripcion.id;
                boton.dataset.estado = estadoNuevo;
                boton.textContent = etiqueta;
                acciones.appendChild(boton);
            });
            tarjeta.appendChild(acciones);
        }

        return tarjeta;
    }

    async function cargarMisInscripciones() {
        if (!usuarioActual) return;
        const { data, error } = await supabaseClient
            .from("inscripciones")
            .select("id,curso,estado,solicitado_en")
            .eq("usuario_id", usuarioActual.id)
            .order("solicitado_en", { ascending: false });

        if (error) {
            console.error("No se pudieron cargar tus inscripciones:", error);
            vacio(listaPropia, "No se pudieron cargar tus solicitudes. Confirma que ya ejecutaste el SQL de inscripciones en Supabase.");
            return;
        }

        if (!data || data.length === 0) {
            vacio(listaPropia, "Todavía no has solicitado cupo en ningún curso.");
            return;
        }

        listaPropia.replaceChildren(...data.map(function (inscripcion) {
            return crearTarjeta(inscripcion, null, false);
        }));
    }

    async function cargarPendientesAdmin() {
        if (usuarioActual?.email?.toLowerCase() !== ADMIN_EMAIL) return;

        const { data: solicitudes, error } = await supabaseClient
            .from("inscripciones")
            .select("id,usuario_id,curso,estado,solicitado_en")
            .eq("estado", "pendiente")
            .order("solicitado_en", { ascending: true });

        if (error) {
            console.error("No se pudieron cargar las solicitudes pendientes:", error);
            vacio(listaAdmin, "No se pudo cargar la bandeja. Verifica el SQL y las políticas de Supabase.");
            return;
        }

        if (!solicitudes || solicitudes.length === 0) {
            vacio(listaAdmin, "No hay solicitudes pendientes por revisar.");
            return;
        }

        const ids = Array.from(new Set(solicitudes.map(function (solicitud) { return solicitud.usuario_id; })));
        const { data: perfiles, error: errorPerfiles } = await supabaseClient
            .from("perfiles")
            .select("id,nombre_mostrar,nombre_google,correo")
            .in("id", ids);

        if (errorPerfiles) console.error("No se pudieron cargar los nombres de estudiantes:", errorPerfiles);
        const perfilesPorId = new Map((perfiles || []).map(function (perfil) { return [perfil.id, perfil]; }));
        listaAdmin.replaceChildren(...solicitudes.map(function (solicitud) {
            return crearTarjeta(solicitud, perfilesPorId.get(solicitud.usuario_id), true);
        }));
    }

    async function actualizarVista(usuario) {
        usuarioActual = usuario || null;
        formulario.hidden = !usuarioActual;
        avisoLogin.hidden = !!usuarioActual;
        panelAdmin.hidden = usuarioActual?.email?.toLowerCase() !== ADMIN_EMAIL;

        if (!usuarioActual) {
            vacio(listaPropia, "Inicia sesión para ver tus solicitudes y cursos.");
            listaAdmin.replaceChildren();
            return;
        }

        if (cargando) return;
        cargando = true;
        await cargarMisInscripciones();
        if (!panelAdmin.hidden) await cargarPendientesAdmin();
        cargando = false;
    }

    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        if (!usuarioActual) {
            mostrarMensaje("Conecta tu cuenta para solicitar un cupo.", "error");
            return;
        }

        const curso = selectorCurso.value;
        if (!curso) {
            mostrarMensaje("Selecciona el curso al que quieres inscribirte.", "error");
            selectorCurso.focus();
            return;
        }

        const boton = formulario.querySelector('button[type="submit"]');
        boton.disabled = true;
        boton.textContent = "Enviando...";
        mostrarMensaje("", "");

        const { error } = await supabaseClient
            .from("inscripciones")
            .insert({ usuario_id: usuarioActual.id, curso: curso });

        boton.disabled = false;
        boton.textContent = "Solicitar cupo";

        if (error) {
            console.error("No se pudo enviar la solicitud:", error);
            mostrarMensaje(error.code === "23505"
                ? "Ya tienes una solicitud pendiente o estás aceptado en este curso."
                : "No se pudo enviar la solicitud. Revisa que la configuración SQL de inscripciones esté aplicada.", "error");
            return;
        }

        mostrarMensaje("Solicitud enviada. Te avisaremos cuando el equipo la revise.", "ok");
        await cargarMisInscripciones();
        if (usuarioActual.email?.toLowerCase() === ADMIN_EMAIL) await cargarPendientesAdmin();
    });

    listaAdmin.addEventListener("click", async function (evento) {
        const boton = evento.target.closest("button[data-id][data-estado]");
        if (!boton || usuarioActual?.email?.toLowerCase() !== ADMIN_EMAIL) return;

        boton.disabled = true;
        const { data: actualizada, error } = await supabaseClient
            .from("inscripciones")
            .update({
                estado: boton.dataset.estado,
                revisado_por: usuarioActual.id,
                revisado_en: new Date().toISOString()
            })
            .eq("id", boton.dataset.id)
            .eq("estado", "pendiente")
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("No se pudo actualizar la solicitud:", error);
            mostrarMensaje("No se pudo actualizar la solicitud. Revisa los permisos de administrador en Supabase.", "error");
            boton.disabled = false;
            return;
        }
        if (!actualizada) {
            mostrarMensaje("La solicitud ya fue revisada o no se pudo encontrar.", "error");
            await cargarPendientesAdmin();
            return;
        }

        mostrarMensaje("La solicitud fue actualizada.", "ok");
        await cargarPendientesAdmin();
    });

    if (!supabaseClient) {
        formulario.hidden = true;
        avisoLogin.hidden = false;
        avisoLogin.textContent = "El servicio de inscripciones no está disponible ahora mismo.";
        return;
    }

    supabaseClient.auth.onAuthStateChange(function (_evento, sesion) {
        setTimeout(function () { actualizarVista(sesion?.user || null); }, 0);
    });
    supabaseClient.auth.getSession().then(function ({ data }) {
        actualizarVista(data?.session?.user || null);
    });
}


// 6. ANUNCIOS
function iniciarAnuncios() {
    const anuncio = document.querySelector(".highlight-section");
    if (anuncio) {
        anuncio.style.cursor = "pointer";
        anuncio.addEventListener("click", function () {
            alert("¡Tenemos información sobre nuestros cursos! Si deseas inscribirte, completa el formulario de registro.");
        });
    }
}


// 7. ANIMACIONES DE LAS TARJETAS
function iniciarAnimaciones() {
    const tarjetas = document.querySelectorAll(".card");
    tarjetas.forEach(function (tarjeta) {
        tarjeta.addEventListener("mouseenter", function () {
            tarjeta.style.transform = "translateY(-12px)";
        });
        tarjeta.addEventListener("mouseleave", function () {
            tarjeta.style.transform = "translateY(0)";
        });
    });
}


// 7. PERFIL DEL ESTUDIANTE (login con Google + edición del perfil)
function iniciarPerfil() {
    const vistaLogin = document.getElementById("perfil-login");
    const vistaPanel = document.getElementById("perfil-panel");
    if (!vistaLogin || !vistaPanel) return;

    const btnGoogle = document.getElementById("btn-google");
    const aviso = document.getElementById("perfil-aviso");
    const formulario = document.getElementById("perfil-form");
    const inputFoto = document.getElementById("perfil-foto");
    const imgAvatar = document.getElementById("perfil-avatar-img");
    const inicialAvatar = document.getElementById("perfil-avatar-inicial");
    const txtNombre = document.getElementById("perfil-nombre-google");
    const txtCorreo = document.getElementById("perfil-correo");
    const btnSalir = document.getElementById("btn-salir");
    const mensaje = document.getElementById("perfil-mensaje");
    const navAvatar = document.getElementById("nav-perfil-avatar");

    const campoMostrar = document.getElementById("perfil-mostrar");
    const campoBio = document.getElementById("perfil-bio");
    const campoTelefono = document.getElementById("perfil-telefono");
    const campoPublico = document.getElementById("perfil-publico");

    const BUCKET_FOTOS = "avatares";
    const PESO_MAXIMO_FOTO = 3 * 1024 * 1024; // 3 MB

    let usuarioActual = null;
    let volviendoDeGoogle = (window.location.hash || "").indexOf("access_token") !== -1;

    if (!supabaseClient) {
        if (aviso) aviso.textContent = "El servicio de perfiles no está disponible ahora mismo. Recarga la página e inténtalo de nuevo.";
        if (btnGoogle) btnGoogle.disabled = true;
        return;
    }

    // Si Google devolvió un error, se muestra en la vista de login
    const hash = window.location.hash || "";
    if (hash.indexOf("error_description=") !== -1) {
        const parametros = new URLSearchParams(hash.replace(/^#/, ""));
        mostrarAviso("No se pudo iniciar sesión: " + (parametros.get("error_description") || "inténtalo de nuevo."));
    }

    function mostrarAviso(texto) {
        if (aviso) aviso.textContent = texto || "";
    }

    function mostrarMensaje(texto, tipo) {
        if (!mensaje) return;
        mensaje.className = tipo || "";
        mensaje.textContent = texto || "";
    }

    function inicialDe(texto) {
        const base = (texto || "?").trim();
        return base.charAt(0).toUpperCase() || "?";
    }

    function pintarAvatar(url, inicial) {
        if (url) {
            imgAvatar.src = url;
            imgAvatar.hidden = false;
            inicialAvatar.hidden = true;
            navAvatar.src = url;
            navAvatar.hidden = false;
        } else {
            imgAvatar.hidden = true;
            imgAvatar.removeAttribute("src");
            navAvatar.hidden = true;
            navAvatar.removeAttribute("src");
            inicialAvatar.hidden = false;
            inicialAvatar.textContent = inicial || "?";
        }
    }

    function mostrarVista(logueado) {
        vistaLogin.hidden = logueado;
        vistaPanel.hidden = !logueado;
    }

    function rellenarFormulario(perfil) {
        campoMostrar.value = perfil.nombre_mostrar || "";
        campoBio.value = perfil.bio || "";
        campoTelefono.value = perfil.telefono || "";
        campoPublico.checked = !!perfil.es_publico;
    }

    async function entrarConGoogle() {
        btnGoogle.disabled = true;
        mostrarAviso("Abriendo la ventana de Google...");
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin + window.location.pathname,
                queryParams: { prompt: "select_account" }
            }
        });
        if (error) {
            btnGoogle.disabled = false;
            mostrarAviso("No se pudo conectar con Google: " + error.message);
        }
    }

    async function cargarPerfil(usuario) {
        usuarioActual = usuario;
        mostrarVista(true);
        mostrarAviso("");

        const meta = usuario.user_metadata || {};
        const nombreGoogle = meta.full_name || meta.name || "";
        const correo = usuario.email || "";
        const fotoGoogle = meta.avatar_url || meta.picture || "";

        txtCorreo.textContent = correo;

        const { data, error } = await supabaseClient
            .from("perfiles")
            .select("*")
            .eq("id", usuario.id)
            .maybeSingle();

        let perfil = data;

        if (error) {
            mostrarMensaje("No se pudo leer tu perfil: " + error.message + " (revisa que exista la tabla perfiles con sus políticas).", "error");
        }

        // Primera vez: se crea el perfil con los datos que trae Google
        if (!perfil) {
            const perfilInicial = {
                id: usuario.id,
                correo: correo,
                nombre_google: nombreGoogle,
                nombre_mostrar: nombreGoogle ? nombreGoogle.split(" ")[0] : "",
                bio: "",
                telefono: "",
                foto_url: fotoGoogle,
                es_publico: false
            };

            if (!error) {
                const { data: creado, error: errorCrear } = await supabaseClient
                    .from("perfiles")
                    .insert([perfilInicial])
                    .select()
                    .single();

                if (errorCrear) {
                    console.error("No se pudo crear el perfil:", errorCrear);
                    if (errorCrear.code === "23505") {
                        const { data: existente, error: errorExistente } = await supabaseClient
                            .from("perfiles")
                            .select("*")
                            .eq("id", usuario.id)
                            .maybeSingle();

                        if (!errorExistente && existente) {
                            perfil = existente;
                        } else {
                            mostrarMensaje("Tu perfil ya existe, pero no se pudo volver a leer. Recarga la página e inténtalo de nuevo.", "error");
                            perfil = perfilInicial;
                        }
                    } else {
                        mostrarMensaje("Tu cuenta entró, pero no se pudo crear el perfil en la base de datos: " + errorCrear.message, "error");
                        perfil = perfilInicial;
                    }
                } else {
                    perfil = creado;
                }
            } else {
                perfil = perfilInicial;
            }
        }

        const datos = perfil || { nombre_mostrar: "", bio: "", telefono: "", foto_url: fotoGoogle, es_publico: false };

        txtNombre.textContent = datos.nombre_mostrar || nombreGoogle || correo || "Estudiante";
        rellenarFormulario(datos);
        pintarAvatar(datos.foto_url || "", inicialDe(datos.nombre_mostrar || nombreGoogle || correo));

        if (volviendoDeGoogle) {
            volviendoDeGoogle = false;
            mostrarTabSitio("perfil", true);
        }
    }

    btnGoogle.addEventListener("click", entrarConGoogle);

    btnSalir.addEventListener("click", async function () {
        btnSalir.disabled = true;
        await supabaseClient.auth.signOut();
        btnSalir.disabled = false;
    });

    formulario.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!usuarioActual) return;

        const nombreMostrar = campoMostrar.value.trim();
        const telefono = campoTelefono.value.trim();

        if (nombreMostrar && !/^[a-záéíóúüñ0-9\s.'-]+$/i.test(nombreMostrar)) {
            mostrarMensaje("Escribe un nombre válido.", "error");
            campoMostrar.focus();
            return;
        }

        if (telefono && !/^[0-9+\s()-]+$/.test(telefono)) {
            mostrarMensaje("Escribe un número de teléfono válido.", "error");
            campoTelefono.focus();
            return;
        }

        const boton = formulario.querySelector('button[type="submit"]');
        boton.disabled = true;
        boton.textContent = "Guardando...";
        mostrarMensaje("Guardando tus cambios...", "");

        const meta = usuarioActual.user_metadata || {};

        const { error } = await supabaseClient
            .from("perfiles")
            .upsert({
                id: usuarioActual.id,
                correo: usuarioActual.email || "",
                nombre_google: meta.full_name || meta.name || "",
                nombre_mostrar: nombreMostrar,
                bio: campoBio.value.trim(),
                telefono: telefono,
                es_publico: campoPublico.checked,
                actualizado_en: new Date().toISOString()
            });

        boton.disabled = false;
        boton.textContent = "Guardar cambios";

        if (error) {
            mostrarMensaje("No se pudieron guardar los cambios: " + error.message, "error");
            return;
        }

        txtNombre.textContent = nombreMostrar || meta.full_name || usuarioActual.email || "Estudiante";
        if (imgAvatar.hidden) {
            inicialAvatar.textContent = inicialDe(nombreMostrar || meta.full_name || usuarioActual.email);
        }
        mostrarMensaje("¡Listo! Tu perfil se guardó correctamente.", "ok");
    });

    inputFoto.addEventListener("change", async function () {
        const archivo = inputFoto.files && inputFoto.files[0];
        inputFoto.value = "";
        if (!archivo || !usuarioActual) return;

        if (archivo.type.indexOf("image/") !== 0) {
            mostrarMensaje("Selecciona un archivo de imagen (JPG, PNG o WEBP).", "error");
            return;
        }

        if (archivo.size > PESO_MAXIMO_FOTO) {
            mostrarMensaje("La foto debe pesar menos de 3 MB.", "error");
            return;
        }

        mostrarMensaje("Subiendo tu foto...", "");

        const extension = (archivo.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const ruta = usuarioActual.id + "/foto-" + Date.now() + "." + (extension || "jpg");

        const { error: errorSubida } = await supabaseClient.storage
            .from(BUCKET_FOTOS)
            .upload(ruta, archivo, { cacheControl: "3600", upsert: true, contentType: archivo.type });

        if (errorSubida) {
            mostrarMensaje("No se pudo subir la foto: " + errorSubida.message, "error");
            return;
        }

        const { data: fotoPublica } = supabaseClient.storage.from(BUCKET_FOTOS).getPublicUrl(ruta);
        const url = fotoPublica ? fotoPublica.publicUrl : "";

        const { error: errorGuardar } = await supabaseClient
            .from("perfiles")
            .upsert({ id: usuarioActual.id, correo: usuarioActual.email || "", foto_url: url });

        if (errorGuardar) {
            mostrarMensaje("La foto subió, pero no se pudo guardar en tu perfil: " + errorGuardar.message, "error");
            return;
        }

        pintarAvatar(url, "");
        mostrarMensaje("¡Foto actualizada! Se quedará así hasta que decidas cambiarla.", "ok");
    });

    // Escucha los cambios de sesión (login, logout, retorno de Google)
    supabaseClient.auth.onAuthStateChange(function (evento, sesion) {
        // Se aplaza para evitar bloqueos internos de Supabase dentro del callback
        setTimeout(function () {
            if (sesion && sesion.user) {
                cargarPerfil(sesion.user);
            } else {
                usuarioActual = null;
                mostrarVista(false);
                navAvatar.hidden = true;
                navAvatar.removeAttribute("src");
                mostrarMensaje("", "");
            }
        }, 0);
    });
}
