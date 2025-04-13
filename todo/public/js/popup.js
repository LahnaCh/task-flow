// Gestionnaire pour le popup de tâche
let isPopupProcessing = false;
let isPopupEventHandled = false; // Variable pour éviter les doubles événements

// Vérifier si le popup a déjà été initialisé
if (window.popupInitialized) {
    console.log('Popup déjà initialisé, évitement de la double initialisation');
} else {
    // Marquer le popup comme initialisé
    window.popupInitialized = true;
    
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Initialisation du popup');
        
        // Éléments DOM
        const taskPopup = document.getElementById('task-popup');
        const taskForm = document.getElementById('task-form');
        const closePopupBtn = document.getElementById('close-popup');
        
        // Gestionnaire pour fermer le popup
        if (closePopupBtn) {
            closePopupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Empêcher la propagation
                closePopup();
            });
        }
        
        // Gestionnaire pour le formulaire avec protection contre les doubles soumissions
        if (taskForm) {
            // Supprimer les gestionnaires existants pour éviter les doublons
            taskForm.removeEventListener('submit', handleFormSubmitWrapper);
            
            // Ajouter un nouveau gestionnaire
            taskForm.addEventListener('submit', handleFormSubmitWrapper);
        }
        
        // Fermer le popup en cliquant en dehors
        window.addEventListener('click', (e) => {
            if (e.target === taskPopup) {
                closePopup();
            }
        });
    });
}

// Wrapper pour le gestionnaire de formulaire
function handleFormSubmitWrapper(e) {
    e.preventDefault();
    e.stopPropagation(); // Empêcher la propagation
    
    // Vérifier si le formulaire est déjà en cours de traitement
    if (isPopupProcessing) {
        console.log('Traitement en cours, veuillez patienter...');
        return;
    }
    
    // Vérifier si l'événement a déjà été traité
    if (isPopupEventHandled) {
        console.log('Événement de formulaire déjà traité, ignoré');
        return;
    }
    
    // Marquer l'événement comme traité
    isPopupEventHandled = true;
    
    // Réinitialiser après un court délai
    setTimeout(() => {
        isPopupEventHandled = false;
    }, 100);
    
    // Appeler le gestionnaire de formulaire
    handleFormSubmit(e);
}

// Vérifier si l'utilisateur est connecté avant d'autoriser certaines actions
function checkAuthentication() {
    const isAuthenticated = !!document.querySelector('.user-info');
    if (!isAuthenticated) {
        showNotification('Veuillez vous connecter pour effectuer cette action', 'error');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return false;
    }
    return true;
}

// Fonction pour gérer les erreurs d'authentification et rediriger
function handleAuthError() {
    console.error('Erreur d\'authentification');
    showNotification('Veuillez vous connecter pour effectuer cette action', 'error');
    setTimeout(() => {
        window.location.href = '/login';
    }, 1500);
}

// Fonction pour ouvrir le popup de tâche
function openTaskPopup(mode, taskId = null) {
    // Vérifier l'authentification avant d'ouvrir le popup
    if (!checkAuthentication()) {
        return;
    }
    
    const popup = document.getElementById('task-popup');
    const title = document.getElementById('popup-title');
    const submitBtn = document.getElementById('submit-task');
    
    // Réinitialiser le formulaire
    const form = document.getElementById('task-form');
    if (form) {
        form.reset();
        // Supprimer les messages d'erreur
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(message => message.remove());
        
        // Réinitialiser les classes d'erreur
        const inputs = form.querySelectorAll('.error');
        inputs.forEach(input => input.classList.remove('error'));
    }
    
    // Si aucun mode n'est spécifié ou si l'objet passé est une tâche complète (appel depuis index.js)
    if (!mode || typeof mode === 'object') {
        if (typeof mode === 'object' && mode !== null) {
            // Mode édition avec un objet tâche
            const task = mode;
            title.textContent = 'Modifier la tâche';
            submitBtn.textContent = 'Mettre à jour';
            
            // Remplir le formulaire avec les données de la tâche
            if (form) {
                form.dataset.taskId = task.id;
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-description').value = task.description;
                
                // Formater la date d'échéance (YYYY-MM-DD)
                if (task.dueDate) {
                    const dueDate = new Date(task.dueDate);
                    const formattedDate = dueDate.toISOString().slice(0, 16);
                    document.getElementById('task-due-date').value = formattedDate;
                }
                
                document.getElementById('task-priority').value = task.priority;
                document.getElementById('task-status').value = task.status;
            }
        } else {
            // Mode création
            title.textContent = 'Créer une nouvelle tâche';
            submitBtn.textContent = 'Créer';
            
            // Définir la date d'échéance par défaut à aujourd'hui
            const today = new Date();
            const formattedDate = today.toISOString().slice(0, 16);
            document.getElementById('task-due-date').value = formattedDate;
            
            if (form) {
                form.dataset.taskId = '';
            }
        }
    } else {
        // Ancienne approche avec mode explicite
        if (mode === 'create') {
            title.textContent = 'Créer une nouvelle tâche';
            submitBtn.textContent = 'Créer';
            
            // Définir la date d'échéance par défaut à aujourd'hui
            const today = new Date();
            const formattedDate = today.toISOString().slice(0, 16);
            document.getElementById('task-due-date').value = formattedDate;
            
            if (form) {
                form.dataset.taskId = '';
            }
        } else if (mode === 'edit' && taskId) {
            title.textContent = 'Modifier la tâche';
            submitBtn.textContent = 'Mettre à jour';
            
            if (form) {
                form.dataset.taskId = taskId;
            }
            
            // Récupérer les détails de la tâche
            fetch(`/api/tasks/${taskId}`)
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 401) {
                            throw new Error('AUTH_ERROR');
                        }
                        throw new Error('API_ERROR');
                    }
                    return response.json();
                })
                .then(task => {
                    document.getElementById('task-title').value = task.title;
                    document.getElementById('task-description').value = task.description;
                    
                    // Formater la date d'échéance
                    if (task.dueDate) {
                        const dueDate = new Date(task.dueDate);
                        const formattedDate = dueDate.toISOString().slice(0, 16);
                        document.getElementById('task-due-date').value = formattedDate;
                    }
                    
                    document.getElementById('task-priority').value = task.priority;
                    document.getElementById('task-status').value = task.status;
                })
                .catch(error => {
                    console.error('Erreur lors de la récupération des détails de la tâche:', error);
                    if (error.message === 'AUTH_ERROR') {
                        handleAuthError();
                    } else {
                        showNotification('Erreur lors de la récupération des détails de la tâche', 'error');
                    }
                });
        }
    }
    
    // Afficher le popup
    popup.classList.add('active');
}

// Fonction pour fermer le popup
function closePopup() {
    console.log('=== FERMETURE DU POPUP ===');
    
    const popup = document.getElementById('task-popup');
    const form = document.getElementById('task-form');
    
    if (popup && form) {
        popup.classList.remove('active');
        form.reset();
        form.dataset.taskId = '';
        
        // Supprimer les messages d'erreur
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(message => message.remove());
        
        // Réinitialiser les classes d'erreur
        const inputs = form.querySelectorAll('.error');
        inputs.forEach(input => input.classList.remove('error'));
    }
}

// Validation du formulaire
function validateForm() {
    console.log('=== VALIDATION DU FORMULAIRE ===');
    
    const form = document.getElementById('task-form');
    if (!form) return false;
    
    let isValid = true;
    
    // Vérifier le titre
    const titleInput = document.getElementById('task-title');
    if (!titleInput.value.trim()) {
        showError(titleInput, 'Le titre est obligatoire');
        isValid = false;
    } else {
        clearError(titleInput);
    }
    
    // Vérifier la description
    const descriptionInput = document.getElementById('task-description');
    if (!descriptionInput.value.trim()) {
        showError(descriptionInput, 'La description est obligatoire');
        isValid = false;
    } else {
        clearError(descriptionInput);
    }
    
    // Vérifier la date d'échéance
    const dueDateInput = document.getElementById('task-due-date');
    if (!dueDateInput.value) {
        showError(dueDateInput, 'La date d\'échéance est obligatoire');
        isValid = false;
    } else {
        clearError(dueDateInput);
    }
    
    console.log('=== RÉSULTAT DE LA VALIDATION ===', isValid ? 'Valide' : 'Invalide');
    return isValid;
}

// Afficher une erreur
function showError(input, message) {
    // Supprimer l'erreur existante
    clearError(input);
    
    // Ajouter la classe d'erreur
    input.classList.add('error');
    
    // Créer le message d'erreur
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Ajouter le message après l'input
    input.parentNode.insertBefore(errorDiv, input.nextSibling);
}

// Supprimer une erreur
function clearError(input) {
    input.classList.remove('error');
    
    const errorMessage = input.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Gestionnaire de soumission du formulaire
async function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log('=== SOUMISSION DU FORMULAIRE ===');
    
    if (isPopupProcessing) {
        console.log('Traitement en cours, veuillez patienter...');
        return;
    }
    
    // Valider le formulaire
    if (!validateForm()) {
        console.log('=== FORMULAIRE INVALIDE, SOUMISSION ANNULÉE ===');
        return;
    }
    
    try {
        isPopupProcessing = true;
        console.log('=== DÉBUT DU TRAITEMENT DU FORMULAIRE ===');
        
        const form = e.target;
        const taskId = form.dataset.taskId;
        const method = taskId ? 'PUT' : 'POST';
        const url = taskId ? `/api/tasks/${taskId}` : '/api/tasks';
        
        console.log(`=== ENVOI DE LA REQUÊTE ${method} VERS ${url} ===`);
        
        const formData = new FormData(form);
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: formData.get('title'),
                description: formData.get('description'),
                priority: formData.get('priority'),
                status: formData.get('status'),
                dueDate: new Date(formData.get('dueDate')).getTime()
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Une erreur est survenue');
        }
        
        const result = await response.json();
        console.log('=== REQUÊTE RÉUSSIE, FERMETURE DU POPUP ===');
        closePopup();
        
        // Afficher une notification de succès
        if (window.showNotification) {
            window.showNotification(
                taskId ? 'Tâche mise à jour avec succès' : 'Tâche créée avec succès', 
                'success'
            );
        }
        
        // Recharger la page pour mettre à jour l'interface
        console.log('=== RECHARGEMENT DE LA PAGE ===');
        window.location.reload();
        
    } catch (error) {
        console.error('Erreur:', error);
        console.log('=== ERREUR LORS DU TRAITEMENT ===', error.message);
        if (window.showNotification) {
            window.showNotification(error.message || 'Une erreur est survenue', 'error');
        }
    } finally {
        console.log('=== FIN DU TRAITEMENT DU FORMULAIRE ===');
        isPopupProcessing = false;
    }
}

// Fonction pour afficher la popup d'historique
function showHistoryPopup(history) {
    // Vérifier si l'utilisateur est connecté
    if (!checkAuthentication()) {
        return;
    }
    
    const popup = document.getElementById('history-popup');
    const tableBody = document.getElementById('history-table-body');
    
    // Vider le tableau
    tableBody.innerHTML = '';
    
    // Remplir le tableau avec l'historique
    history.forEach(entry => {
        const row = document.createElement('tr');
        
        // Formater la date
        const date = new Date(Number(entry.timestamp));
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${entry.field}</td>
            <td>${entry.oldValue || '-'}</td>
            <td>${entry.newValue || '-'}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Afficher la popup
    popup.classList.add('active');
}

// Fonction pour afficher une notification
function showNotification(message, type = 'info') {
    // Si la fonction existe déjà dans index.js, ne pas la redéfinir
    if (window.showNotification && typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    
    const container = document.getElementById('notifications-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Faire disparaître après 3 secondes
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Rendre les fonctions accessibles globalement
window.openTaskPopup = openTaskPopup;
window.closePopup = closePopup;
