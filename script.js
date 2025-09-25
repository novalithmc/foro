// ========================================================================
// ⚠️ ESTA ES LA URL DE TU APLICACIÓN WEB DE GOOGLE APPS SCRIPT
// Se usa para enviar y recibir todos los datos (Hilos y Comentarios)
// ========================================================================
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzWLI4OQPBjnEdf4gyh_IW69_LHlwc6Uz0ToxVM2OaeVdLcARjdSIvmxNUypJ7XjN92/exec'; 
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
    
    // 3. Lógica para la página de vista de hilo (thread_view.html)
    const threadContentContainer = document.getElementById('thread-content-container');
    const newCommentForm = document.getElementById('new-comment-form');
    if (threadContentContainer) {
        loadThreadView();
    }
    if (newCommentForm) {
        newCommentForm.addEventListener('submit', handleNewCommentSubmit);
    }
});


// --- LÓGICA DE CREACIÓN DE HILOS (new_thread.html) ---

/**
 * Función para manejar el envío del formulario de creación de hilos.
 * @param {Event} e Evento de envío del formulario.
 */
async function handleNewThreadSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
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
        type: 'new_thread', // Clave para que Apps Script guarde en la hoja HILOS
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
            // Redirigir al usuario al índice
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


// --- LÓGICA DE LISTADO DE HILOS (index.html) ---

/**
 * Función para cargar y mostrar todos los hilos en el índice (index.html).
 */
async function loadThreads() {
    const listContainer = document.getElementById('threads-list');
    const loadingDiv = document.getElementById('loading');
    listContainer.innerHTML = '';
    loadingDiv.style.display = 'block';

    try {
        // Solicita a Apps Script todos los hilos
        const url = `${GAS_WEB_APP_URL}?action=get_all_threads`;
        const response = await fetch(url, { method: 'GET', mode: 'cors' });
        
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
                
                // Nota: El conteo de comentarios se hace en la vista de hilo para ahorrar recursos.
                card.innerHTML = `
                    <div>
                        <h4><a href="thread_view.html?id=${thread.id}" class="neon-text" style="text-decoration: none;">${thread.title}</a></h4>
                        <small class="text-muted">Autor: ${thread.author} | Publicado: ${thread.timestamp}</small>
                    </div>
                    <span class="badge bg-secondary"><i class="fas fa-comments"></i> Cargando...</span>
                `;
                listContainer.appendChild(card);
            });
            // Opcional: Podríamos hacer otra llamada para contar los comentarios,
            // pero lo dejaremos simple por ahora.

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


// --- LÓGICA DE VISTA DE HILO Y COMENTARIOS (thread_view.html) ---

let currentThreadId = null;

/**
 * Obtiene el ID del hilo desde la URL y carga los datos.
 */
async function loadThreadView() {
    const urlParams = new URLSearchParams(window.location.search);
    const threadId = urlParams.get('id');

    if (!threadId) {
        document.getElementById('thread-title').textContent = 'Error: Hilo no especificado.';
        return;
    }
    
    currentThreadId = threadId; // Guardar ID para usarlo en el formulario de comentarios
    
    // URL para obtener el hilo y sus comentarios
    const url = `${GAS_WEB_APP_URL}?action=get_thread_data&id=${threadId}`;

    try {
        const response = await fetch(url, { method: 'GET', mode: 'cors' });
        const result = await response.json();
        
        if (result.status === 200 && result.data) {
            const thread = result.data;
            
            // Llenar el contenido del hilo
            document.getElementById('thread-title').textContent = thread.title;
            document.getElementById('thread-meta').textContent = `Autor: ${thread.author} | Publicado: ${thread.timestamp}`;
            document.getElementById('thread-body').textContent = thread.content;
            
            // Cargar comentarios
            renderComments(thread.comments);
        } else {
            document.getElementById('thread-title').textContent = `Error 404: Hilo ${threadId} no encontrado.`;
            document.getElementById('comments-list').innerHTML = `<p class="alert alert-danger">No se pudo cargar el hilo o el servidor respondió: ${result.message}</p>`;
        }

    } catch (error) {
        document.getElementById('thread-title').textContent = 'Error de Conexión';
        document.getElementById('comments-list').innerHTML = `<p class="alert alert-danger">No se pudo conectar con el servidor del foro.</p>`;
        console.error('Fetch error:', error);
    }
}

/**
 * Renderiza los comentarios en la lista.
 */
function renderComments(comments) {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '';
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="text-center text-muted">Sé el primero en comentar.</p>';
        return;
    }
    
    // Mostrar comentarios más recientes primero
    const sortedComments = comments.reverse();

    sortedComments.forEach(comment => {
        const card = document.createElement('div');
        card.classList.add('comment-card');
        card.innerHTML = `
            <small class="text-info">${comment.author}</small>
            <p class="mt-1">${comment.content}</p>
            <small class="text-muted d-block text-end">${comment.timestamp}</small>
        `;
        commentsList.appendChild(card);
    });
}

/**
 * Función para manejar el envío del formulario de comentarios.
 */
async function handleNewCommentSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    const author = form.commentAuthor.value.trim();
    const content = form.commentContent.value.trim();

    if (!author || !content) {
        showMessage('Por favor, ingresa tu nombre y tu comentario.', 'alert-warning', 'comment-message');
        return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando...';

    const dataToSend = {
        type: 'new_comment', // Clave para que Apps Script guarde en la hoja COMENTARIOS
        threadId: currentThreadId,
        author: author,
        content: content
    };

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });

        const result = await response.json();
        
        if (result.status === 200) {
            showMessage('Comentario publicado con éxito.', 'alert-success', 'comment-message');
            form.commentContent.value = ''; // Limpiar campo
            
            // Recargar la vista para mostrar el nuevo comentario
            loadThreadView(); 
        } else {
            showMessage(`Error al comentar: ${result.message}`, 'alert-danger', 'comment-message');
        }

    } catch (error) {
        showMessage('Error de conexión al enviar el comentario.', 'alert-danger', 'comment-message');
        console.error('Fetch error:', error);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-comment-dots"></i> Publicar Comentario';
    }
}

// --- FUNCIONES DE UTILIDAD ---

/**
 * Muestra un mensaje de feedback al usuario.
 */
function showMessage(message, className, elementId = 'form-message') {
    const messageDiv = document.getElementById(elementId);
    if (messageDiv) {
        messageDiv.className = `alert mt-4 ${className}`;
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
    }
}
