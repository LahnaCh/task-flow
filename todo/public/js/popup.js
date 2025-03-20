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

// Fonction pour ouvrir le popup
function openTaskPopup(task = null) {
    if (isPopupProcessing) {
        console.log('Traitement en cours, veuillez patienter...');
        return;
    }
    
    console.log('=== OUVERTURE DU POPUP ===', task ? 'Mode édition' : 'Mode création');
    
    const popup = document.getElementById('task-popup');
    const form = document.getElementById('task-form');
    const titleInput = document.getElementById('task-title');
    const descriptionInput = document.getElementById('task-description');
    const prioritySelect = document.getElementById('task-priority');
    const statusSelect = document.getElementById('task-status');
    const dueDateInput = document.getElementById('task-due-date');
    const submitBtn = document.getElementById('submit-task');
    const popupTitle = document.getElementById('popup-title');
    
    if (!popup || !form || !titleInput || !descriptionInput || !prioritySelect || 
        !statusSelect || !dueDateInput || !submitBtn || !popupTitle) {
        console.error('Éléments du formulaire manquants');
        return;
    }
    
    // Réinitialiser le formulaire
    form.reset();
    
    // Si on édite une tâche existante
    if (task) {
        popupTitle.textContent = 'Modifier la tâche';
        submitBtn.textContent = 'Modifier';
        form.dataset.taskId = task.id;
        
        titleInput.value = task.title;
        descriptionInput.value = task.description;
        prioritySelect.value = task.priority;
        statusSelect.value = task.status;
        
        // Formatage de la date pour l'input datetime-local
        if (task.dueDate) {
            const dueDate = new Date(parseInt(task.dueDate));
            const year = dueDate.getFullYear();
            const month = String(dueDate.getMonth() + 1).padStart(2, '0');
            const day = String(dueDate.getDate()).padStart(2, '0');
            const hours = String(dueDate.getHours()).padStart(2, '0');
            const minutes = String(dueDate.getMinutes()).padStart(2, '0');
            
            dueDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
    } else {
        popupTitle.textContent = 'Nouvelle tâche';
        submitBtn.textContent = 'Créer';
        form.dataset.taskId = '';
    }
    
    popup.style.display = 'block';
}

// Fonction pour fermer le popup
function closePopup() {
    console.log('=== FERMETURE DU POPUP ===');
    
    const popup = document.getElementById('task-popup');
    const form = document.getElementById('task-form');
    
    if (popup && form) {
        popup.style.display = 'none';
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

// Rendre les fonctions accessibles globalement
window.openTaskPopup = openTaskPopup;
window.closePopup = closePopup;
