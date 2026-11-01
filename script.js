
document.addEventListener("DOMContentLoaded", () => {
    console.log("Mundo Edita: JavaScript conectado correctamente.");

    // Aquí agregaremos las funciones interactivas
    // de los cursos, botones, estudiantes y anuncios.
});

document.addEventListener("DOMContentLoaded", function () {
    console.log("Mundo Edita está funcionando.");

    iniciarMenu();
    iniciarCursos();
    iniciarEstudiantes();
    iniciarAnuncios();
    iniciarValidaciones();
    iniciarAnimaciones();
});


// 1. MENU
function iniciarMenu() {
    const enlaces = document.querySelectorAll('.nav-links a, .hero-link, .curso-ver-mas-btn');

    enlaces.forEach(function (enlace) {
        enlace.addEventListener("click", function (e) {
            const destino = document.querySelector(enlace.getAttribute("href"));

            if (destino) {
                e.preventDefault();

                destino.scrollIntoView({
                    behavior: "smooth"
                });
            }
        });
    });
}


// 2. CURSOS
function iniciarCursos() {
    const botones = document.querySelectorAll(".card-btn");

    botones.forEach(function (boton) {
        boton.addEventListener("click", function () {
            const tarjeta = boton.closest(".card");
            const titulo = tarjeta.querySelector(".card-title").textContent;

            document.getElementById("message").textContent =
                "Te interesa el curso de " + titulo +
                ". Completa tus datos para continuar.";

            document.getElementById("registro").scrollIntoView({
                behavior: "smooth"
            });
        });
    });
}


// 3. ESTUDIANTES

function iniciarEstudiantes() {
    const tabla = document.querySelector("table tbody");

    if (!tabla) {
        return;
    }

    // Recuperar los estudiantes guardados
    let estudiantes = JSON.parse(localStorage.getItem("estudiantesMundoEdita")) || [];

    // Guardar los estudiantes
    function guardarEstudiantes() {
        localStorage.setItem("estudiantesMundoEdita", JSON.stringify(estudiantes));
    }

    // Mostrar los estudiantes en la tabla
    function mostrarEstudiantes() {
        // Quitar las filas anteriores
        tabla.innerHTML = "";

        estudiantes.forEach(function (estudiante, indice) {
            const fila = document.createElement("tr");

            [estudiante.nombre, estudiante.edad, estudiante.genero, estudiante.progreso + "%"]
                .forEach(function (dato) {
                    const celda = document.createElement("td");
                    celda.textContent = dato;
                    fila.appendChild(celda);
                });

            const celdaAcciones = document.createElement("td");
            const botonEliminar = document.createElement("button");

            botonEliminar.textContent = "Eliminar";
            botonEliminar.type = "button";

            botonEliminar.addEventListener("click", function () {
                if (confirm("¿Quieres eliminar a " + estudiante.nombre + "?")) {
                    estudiantes.splice(indice, 1);
                    guardarEstudiantes();
                    mostrarEstudiantes();
                }
            });

            celdaAcciones.appendChild(botonEliminar);
            fila.appendChild(celdaAcciones);
            tabla.appendChild(fila);
        });
    }

    // Crear el botón para agregar estudiantes
    const botonAgregar = document.createElement("button");
    botonAgregar.textContent = "Agregar estudiante";
    botonAgregar.type = "button";
    botonAgregar.className = "submit-btn";

    tabla.closest("table").before(botonAgregar);

    botonAgregar.addEventListener("click", function () {
        const nombre = prompt("Nombre del estudiante:");
        if (nombre === null || nombre.trim() === "") {
            return;
        }

        const edad = prompt("Edad del estudiante:");
        if (edad === null || !Number.isInteger(Number(edad)) ||
            Number(edad) < 1 || Number(edad) > 120) {
            alert("Escribe una edad válida.");
            return;
        }

        const genero = prompt("Género del estudiante:");
        if (genero === null || genero.trim() === "") {
            return;
        }

        const progreso = prompt("Progreso del 0 al 100:");
        if (progreso === null || progreso.trim() === "" ||
            !Number.isFinite(Number(progreso)) ||
            Number(progreso) < 0 || Number(progreso) > 100) {
            alert("Escribe un progreso entre 0 y 100.");
            return;
        }

        estudiantes.push({
            nombre: nombre.trim(),
            edad: Number(edad),
            genero: genero.trim(),
            progreso: Number(progreso)
        });

        guardarEstudiantes();
        mostrarEstudiantes();

        alert("Estudiante guardado correctamente.");
    });

    // Mostrar los datos guardados al abrir la página
    mostrarEstudiantes();
}



// 4. ANUNCIOS
function iniciarAnuncios() {
    const anuncio = document.querySelector(".highlight-section");

    if (anuncio) {
        anuncio.style.cursor = "pointer";

        anuncio.addEventListener("click", function () {
            alert(
                "¡Tenemos información sobre nuestros cursos! " +
                "Si deseas inscribirte, completa el formulario de registro."
            );
        });
    }
}


// 5. VALIDACIONES DEL FORMULARIO
function iniciarValidaciones() {
    const formulario = document.getElementById("registrationForm");
    const nombre = document.getElementById("name");
    const telefono = document.getElementById("phone");
    const mensaje = document.getElementById("message");

    formulario.addEventListener("submit", function (e) {
        e.preventDefault();

        const nombreIngresado = nombre.value.trim();
        const telefonoIngresado = telefono.value.trim();
        const numeros = telefonoIngresado.replace(/\D/g, "");

        if (nombreIngresado === "") {
            mensaje.textContent = "Por favor, escribe tu nombre.";
            mensaje.style.color = "red";
            nombre.focus();
            return;
        }

        if (!/^[a-záéíóúüñ\s'-]+$/i.test(nombreIngresado)) {
            mensaje.textContent = "Escribe un nombre válido.";
            mensaje.style.color = "red";
            nombre.focus();
            return;
        }

        if (!/^[0-9+\s()-]+$/.test(telefonoIngresado) ||
            numeros.length < 7 || numeros.length > 15) {
            mensaje.textContent = "Escribe un número de teléfono válido.";
            mensaje.style.color = "red";
            telefono.focus();
            return;
        }

        mensaje.style.color = "green";
        mensaje.textContent =
            "¡Gracias, " + nombreIngresado +
            "! Tu registro se validó correctamente. " +
            "Te contactaremos al número " + telefonoIngresado + ".";

        formulario.reset();
    });
}


// 6. ANIMACIONES DE LAS TARJETAS
function iniciarAnimaciones() {
    const tarjetas = document.querySelectorAll(".card");

    tarjetas.forEach(function (tarjeta) {
        tarjeta.style.transition = "transform 0.2s ease";

        tarjeta.addEventListener("mouseenter", function () {
            tarjeta.style.transform = "translateY(-5px)";
        });

        tarjeta.addEventListener("mouseleave", function () {
            tarjeta.style.transform = "translateY(0)";
        });
    });
}
