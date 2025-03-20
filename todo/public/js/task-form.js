// Fonctions pour la gestion du formulaire de tâche
document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const taskForm = document.getElementById('task-form');
    const dueDateInput = document.getElementById('due-date');
    const cancelButton = document.getElementById('cancel-btn');
    const deleteButton = document.getElementById('delete-btn');
    
    // Initialiser le sélecteur de date
    if (dueDateInput) {
        // Convertir la date UNIX en format local pour l'affichage
        if (dueDateInput.dataset.timestamp) {
            const timestamp = parseInt(dueDateInput.dataset.timestamp);
            if (!isNaN(timestamp)) {
                const date = new Date(timestamp);
                const localDate = date.toISOString().split('T')[0];
                dueDateInput.value = localDate;
            }
        }
        
        // Définir la date minimale à aujourd'hui
        const today = new Date();
        const formattedToday = today.toISOString().split('T')[0];
        dueDateInput.min = formattedToday;
    }
    
    // Gestion du formulaire
    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Valider le formulaire
            if (!validateForm()) {
                return;
            }
            
            // Convertir la date en timestamp UNIX
            if (dueDateInput && dueDateInput.value) {
                const dateValue = new Date(dueDateInput.value);
                const timestamp = dateValue.getTime();
                
                // Créer un champ caché pour le timestamp
                const timestampInput = document.createElement('input');
                timestampInput.type = 'hidden';
                timestampInput.name = 'dueDate';
                timestampInput.value = timestamp;
                taskForm.appendChild(timestampInput);
            }
            
            // Soumettre le formulaire
            taskForm.submit();
        });
    }
    
    // Validation du formulaire
    function validateForm() {
        const titleInput = document.getElementById('title');
        const descriptionInput = document.getElementById('description');
        const priorityInput = document.getElementById('priority');
        const statusInput = document.getElementById('status');
        
        let isValid = true;
        
        // Réinitialiser les messages d'erreur
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // Valider le titre
        if (!titleInput.value.trim()) {
            showError(titleInput, 'Le titre est requis');
            isValid = false;
        }
        
        // Valider la description
        if (!descriptionInput.value.trim()) {
            showError(descriptionInput, 'La description est requise');
            isValid = false;
        }
        
        // Valider la priorité
        if (!priorityInput.value) {
            showError(priorityInput, 'La priorité est requise');
            isValid = false;
        }
        
        // Valider le statut
        if (!statusInput.value) {
            showError(statusInput, 'Le statut est requis');
            isValid = false;
        }
        
        return isValid;
    }
    
    // Afficher un message d'erreur
    function showError(element, message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        element.classList.add('error');
        element.parentNode.appendChild(errorElement);
        
        // Supprimer l'erreur lorsque l'utilisateur corrige
        element.addEventListener('input', () => {
            element.classList.remove('error');
            const error = element.parentNode.querySelector('.error-message');
            if (error) {
                error.remove();
            }
        });
    }
    
    // Gestion du bouton d'annulation
    if (cancelButton) {
        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back();
        });
    }
    
    // Gestion du bouton de suppression
    if (deleteButton) {
        deleteButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.')) {
                return;
            }
            
            const taskId = deleteButton.dataset.id;
            
            try {
                const response = await fetch(`/tasks/${taskId}`, {
                    method: 'DELETE',
                });
                
                if (response.ok) {
                    window.location.href = '/';
                } else {
                    const error = await response.json();
                    alert(error.message || 'Une erreur est survenue lors de la suppression de la tâche.');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression de la tâche:', error);
                alert('Une erreur est survenue lors de la suppression de la tâche.');
            }
        });
    }
});
