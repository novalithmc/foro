// ========================================================================
// ⚠️ REEMPLAZA ESTA URL CON LA URL DE DESPLIEGUE DE TU GOOGLE APPS SCRIPT ⚠️
// ========================================================================
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw6jV9O7RrCIpo_I6bc1D-HHNAZX-ycLcrvc87RXjVFWKKEQ5kCxf58D2ppOLli6sBJ/exec'; 
// Ejemplo: 'https://script.google.com/macros/s/AKfyc.../exec'
// ========================================================================


document.addEventListener('DOMContentLoaded', () => {
    // 1. Lógica para la página de creación de hilos (new_thread.html)
    const newThreadForm = document.getElementById('new-thread-form');
    if (newThreadForm) {
        newThreadForm.addEventListener('submit', handleNewThreadSubmit);
    }

    // 2. Lógica para la página de índice de hilos (index.html)
    const threadsList = document.getElementById('threads-list');
    if (threadsList) {
        loadThreads();
    }
    
    // 3. Lógica para la página de vista de hilo (thread_view.html) - TO DO
    // Nota: La carga de datos para thread_view.html y el formulario de comentarios
    // se manejará después de verificar que la creación y listado funcionan.
});


/**
 * Función para manejar el envío del formulario de creación de hilos.
 * @param {Event} e Evento de envío del formulario.
 */
async function handleNewThreadSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const messageDiv = document.getElementById('form-message');
    
    // Simulación de validación
    const title = form.threadTitle.value.trim();
    const author = form.threadAuthor.value.trim();
    const content = form.threadContent.value.trim();

    if (!title || !author || !content) {
        showMessage('Por favor, rellena todos los campos.', 'alert-warning');
        return;
    }
    
    // Deshabilitar botón y mostrar carga
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Publicando...';

    const dataToSend = {
        type: 'new_thread', // Indica a Apps Script que debe guardar en la hoja HILOS
        title: title,
        author: author,
        content: content
    };

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        const result = await response.json();
        
        if (result.status === 200) {
            showMessage('¡Hilo publicado con éxito! Redirigiendo...', 'alert-success');
            // Opcional: Redirigir al usuario al índice o al nuevo hilo
            setTimeout(() => {
                window.location.href = 'index.html'; 
            }, 2000);
        } else {
            showMessage(`Error al publicar: ${result.message}`, 'alert-danger');
        }

    } catch (error) {
        showMessage('Error de conexión con la base de datos.', 'alert-danger');
        console.error('Fetch error:', error);
    } finally {
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar Hilo';
    }
}

/**
 * Función para cargar y mostrar todos los hilos en el índice (index.html).
 */
async function loadThreads() {
    const listContainer = document.getElementById('threads-list');
    const loadingDiv = document.getElementById('loading');
    listContainer.innerHTML = '';
    loadingDiv.style.display = 'block';

    try {
        const url = `${GAS_WEB_APP_URL}?action=get_all_threads`;
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });
        
        const result = await response.json();
        
        if (result.status === 200 && result.data && Array.isArray(result.data)) {
            loadingDiv.style.display = 'none';
            
            if (result.data.length === 0) {
                 listContainer.innerHTML = '<p class="text-center text-muted">Aún no hay hilos. ¡Sé el primero en crear uno!</p>';
                 return;
            }

            // Invertir el array para mostrar los hilos más recientes primero
            const sortedThreads = result.data.reverse();

            sortedThreads.forEach(thread => {
                const card = document.createElement('div');
                card.classList.add('thread-card', 'd-flex', 'justify-content-between', 'align-items-center');
                
                // Nota: Los comentarios por hilo no se cargan aquí para ahorrar tiempo.
                // Usaremos un valor temporal '0' para Comentarios.

                card.innerHTML = `
                    <div>
                        <h4><a href="thread_view.html?id=${thread.id}" class="neon-text" style="text-decoration: none;">${thread.title}</a></h4>
                        <small class="text-muted">Autor: ${thread.author} | Publicado: ${thread.timestamp}</small>
                    </div>
                    <span class="badge bg-secondary">0 Comentarios</span>
                `;
                listContainer.appendChild(card);
            });
        } else {
            listContainer.innerHTML = `<div class="alert alert-danger">Error al cargar hilos: ${result.message || 'Desconocido'}</div>`;
        }

    } catch (error) {
        listContainer.innerHTML = `<div class="alert alert-danger">No se pudo conectar con el servidor del foro.</div>`;
        console.error('Fetch error:', error);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

/**
 * Muestra un mensaje de feedback al usuario.
 */
function showMessage(message, className) {
    const messageDiv = document.getElementById('form-message');
    messageDiv.className = `alert mt-4 ${className}`;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
}
