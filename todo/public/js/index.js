// Variables globales
let isProcessing = false;
let isInitialized = false;
let isEventHandled = false; // Variable pour éviter les doubles événements

// Vérifier si l'application a déjà été initialisée
if (window.todoAppInitialized) {
    console.log('Application déjà initialisée, évitement de la double initialisation');
} else {
    // Marquer l'application comme initialisée
    window.todoAppInitialized = true;
    
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Initialisation de l\'application');
        
        // Variables pour le filtrage et le tri
        let currentPriority = '';
        let currentSortBy = 'createdAt';
        let currentSortOrder = 'asc';
        
        // Éléments DOM
        const newTaskBtn = document.getElementById('new-task-btn');
        const filterPriority = document.getElementById('filter-priority');
        const sortBy = document.getElementById('sort-by');
        const sortOrder = document.getElementById('sort-order');
        
        // Initialiser les compteurs de tâches
        updateTaskCounts();
        
        // Gestionnaire pour le bouton "Nouvelle tâche"
        if (newTaskBtn) {
            newTaskBtn.addEventListener('click', () => {
                openTaskPopup();
            });
        }
        
        // Gestionnaire pour le filtre de priorité
        if (filterPriority) {
            filterPriority.addEventListener('change', () => {
                currentPriority = filterPriority.value;
                loadTasks();
            });
        }
        
        // Gestionnaire pour le tri
        if (sortBy) {
            sortBy.addEventListener('change', () => {
                currentSortBy = sortBy.value;
                loadTasks();
            });
        }
        
        // Gestionnaire pour l'ordre de tri
        if (sortOrder) {
            sortOrder.addEventListener('change', () => {
                currentSortOrder = sortOrder.value;
                loadTasks();
            });
        }
        
        // Gestionnaire pour les boutons de déplacement de tâche
        document.querySelectorAll('.move-task').forEach(button => {
            button.addEventListener('click', handleMoveTask);
        });
        
        // Gestionnaire pour les boutons de modification
        document.querySelectorAll('.edit-task').forEach(button => {
            button.addEventListener('click', handleEditTask);
        });
        
        // Gestionnaire pour les boutons de suppression
        document.querySelectorAll('.delete-task').forEach(button => {
            button.addEventListener('click', handleDeleteTask);
        });
        
        // Fonction pour charger les tâches avec filtres et tri
        function loadTasks() {
            // Construire l'URL avec les paramètres de filtrage et de tri
            let url = '/api/tasks';
            const params = new URLSearchParams();
            
            if (currentPriority) {
                params.append('priority', currentPriority);
            }
            
            if (currentSortBy) {
                params.append('sortBy', currentSortBy);
            }
            
            if (currentSortOrder) {
                params.append('sortOrder', currentSortOrder);
            }
            
            if (params.toString()) {
                url += '?' + params.toString();
            }
            
            // Récupérer les tâches filtrées et triées
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erreur lors de la récupération des tâches');
                    }
                    return response.json();
                })
                .then(tasks => {
                    // Regrouper les tâches par statut
                    const tasksByStatus = {
                        'À faire': [],
                        'En cours': [],
                        'En révision': [],
                        'Terminée': []
                    };
                    
                    tasks.forEach(task => {
                        if (tasksByStatus[task.status]) {
                            tasksByStatus[task.status].push(task);
                        }
                    });
                    
                    // Mettre à jour l'affichage des tâches
                    updateTaskDisplay(tasksByStatus);
                    
                    // Mettre à jour les compteurs
                    updateTaskCounts();
                    
                    // Réattacher les gestionnaires d'événements
                    attachEventHandlers();
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    showNotification('Erreur lors du chargement des tâches', 'error');
                });
        }
        
        // Fonction pour mettre à jour l'affichage des tâches
        function updateTaskDisplay(tasksByStatus) {
            // Mettre à jour chaque colonne
            for (const [status, tasks] of Object.entries(tasksByStatus)) {
                const columnId = getColumnIdFromStatus(status);
                const column = document.getElementById(columnId);
                
                if (column) {
                    // Vider la colonne
                    column.innerHTML = '';
                    
                    // Ajouter les tâches
                    tasks.forEach(task => {
                        column.appendChild(createTaskCard(task));
                    });
                }
            }
        }
        
        // Fonction pour créer une carte de tâche
        function createTaskCard(task) {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.dataset.id = task.id;
            
            // Formater la date d'échéance
            const dueDate = new Date(task.dueDate);
            const formattedDueDate = `${dueDate.toLocaleDateString()} à ${dueDate.toLocaleTimeString()}`;
            
            // Créer le contenu de la carte
            card.innerHTML = `
                <div class="task-header">
                    <span class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
                    <div class="task-actions">
                        <button type="button" class="task-action history-task" title="Historique">📋</button>
                        <button type="button" class="task-action edit-task" title="Modifier">✏️</button>
                        <button type="button" class="task-action delete-task" title="Supprimer">🗑️</button>
                    </div>
                </div>
                <h3 class="task-title">${task.title}</h3>
                <p class="task-description">${truncateText(task.description, 80)}</p>
                <div class="task-due-date">
                    <span class="due-date-label">Échéance :</span>
                    <span class="due-date-value">${formattedDueDate}</span>
                </div>
                <div class="task-footer">
                    <div class="task-assignee">Assigné à: ${task.assignee.name}</div>
                    <div class="task-status-actions">
                        ${getStatusButtons(task.status, task.id)}
                    </div>
                </div>
            `;
            
            return card;
        }
        
        // Fonction pour obtenir les boutons de statut en fonction du statut actuel
        function getStatusButtons(status, taskId) {
            switch (status) {
                case 'À faire':
                    return `<button class="move-task" data-id="${taskId}" data-direction="right">→</button>`;
                case 'En cours':
                    return `
                        <button class="move-task" data-id="${taskId}" data-direction="left">←</button>
                        <button class="move-task" data-id="${taskId}" data-direction="right">→</button>
                    `;
                case 'En révision':
                    return `
                        <button class="move-task" data-id="${taskId}" data-direction="left">←</button>
                        <button class="move-task" data-id="${taskId}" data-direction="right">→</button>
                    `;
                case 'Terminée':
                    return `<button class="move-task" data-id="${taskId}" data-direction="left">←</button>`;
                default:
                    return '';
            }
        }
        
        // Fonction pour obtenir l'ID de colonne à partir du statut
        function getColumnIdFromStatus(status) {
            switch (status) {
                case 'À faire':
                    return 'todo-tasks';
                case 'En cours':
                    return 'in-progress-tasks';
                case 'En révision':
                    return 'review-tasks';
                case 'Terminée':
                    return 'done-tasks';
                default:
                    return '';
            }
        }
        
        // Fonction pour tronquer un texte
        function truncateText(text, maxLength) {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        }
        
        // Fonction pour attacher les gestionnaires d'événements aux éléments dynamiques
        function attachEventHandlers() {
            // Gestionnaire pour les boutons de déplacement de tâche
            document.querySelectorAll('.move-task').forEach(button => {
                button.removeEventListener('click', handleMoveTask);
                button.addEventListener('click', handleMoveTask);
            });
            
            // Gestionnaire pour les boutons de modification
            document.querySelectorAll('.edit-task').forEach(button => {
                button.removeEventListener('click', handleEditTask);
                button.addEventListener('click', handleEditTask);
            });
            
            // Gestionnaire pour les boutons de suppression
            document.querySelectorAll('.delete-task').forEach(button => {
                button.removeEventListener('click', handleDeleteTask);
                button.addEventListener('click', handleDeleteTask);
            });
            
            // Gestionnaire pour les boutons d'historique
            document.querySelectorAll('.history-task').forEach(button => {
                button.removeEventListener('click', handleHistoryTask);
                button.addEventListener('click', handleHistoryTask);
            });
        }
        
        // Gestionnaire pour le déplacement de tâche
        function handleMoveTask(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const taskId = e.target.dataset.id;
            const direction = e.target.dataset.direction;
            const taskCard = e.target.closest('.task-card');
            const currentStatus = taskCard.closest('.task-column').dataset.status;
            
            let newStatus;
            
            // Déterminer le nouveau statut en fonction de la direction
            if (direction === 'right') {
                switch (currentStatus) {
                    case 'À faire':
                        newStatus = 'En cours';
                        break;
                    case 'En cours':
                        newStatus = 'En révision';
                        break;
                    case 'En révision':
                        newStatus = 'Terminée';
                        break;
                }
            } else if (direction === 'left') {
                switch (currentStatus) {
                    case 'En cours':
                        newStatus = 'À faire';
                        break;
                    case 'En révision':
                        newStatus = 'En cours';
                        break;
                    case 'Terminée':
                        newStatus = 'En révision';
                        break;
                }
            }
            
            if (newStatus) {
                // Récupérer les données actuelles de la tâche
                fetch(`/api/tasks/${taskId}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erreur lors de la récupération de la tâche');
                        }
                        return response.json();
                    })
                    .then(task => {
                        // Mettre à jour le statut
                        return fetch(`/api/tasks/${taskId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                ...task,
                                status: newStatus
                            })
                        });
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erreur lors de la mise à jour de la tâche');
                        }
                        return response.json();
                    })
                    .then(() => {
                        // Recharger les tâches
                        loadTasks();
                        showNotification(`Tâche déplacée vers "${newStatus}"`, 'success');
                    })
                    .catch(error => {
                        console.error('Erreur:', error);
                        showNotification('Erreur lors du déplacement de la tâche', 'error');
                    });
            }
        }
        
        // Gestionnaire pour la modification de tâche
        function handleEditTask(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const taskCard = e.target.closest('.task-card');
            if (!taskCard) return;
            
            const taskId = taskCard.dataset.id;
            if (!taskId) {
                showNotification('ID de tâche non trouvé', 'error');
                return;
            }
            
            console.log('Édition de la tâche avec ID:', taskId);
            
            // Récupérer les données de la tâche
            fetch(`/api/tasks/${taskId}`)
                .then(response => {
                    if (!response.ok) {
                        console.error('Erreur HTTP:', response.status, response.statusText);
                        throw new Error(`Erreur lors de la récupération de la tâche (${response.status})`);
                    }
                    return response.json();
                })
                .then(task => {
                    console.log('Tâche récupérée:', task);
                    // Ouvrir le popup avec les données de la tâche
                    openTaskPopup(task);
                })
                .catch(error => {
                    console.error('Erreur détaillée:', error);
                    showNotification(`Erreur: ${error.message}`, 'error');
                });
        }
        
        // Gestionnaire pour la suppression de tâche
        function handleDeleteTask(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const taskCard = e.target.closest('.task-card');
            if (!taskCard) return;
            
            const taskId = taskCard.dataset.id;
            if (!taskId) {
                showNotification('ID de tâche non trouvé', 'error');
                return;
            }
            
            console.log('Suppression de la tâche avec ID:', taskId);
            
            if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
                fetch(`/api/tasks/${taskId}`, {
                    method: 'DELETE'
                })
                    .then(response => {
                        if (!response.ok) {
                            console.error('Erreur HTTP:', response.status, response.statusText);
                            throw new Error(`Erreur lors de la suppression de la tâche (${response.status})`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Tâche supprimée:', data);
                        // Recharger les tâches
                        loadTasks();
                        showNotification('Tâche supprimée avec succès', 'success');
                    })
                    .catch(error => {
                        console.error('Erreur détaillée:', error);
                        showNotification(`Erreur: ${error.message}`, 'error');
                    });
            }
        }
        
        // Gestionnaire pour l'historique de tâche
        function handleHistoryTask(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const taskId = e.target.closest('.task-card').dataset.id;
            openHistoryPopup(taskId);
        }
        
        // Fonction pour mettre à jour les compteurs de tâches
        function updateTaskCounts() {
            const todoCount = document.getElementById('todo-count');
            const inProgressCount = document.getElementById('in-progress-count');
            const reviewCount = document.getElementById('review-count');
            const doneCount = document.getElementById('done-count');
            
            if (todoCount) {
                todoCount.textContent = document.querySelectorAll('#todo-tasks .task-card').length;
            }
            
            if (inProgressCount) {
                inProgressCount.textContent = document.querySelectorAll('#in-progress-tasks .task-card').length;
            }
            
            if (reviewCount) {
                reviewCount.textContent = document.querySelectorAll('#review-tasks .task-card').length;
            }
            
            if (doneCount) {
                doneCount.textContent = document.querySelectorAll('#done-tasks .task-card').length;
            }
        }
    });
}

// Fonction pour afficher une notification
function showNotification(message, type = 'info') {
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
}
