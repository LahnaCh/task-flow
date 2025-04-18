// Variables globales
let isProcessing = false;
let isInitialized = false;
let isEventHandled = false; // Variable pour éviter les doubles événements


//function pour le message de suppression 
function showCustomConfirm(message) {
    return new Promise((resolve) => {
        // Créer l'overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = 1000;
        overlay.style.backdropFilter = 'blur(4px)';

        // Créer la boîte de confirmation
        const box = document.createElement('div');
        box.style.backgroundColor = '#ffffff';
        box.style.padding = '30px 20px';
        box.style.borderRadius = '12px';
        box.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
        box.style.textAlign = 'center';
        box.style.minWidth = '300px';
        box.style.maxWidth = '90%';
        box.style.fontFamily = 'Arial, sans-serif';
        box.style.animation = 'fadeIn 0.3s ease';

        // Message
        const msg = document.createElement('p');
        msg.textContent = message;
        msg.style.marginBottom = '20px';
        msg.style.fontSize = '16px';
        msg.style.color = '#333';

        // Boutons
        const yesBtn = document.createElement('button');
        yesBtn.textContent = 'Oui';
        yesBtn.style.padding = '10px 20px';
        yesBtn.style.margin = '0 10px';
        yesBtn.style.border = 'none';
        yesBtn.style.borderRadius = '5px';
        yesBtn.style.backgroundColor = '#28a745';
        yesBtn.style.color = '#fff';
        yesBtn.style.cursor = 'pointer';
        yesBtn.style.fontSize = '14px';

        const noBtn = document.createElement('button');
        noBtn.textContent = 'Non';
        noBtn.style.padding = '10px 20px';
        noBtn.style.margin = '0 10px';
        noBtn.style.border = 'none';
        noBtn.style.borderRadius = '5px';
        noBtn.style.backgroundColor = '#dc3545';
        noBtn.style.color = '#fff';
        noBtn.style.cursor = 'pointer';
        noBtn.style.fontSize = '14px';

        // Animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            button:hover {
                opacity: 0.9;
            }
        `;
        document.head.appendChild(style);

        // Ajouter tout à la boîte
        box.appendChild(msg);
        box.appendChild(yesBtn);
        box.appendChild(noBtn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // Gestion des clics
        yesBtn.onclick = () => {
            document.body.removeChild(overlay);
            resolve(true);
        };
        noBtn.onclick = () => {
            document.body.removeChild(overlay);
            resolve(false);
        };
    });
}



// Fonction pour gérer les erreurs d'authentification et rediriger si nécessaire
function handleAuthError(error) {
    console.error('Erreur d\'authentification:', error);
    showNotification('Veuillez vous connecter pour effectuer cette action', 'error');
    // Redirection vers la page de connexion après un court délai
    setTimeout(() => {
        window.location.href = '/login';
    }, 1500);
}

// Fonction pour vérifier si une réponse API contient une erreur d'authentification
function checkAuthError(response) {
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('AUTH_ERROR');
        } else if (response.status === 403) {
            throw new Error('FORBIDDEN_ERROR');
        }
        throw new Error('API_ERROR');
    }
    return response.json();
}

// Fonction pour gérer les erreurs d'autorisation (403 Forbidden)
function handleForbiddenError(error) {
    console.error('Erreur d\'autorisation:', error);
    showNotification('Vous n\'êtes pas autorisé à effectuer cette action', 'error');
}

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
        const resetFiltersBtn = document.getElementById('reset-filters-btn');
        
        // Initialiser les compteurs de tâches
        updateTaskCounts();
        
        // Gestionnaire pour le bouton "Nouvelle tâche"
        if (newTaskBtn) {
            newTaskBtn.addEventListener('click', () => {
                try {
                    openTaskPopup();
                } catch (error) {
                    if (error.message === 'AUTH_ERROR') {
                        handleAuthError(error);
                    } else {
                        console.error('Erreur:', error);
                        showNotification('Une erreur est survenue', 'error');
                    }
                }
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
        
        // Gestionnaire pour le bouton de réinitialisation des filtres
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                // Réinitialiser les valeurs des filtres
                if (filterPriority) {
                    filterPriority.selectedIndex = 0;
                    currentPriority = '';
                }
                
                if (sortBy) {
                    sortBy.value = 'createdAt';
                    currentSortBy = 'createdAt';
                }
                
                if (sortOrder) {
                    sortOrder.value = 'asc';
                    currentSortOrder = 'asc';
                }
                
                // Recharger les tâches
                loadTasks();
                
                // Afficher une notification
                showNotification('Filtres réinitialisés', 'info');
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
                .then(response => checkAuthError(response))
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
                    if (error.message === 'AUTH_ERROR') {
                        handleAuthError(error);
                    } else {
                        console.error('Erreur:', error);
                        showNotification('Erreur lors du chargement des tâches', 'error');
                    }
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
            console.log('==== CRÉATION DE CARTE DE TÂCHE ====', {
                taskId: task.id,
                taskData: task,
                createdById: task.createdById,
                creator: task.creator,
                assignee: task.assignee
            });
            
            const card = document.createElement('div');
            card.className = 'task-card';
            card.dataset.id = task.id;
            
            // S'assurer que createdById est un nombre valide
            const creatorId = task.createdById ? parseInt(task.createdById) : null;
            if (isNaN(creatorId)) {
                console.error('Erreur: createdById invalide pour la tâche', task);
            }
            card.dataset.creatorId = creatorId || '';
            
            // Formater la date d'échéance
            const dueDate = new Date(task.dueDate);
            const formattedDueDate = `${dueDate.toLocaleDateString()} à ${dueDate.toLocaleTimeString()}`;
            
            // Obtenir l'utilisateur connecté et son rôle
            const userInfo = document.querySelector('.user-info');
            const isAdmin = userInfo && userInfo.innerHTML.includes('fa-crown');
            const userNameElement = userInfo ? userInfo.textContent.trim() : null;
            
            // Récupérer l'ID de l'utilisateur connecté depuis un attribut data
            const userId = userInfo ? parseInt(userInfo.dataset.userId) : null;
            
            console.log('==== DONNÉES DE L\'UTILISATEUR CONNECTÉ ====', {
                userInfo: userInfo ? userInfo.innerHTML : 'Non trouvé',
                userId: userId,
                userRole: isAdmin ? 'admin' : 'user',
                creatorId: creatorId,
                isCreator: userId === creatorId
            });
            
            // Vérifier si l'utilisateur est le créateur ou un admin
            const isCreator = userId === creatorId;
            const canEditDelete = isAdmin || isCreator;
            
            // Log détaillé pour déboguer les permissions
            console.log('==== PERMISSIONS TÂCHE ====', {
                taskId: task.id, 
                title: task.title,
                creatorId: creatorId,
                creatorName: task.creator?.name,
                loggedUserId: userId,
                isAdmin: isAdmin,
                isCreator: isCreator,
                canEditDelete: canEditDelete,
                typesComparés: `${typeof userId} vs ${typeof creatorId}`,
                valeursComparées: `${userId} === ${creatorId}`
            });
            
            // Créer les boutons d'action en fonction des permissions
            const actionButtons = `
                <button type="button" class="task-action history-task" title="Historique">📋</button>
                ${canEditDelete ? `<button type="button" class="task-action edit-task" title="Modifier">✏️</button>` : ''}
                ${canEditDelete ? `<button type="button" class="task-action delete-task" title="Supprimer">🗑️</button>` : ''}
            `;
            
            // Créer le contenu de la carte
            card.innerHTML = `
                <div class="task-header">
                    <span class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
                    <div class="task-actions">
                        ${actionButtons}
                    </div>
                </div>
                <h3 class="task-title">${task.title}</h3>
                <p class="task-description">${truncateText(task.description, 80)}</p>
                <div class="task-due-date">
                    <span class="due-date-label">Échéance :</span>
                    <span class="due-date-value">${formattedDueDate}</span>
                </div>
                <div class="task-footer">
                    <div class="task-assignee">Assigné à: ${task.assignee ? task.assignee.name : 'Utilisateur par défaut'}</div>
                    <div class="task-creator">Créée par: ${task.creator ? task.creator.name : 'Système'}</div>
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
                    .then(response => checkAuthError(response))
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
                    .then(response => checkAuthError(response))
                    .then(() => {
                        // Recharger les tâches
                        loadTasks();
                        
                        // Afficher une notification
                        showNotification(`Tâche déplacée vers "${newStatus}"`, 'success');
                    })
                    .catch(error => {
                        if (error.message === 'AUTH_ERROR') {
                            handleAuthError(error);
                        } else if (error.message === 'FORBIDDEN_ERROR') {
                            handleForbiddenError(error);
                        } else {
                            console.error('Erreur:', error);
                            showNotification('Erreur lors du déplacement de la tâche', 'error');
                        }
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
            
            // Récupérer la tâche complète depuis l'API pour avoir les bonnes données
            fetch(`/api/tasks/${taskId}`)
                .then(response => checkAuthError(response))
                .then(task => {
                    // Vérifier les permissions avec les données complètes de la tâche
                    const creatorId = task.createdById ? parseInt(task.createdById) : null;
                    
                    // Obtenir l'utilisateur connecté et son rôle
                    const userInfo = document.querySelector('.user-info');
                    const isAdmin = userInfo && userInfo.innerHTML.includes('fa-crown');
                    const userId = userInfo ? parseInt(userInfo.dataset.userId) : null;
                    
                    // Vérifier si l'utilisateur est le créateur ou un admin
                    const isCreator = userId === creatorId;
                    const canEdit = isAdmin || isCreator;
                    
                    console.log('==== DÉTAILS DE L\'UTILISATEUR ET DE LA TÂCHE ====', {
                        userInfo: userInfo ? userInfo.innerHTML : 'Non trouvé',
                        userId: userId,
                        userRole: isAdmin ? 'admin' : 'user',
                        taskId: taskId,
                        taskCreatorId: creatorId,
                        isCreator: isCreator,
                        isAdmin: isAdmin,
                        canEdit: canEdit
                    });
                    
                    // Si l'utilisateur n'a pas le droit d'éditer, afficher une notification et ne pas ouvrir le popup
                    if (!canEdit) {
                        showNotification('Vous n\'êtes pas autorisé à modifier cette tâche. Seul le créateur ou un administrateur peut la modifier.', 'error');
                        return;
                    }
                    
                    // Ouvrir le popup d'édition
                    openTaskPopup(task);
                })
                .catch(error => {
                    console.error('Erreur lors de la récupération des détails de la tâche:', error);
                    showNotification('Erreur lors de la récupération des détails de la tâche', 'error');
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
            
            // Récupérer la tâche complète depuis l'API pour avoir les bonnes données
            fetch(`/api/tasks/${taskId}`)
                .then(response => checkAuthError(response))
                .then(task => {
                    // Vérifier les permissions avec les données complètes de la tâche
                    const creatorId = task.createdById ? parseInt(task.createdById) : null;
                    
                    // Obtenir l'utilisateur connecté et son rôle
                    const userInfo = document.querySelector('.user-info');
                    const isAdmin = userInfo && userInfo.innerHTML.includes('fa-crown');
                    const userId = userInfo ? parseInt(userInfo.dataset.userId) : null;
                    
                    // Vérifier si l'utilisateur est le créateur ou un admin
                    const isCreator = userId === creatorId;
                    const canDelete = isAdmin || isCreator;
                    
                    // Si l'utilisateur n'a pas le droit de supprimer, afficher une notification
                    if (!canDelete) {
                        showNotification('Vous n\'êtes pas autorisé à supprimer cette tâche. Seul le créateur ou un administrateur peut la supprimer.', 'error');
                        return;
                    }
                    
                    // Demander confirmation avant de supprimer avec le popup personnalisé
                    showCustomConfirm(`Êtes-vous sûr de vouloir supprimer la tâche "${task.title}" ?`).then((confirmed) => {
                        if (confirmed) {
                            // Supprimer la tâche
                            fetch(`/api/tasks/${taskId}`, {
                                method: 'DELETE'
                            })
                            .then(response => checkAuthError(response))
                            .then(result => {
                                showNotification(`Tâche "${task.title}" supprimée avec succès!`, 'success');
                                // Recharger les tâches
                                loadTasks();
                            })
                            .catch(error => {
                                console.error('Erreur lors de la suppression de la tâche:', error);
                                showNotification('Erreur lors de la suppression de la tâche', 'error');
                            });
                        }
                    });
                })
                .catch(error => {
                    console.error('Erreur lors de la récupération des détails de la tâche:', error);
                    showNotification('Erreur lors de la récupération des détails de la tâche', 'error');
                });
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
