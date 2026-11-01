document.addEventListener("DOMContentLoaded", function () {
    iniciarTabs();
    iniciarCursos();
    iniciarRegistro();
    iniciarEstudiantes();
    iniciarAnuncios();
    iniciarAnimaciones();
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

            mostrarTabSitio("contacto", true);

            const mensaje = document.getElementById("message");
            if (mensaje) {
                mensaje.textContent =
                    "Te interesa el curso de " + titulo + ". Completa tus datos para continuar.";
                mensaje.style.color = "var(--color-primario)";
            }

            const registro = document.getElementById("registro");
            if (registro) {
                setTimeout(function () {
                    registro.scrollIntoView({ behavior: "smooth" });
                }, 50);
            }
        });
    });
}


// 3. FORMULARIO DE REGISTRO CON VALIDACIONES
function iniciarRegistro() {
    const formulario = document.getElementById("registrationForm");
    if (!formulario) return;

    const nombreInput = document.getElementById("name");
    const telefonoInput = document.getElementById("phone");
    const mensaje = document.getElementById("message");

    formulario.addEventListener("submit", function (e) {
        e.preventDefault();

        const nombreIngresado = nombreInput.value.trim();
        const telefonoIngresado = telefonoInput.value.trim();
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

        if (!/^[0-9+\s()-]+$/.test(telefonoIngresado) ||
            numeros.length < 7 || numeros.length > 15) {
            mensaje.textContent = "Escribe un número de teléfono válido.";
            mensaje.style.color = "#ff4d4d";
            telefonoInput.focus();
            return;
        }

        mensaje.className = "success-message";
        mensaje.style.color = "#00ff88";
        mensaje.innerHTML = `<p class="success-text">Gracias ${nombreIngresado}! Te has registrado exitosamente cualquier duda contactanos en el soporte te contactaremos en ${telefonoIngresado} Ten un buen día :V </p>`;

        this.reset();
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


// 5. ANUNCIOS
function iniciarAnuncios() {
    const anuncio = document.querySelector(".highlight-section");
    if (anuncio) {
        anuncio.style.cursor = "pointer";
        anuncio.addEventListener("click", function () {
            alert("¡Tenemos información sobre nuestros cursos! Si deseas inscribirte, completa el formulario de registro.");
        });
    }
}


// 6. ANIMACIONES DE LAS TARJETAS
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
