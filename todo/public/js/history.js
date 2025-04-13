// Gestionnaire pour le popup d'historique
if (window.historyPopupInitialized) {
    console.log('Popup d\'historique déjà initialisé, évitement de la double initialisation');
} else {
    // Marquer le popup comme initialisé
    window.historyPopupInitialized = true;
    
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Initialisation du popup d\'historique');
        
        // Éléments DOM
        const historyPopup = document.getElementById('history-popup');
        const closeHistoryBtn = document.getElementById('close-history-popup');
        const historyTableBody = document.getElementById('history-table-body');
        const noHistoryMessage = document.getElementById('no-history-message');
        
        // Gestionnaire pour fermer le popup
        if (closeHistoryBtn) {
            closeHistoryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeHistoryPopup();
            });
        }
        
        // Fermer le popup en cliquant en dehors
        window.addEventListener('click', (e) => {
            if (e.target === historyPopup) {
                closeHistoryPopup();
            }
        });
        
        // Ajouter des gestionnaires d'événements pour les boutons d'historique
        document.querySelectorAll('.history-task').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const taskCard = e.target.closest('.task-card');
                if (!taskCard) return;
                
                const taskId = taskCard.dataset.id;
                if (!taskId) {
                    showNotification('ID de tâche non trouvé', 'error');
                    return;
                }
                
                console.log('Affichage de l\'historique pour la tâche ID:', taskId);
                openHistoryPopup(taskId);
            });
        });
    });
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

// Fonction pour ouvrir le popup d'historique
function openHistoryPopup(taskId) {
    // Vérifier si l'utilisateur est connecté
    if (!checkAuthentication()) {
        return;
    }
    
    const historyPopup = document.getElementById('history-popup');
    const historyTableBody = document.getElementById('history-table-body');
    const noHistoryMessage = document.getElementById('no-history-message');
    
    // Vider le tableau d'historique
    historyTableBody.innerHTML = '';
    
    // Afficher un indicateur de chargement
    historyTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Chargement de l\'historique...</td></tr>';
    
    // Afficher le popup
    historyPopup.classList.add('active');
    
    // Récupérer l'historique de la tâche
    fetch(`/api/tasks/${taskId}/history`)
        .then(response => {
            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, response.statusText);
                if (response.status === 401) {
                    throw new Error('AUTH_ERROR');
                }
                throw new Error(`Erreur lors de la récupération de l'historique (${response.status})`);
            }
            return response.json();
        })
        .then(history => {
            console.log('Historique récupéré:', history);
            
            // Vider le tableau
            historyTableBody.innerHTML = '';
            
            if (history.length === 0) {
                // Aucun historique disponible
                noHistoryMessage.style.display = 'block';
                document.getElementById('history-table').style.display = 'none';
            } else {
                // Afficher l'historique
                noHistoryMessage.style.display = 'none';
                document.getElementById('history-table').style.display = 'table';
                
                history.forEach(entry => {
                    const row = document.createElement('tr');
                    
                    // Formater la date
                    const date = new Date(entry.timestamp);
                    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                    
                    // Traduire le nom du champ
                    let fieldName = entry.field;
                    switch (entry.field) {
                        case 'title':
                            fieldName = 'Titre';
                            break;
                        case 'description':
                            fieldName = 'Description';
                            break;
                        case 'priority':
                            fieldName = 'Priorité';
                            break;
                        case 'status':
                            fieldName = 'Statut';
                            break;
                        case 'dueDate':
                            fieldName = 'Date d\'échéance';
                            // Formater les dates pour une meilleure lisibilité
                            if (entry.oldValue) {
                                const oldDate = new Date(Number(entry.oldValue));
                                entry.oldValue = `${oldDate.toLocaleDateString()} ${oldDate.toLocaleTimeString()}`;
                            }
                            if (entry.newValue) {
                                const newDate = new Date(Number(entry.newValue));
                                entry.newValue = `${newDate.toLocaleDateString()} ${newDate.toLocaleTimeString()}`;
                            }
                            break;
                        case 'assigneeId':
                            fieldName = 'Assigné à';
                            break;
                    }
                    
                    row.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${fieldName}</td>
                        <td>${entry.oldValue || '-'}</td>
                        <td>${entry.newValue}</td>
                    `;
                    
                    historyTableBody.appendChild(row);
                });
            }
        })
        .catch(error => {
            console.error('Erreur détaillée:', error);
            if (error.message === 'AUTH_ERROR') {
                handleAuthError();
            } else {
                historyTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Erreur: ${error.message}</td></tr>`;
                showNotification(`Erreur: ${error.message}`, 'error');
            }
        });
}

// Fonction pour fermer le popup d'historique
function closeHistoryPopup() {
    const historyPopup = document.getElementById('history-popup');
    historyPopup.classList.remove('active');
}

// Fonction pour afficher une notification (si elle n'existe pas déjà dans window)
if (typeof window.showNotification !== 'function') {
    window.showNotification = function(message, type = 'info') {
        const container = document.getElementById('notifications-container');
        
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Supprimer la notification après 3 secondes
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                container.removeChild(notification);
            }, 500);
        }, 3000);
    };
}
