// Fonctions pour la gestion de la page de détails des tâches
document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const editButton = document.getElementById('edit-task-btn');
    const deleteButton = document.getElementById('delete-task-btn');
    const changeStatusButtons = document.querySelectorAll('.change-status-btn');
    
    // Gestion du bouton d'édition
    if (editButton) {
        editButton.addEventListener('click', () => {
            const taskId = editButton.dataset.id;
            window.location.href = `/tasks/${taskId}/edit`;
        });
    }
    
    // Gestion du bouton de suppression
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
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
                    showNotification('Erreur', error.message || 'Une erreur est survenue lors de la suppression de la tâche.', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression de la tâche:', error);
                showNotification('Erreur', 'Une erreur est survenue lors de la suppression de la tâche.', 'error');
            }
        });
    }
    
    // Gestion des boutons de changement de statut
    if (changeStatusButtons) {
        changeStatusButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const taskId = button.dataset.id;
                const newStatus = button.dataset.status;
                
                try {
                    const response = await fetch(`/tasks/${taskId}/status`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ status: newStatus }),
                    });
                    
                    if (response.ok) {
                        // Recharger la page pour afficher les changements
                        window.location.reload();
                    } else {
                        const error = await response.json();
                        showNotification('Erreur', error.message || 'Une erreur est survenue lors de la mise à jour du statut.', 'error');
                    }
                } catch (error) {
                    console.error('Erreur lors de la mise à jour du statut:', error);
                    showNotification('Erreur', 'Une erreur est survenue lors de la mise à jour du statut.', 'error');
                }
            });
        });
    }
    
    // Formater les dates
    function formatDates() {
        const dateElements = document.querySelectorAll('[data-timestamp]');
        
        dateElements.forEach(element => {
            const timestamp = parseInt(element.dataset.timestamp);
            if (!isNaN(timestamp)) {
                const date = new Date(timestamp);
                let formattedDate;
                
                if (element.dataset.format === 'relative') {
                    formattedDate = getRelativeTimeString(date);
                } else {
                    formattedDate = formatDateToLocale(date);
                }
                
                element.textContent = formattedDate;
            }
        });
    }
    
    // Formater une date en format local
    function formatDateToLocale(date) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleDateString('fr-FR', options);
    }
    
    // Obtenir une chaîne de temps relative
    function getRelativeTimeString(date) {
        const now = new Date();
        const diffMs = date - now;
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffSec / 60);
        const diffHour = Math.round(diffMin / 60);
        const diffDay = Math.round(diffHour / 24);
        
        // Si la date est passée
        if (diffMs < 0) {
            const absDiffSec = Math.abs(diffSec);
            const absDiffMin = Math.abs(diffMin);
            const absDiffHour = Math.abs(diffHour);
            const absDiffDay = Math.abs(diffDay);
            
            if (absDiffSec < 60) return 'il y a quelques secondes';
            if (absDiffMin < 60) return `il y a ${absDiffMin} minute${absDiffMin > 1 ? 's' : ''}`;
            if (absDiffHour < 24) return `il y a ${absDiffHour} heure${absDiffHour > 1 ? 's' : ''}`;
            if (absDiffDay < 7) return `il y a ${absDiffDay} jour${absDiffDay > 1 ? 's' : ''}`;
            
            return formatDateToLocale(date);
        }
        
        // Si la date est future
        if (diffSec < 60) return 'dans quelques secondes';
        if (diffMin < 60) return `dans ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
        if (diffHour < 24) return `dans ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
        if (diffDay < 7) return `dans ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
        
        return formatDateToLocale(date);
    }
    
    // Vérifier si une date est dépassée
    function checkPastDue() {
        const dueDateElement = document.querySelector('.due-date');
        if (dueDateElement) {
            const timestamp = parseInt(dueDateElement.dataset.timestamp);
            if (!isNaN(timestamp)) {
                const dueDate = new Date(timestamp);
                const now = new Date();
                
                if (dueDate < now) {
                    dueDateElement.classList.add('past-due');
                }
            }
        }
    }
    
    // Fonction pour afficher une notification
    function showNotification(title, message, type = 'info') {
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Contenu de la notification
        notification.innerHTML = `
            <div class="notification-header">
                <strong>${title}</strong>
                <button class="close-notification">&times;</button>
            </div>
            <div class="notification-body">
                ${message}
            </div>
        `;
        
        // Ajouter la notification au conteneur
        const notificationsContainer = document.getElementById('notifications-container');
        if (!notificationsContainer) {
            // Créer le conteneur s'il n'existe pas
            const container = document.createElement('div');
            container.id = 'notifications-container';
            document.body.appendChild(container);
            container.appendChild(notification);
        } else {
            notificationsContainer.appendChild(notification);
        }
        
        // Ajouter un gestionnaire pour fermer la notification
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });
        
        // Supprimer automatiquement après 5 secondes
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    // Initialiser les fonctions
    formatDates();
    checkPastDue();
});
