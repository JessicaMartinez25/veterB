// Abrir o crear la base de datos
let db;

const request = indexedDB.open('vetDB', 1);

// Crear el esquema de la base de datos si no existe
request.onupgradeneeded = function (e) {
    db = e.target.result;
    const objectStore = db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('name', 'name', { unique: false });
    objectStore.createIndex('owner', 'owner', { unique: false });
    objectStore.createIndex('animalType', 'animalType', { unique: false });
    objectStore.createIndex('age', 'age', { unique: false });
    objectStore.createIndex('gender', 'gender', { unique: false });
    objectStore.createIndex('treatment', 'treatment', { unique: false });
    objectStore.createIndex('appointmentDate', 'appointmentDate', { unique: false });
    objectStore.createIndex('photo', 'photo', { unique: false });
};

request.onerror = function (e) {
    console.error("Error al abrir la base de datos:", e.target.error);
};

request.onsuccess = function (e) {
    db = e.target.result;
    console.log("Base de datos abierta exitosamente");
    mostrarPacientes(); // Mostrar pacientes registrados
};



// Registrar paciente en IndexedDB
function agregarPaciente(paciente) {
    const transaction = db.transaction(['patients'], 'readwrite');
    const objectStore = transaction.objectStore('patients');
    const request = objectStore.add(paciente);

    request.onsuccess = function () {
        console.log("Paciente agregado.");
        mostrarPacientes(); // Actualizar la lista después de agregar el paciente
    };

    request.onerror = function (e) {
        console.error("Error al agregar paciente:", e.target.error);
    };
}

// Mostrar los pacientes almacenados
function mostrarPacientes() {
    const pacientesList = document.getElementById('patients-list');
    pacientesList.innerHTML = '';  // Limpiar la lista antes de agregar nuevos pacientes

    const transaction = db.transaction(['patients'], 'readonly');
    const objectStore = transaction.objectStore('patients');
    const request = objectStore.getAll();

    request.onsuccess = function (e) {
        const pacientes = e.target.result;
        if (pacientes.length > 0) {
            pacientes.forEach(paciente => {
                const li = document.createElement('li');
                const photo = paciente.photo ? `<img src="${URL.createObjectURL(paciente.photo)}" alt="Foto de ${paciente.name}" width="60" height="60">` : '';
                li.innerHTML = `
                    ${photo}
                    <div class="patient-info">
                        <span class="name">${paciente.name} (${paciente.animalType})</span>
                        <span class="owner">Propietario: ${paciente.owner}</span>
                        <span class="age">Edad: ${paciente.age}</span>
                        <span class="treatment">Tratamiento: ${paciente.treatment}</span>
                    </div>
                `;
                
                 // Crear el botón de eliminación y asignarle la clase delete-btn
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Eliminar paciente';
                    deleteButton.classList.add('delete-btn');  // Asignar la clase aquí

                                    // Eliminar un paciente de IndexedDB
                function eliminarPaciente(id) {
                    const transaction = db.transaction(['patients'], 'readwrite');
                    const objectStore = transaction.objectStore('patients');
                    const request = objectStore.delete(id);  // Elimina el paciente por su ID

                    request.onsuccess = function () {
                        console.log(`Paciente con ID ${id} eliminado.`);
                        mostrarPacientes();  // Actualizar la lista de pacientes
                        mostrarAviso('Paciente eliminado con éxito.');  // Mostrar mensaje de éxito
                    };

                    request.onerror = function (e) {
                        console.error("Error al eliminar paciente:", e.target.error);
                    };
                }
                
                    // Añadir el evento de eliminación
                    // Añadir el evento de eliminación
                    deleteButton.addEventListener('click', function () {
                        eliminarPaciente(paciente.id);  // Llamar a la función para eliminar el paciente
                    });

                    // Añadir el botón al <li>
                    li.appendChild(deleteButton);
                    pacientesList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = "No hay pacientes registrados.";
                pacientesList.appendChild(li);
            }
        };
    
        request.onerror = function (e) {
            console.error("Error al obtener pacientes:", e.target.error);
        };
    }



// Mostrar aviso de éxito
function mostrarAviso(mensaje) {
    const aviso = document.createElement('div');
    aviso.classList.add('aviso');
    aviso.textContent = mensaje;
    document.body.appendChild(aviso);

    // Desaparecer el aviso después de 3 segundos
    setTimeout(() => {
        aviso.remove();
    }, 3000);
}

// Manejar el formulario de registro
const form = document.getElementById('registro-form');
form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Obtener la foto seleccionada
    const photoFile = document.getElementById('patient-photo').files[0];
    const photoBlob = photoFile ? photoFile : null;

    const paciente = {
        name: document.getElementById('patient-name').value,
        owner: document.getElementById('owner-name').value,
        animalType: document.getElementById('animal-type').value,
        age: document.getElementById('age').value,
        gender: document.getElementById('gender').value,
        treatment: document.getElementById('treatment').value,
        appointmentDate: document.getElementById('appointment-date').value,
        photo: photoBlob // Almacenar la foto como un blob
    };

    agregarPaciente(paciente);

    form.reset();  // Limpiar el formulario
});

// Esperar a que el DOM se cargue completamente
document.addEventListener('DOMContentLoaded', () => {
    // Una vez cargado el contenido, ocultar la pantalla de carga
    document.body.classList.add('loaded');
});



// Registrar Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("service-worker.js")
        .then(() => {
            console.log("Service Worker registrado con éxito.");
        })
        .catch((error) => {
            console.error("Error al registrar el Service Worker:", error);
        });
}

// Escuchar eventos de conexión
window.addEventListener('online', () => {
    alert('¡Conexión restaurada!');
});

window.addEventListener('offline', () => {
    alert('Estás desconectado');
});
