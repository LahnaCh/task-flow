import { Router } from "express";
import { getTasks, getTaskById, createTask, updateTask, deleteTask, getTaskHistory } from "./model/task.js";
import passport from "passport";
import { createUser } from "./model/user.js";
import { PrismaClient } from '@prisma/client';
import { ensureAuthenticated } from "./helpers.js";

const router = Router();
const prisma = new PrismaClient();

//Definition des routes

// Route pour la page d'accueil - affichage des tâches par statut
router.get("/", async (request, response) => {
    try {
        const tasks = await getTasks();
        response.render("index", {
            titre: "Tableau de bord",
            styles: ["./css/style.css", "./css/index.css", "./css/popup.css", "./css/notifications.css"],
            scripts: ["./js/index.js", "./js/popup.js"],
            tasks: tasks,
            user: request.user
        });
    } catch (error) {
        console.error("Erreur lors du chargement des tâches:", error);
        response.status(500).render("error", {
            titre: "Erreur",
            message: "Une erreur est survenue lors du chargement des tâches.",
            user: request.user
        });
    }
});

// API Routes - Toutes les routes API sont protégées par l'authentification

// Route pour obtenir la liste des tâches avec filtres optionnels
router.get("/api/tasks", ensureAuthenticated, async (request, response) => {
    try {
        const tasks = await getTasks();
        
        console.log('==== DONNÉES DES TÂCHES ENVOYÉES ====', {
            tasks: tasks.map(task => ({
                id: task.id,
                title: task.title,
                createdById: task.createdById,
                creator: task.creator,
                assignee: task.assignee
            })),
            user: {
                id: request.user.id,
                name: request.user.name,
                role: request.user.role
            }
        });
        
        return response.json(tasks);
    } catch (error) {
        console.error("Erreur lors de la récupération des tâches:", error);
        return response.status(500).json({
            error: "Une erreur est survenue lors de la récupération des tâches."
        });
    }
});

// Route pour obtenir une tâche spécifique
router.get("/api/tasks/:id", ensureAuthenticated, async (request, response) => {
    try {
        const taskId = parseInt(request.params.id);
        
        if (isNaN(taskId)) {
            return response.status(400).json({
                error: "L'ID de la tâche doit être un nombre."
            });
        }
        
        const task = await getTaskById(taskId);
        
        if (!task) {
            return response.status(404).json({
                error: `La tâche avec l'ID ${taskId} n'existe pas ou a été supprimée.`
            });
        }
        
        return response.status(200).json(task);
    } catch (error) {
        console.error("Erreur lors de la récupération de la tâche:", error);
        return response.status(500).json({
            error: "Une erreur est survenue lors de la récupération de la tâche."
        });
    }
});

// Route pour créer une nouvelle tâche
router.post("/api/tasks", ensureAuthenticated, async (request, response) => {
    try {
        const { title, description, priority, status, dueDate } = request.body;
        
        // Valider les champs requis
        if (!title || !description || !priority || !status || !dueDate) {
            return response.status(400).json({
                error: "Tous les champs sont obligatoires (titre, description, priorité, statut et date d'échéance)."
            });
        }
        
        console.log("Création de tâche par l'utilisateur:", request.user.id, request.user.name);
        
        // Ajouter l'id du créateur (l'utilisateur connecté)
        const taskData = {
            ...request.body,
            assigneeId: request.user.id, // L'utilisateur connecté est assigné à la tâche
            createdById: request.user.id // L'utilisateur connecté est le créateur
        };
        
        const task = await createTask(taskData);
        return response.status(201).json(task);
    } catch (error) {
        console.error("Erreur lors de la création de la tâche:", error);
        return response.status(500).json({
            error: "Une erreur est survenue lors de la création de la tâche."
        });
    }
});

// Route pour mettre à jour une tâche
router.put("/api/tasks/:id", ensureAuthenticated, async (request, response) => {
    try {
        const taskId = parseInt(request.params.id);
        const { title, description, priority, status, dueDate } = request.body;
        
        if (isNaN(taskId)) {
            return response.status(400).json({
                error: "L'ID de la tâche doit être un nombre."
            });
        }
        
        // Valider les champs requis
        if (!title || !description || !priority || !status || !dueDate) {
            return response.status(400).json({
                error: "Tous les champs sont obligatoires (titre, description, priorité, statut et date d'échéance)."
            });
        }
        
        try {
            // Vérifier si l'utilisateur peut modifier cette tâche
            const existingTask = await getTaskById(taskId);
            if (!existingTask) {
                return response.status(404).json({
                    error: `La tâche avec l'ID ${taskId} n'existe pas.`
                });
            }
            
            // Vérifier si l'utilisateur est le créateur ou un admin
            const taskCreatorId = existingTask.createdById ? parseInt(existingTask.createdById) : null;
            const requestUserId = request.user.id ? parseInt(request.user.id) : null;

            const isCreator = taskCreatorId === requestUserId;
            const isAdmin = request.user.role === 'admin';
            const canEdit = isCreator || isAdmin;

            console.log("==== VÉRIFICATION DES PERMISSIONS D'ÉDITION ====", {
                taskId,
                taskTitle: existingTask.title,
                taskCreatorId,
                requestUserId,
                userRole: request.user.role,
                userName: request.user.name,
                creatorName: existingTask.creator?.name,
                isCreator,
                isAdmin,
                canEdit,
                typesComparés: `${typeof taskCreatorId} vs ${typeof requestUserId}`,
                valeursComparées: `${taskCreatorId} === ${requestUserId}`
            });

            if (!canEdit) {
                return response.status(403).json({
                    error: "Vous n'êtes pas autorisé à modifier cette tâche. Seul le créateur ou un administrateur peut la modifier."
                });
            }
            
            const task = await updateTask(taskId, request.body);
            return response.status(200).json(task);
        } catch (error) {
            if (error.message.includes("n'existe pas")) {
                return response.status(404).json({
                    error: error.message
                });
            }
            throw error;
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la tâche:", error);
        return response.status(500).json({
            error: "Une erreur est survenue lors de la mise à jour de la tâche."
        });
    }
});

// Route pour supprimer une tâche
router.delete("/api/tasks/:id", ensureAuthenticated, async (request, response) => {
    try {
        const taskId = parseInt(request.params.id);
        
        if (isNaN(taskId)) {
            return response.status(400).json({
                error: "L'ID de la tâche doit être un nombre."
            });
        }
        
        try {
            // Vérifier si l'utilisateur peut supprimer cette tâche
            const existingTask = await getTaskById(taskId);
            if (!existingTask) {
                return response.status(404).json({
                    error: `La tâche avec l'ID ${taskId} n'existe pas.`
                });
            }
            
            // Vérifier si l'utilisateur est le créateur ou un admin
            const taskCreatorId = existingTask.createdById ? parseInt(existingTask.createdById) : null;
            const requestUserId = request.user.id ? parseInt(request.user.id) : null;

            const isCreator = taskCreatorId === requestUserId;
            const isAdmin = request.user.role === 'admin';
            const canDelete = isCreator || isAdmin;

            console.log("==== VÉRIFICATION DES PERMISSIONS DE SUPPRESSION ====", {
                taskId,
                taskTitle: existingTask.title,
                taskCreatorId,
                requestUserId,
                userRole: request.user.role,
                userName: request.user.name,
                creatorName: existingTask.creator?.name,
                isCreator,
                isAdmin,
                canDelete,
                typesComparés: `${typeof taskCreatorId} vs ${typeof requestUserId}`,
                valeursComparées: `${taskCreatorId} === ${requestUserId}`
            });

            if (!canDelete) {
                return response.status(403).json({
                    error: "Vous n'êtes pas autorisé à supprimer cette tâche. Seul le créateur ou un administrateur peut la supprimer."
                });
            }
            
            const deletedTask = await deleteTask(taskId);
            return response.status(200).json(deletedTask);
        } catch (error) {
            if (error.message.includes("n'existe pas")) {
                return response.status(404).json({
                    error: error.message
                });
            }
            throw error;
        }
    } catch (error) {
        console.error("Erreur lors de la suppression de la tâche:", error);
        return response.status(500).json({
            error: "Une erreur est survenue lors de la suppression de la tâche."
        });
    }
});

// Route pour obtenir l'historique d'une tâche
router.get("/api/tasks/:id/history", ensureAuthenticated, async (request, response) => {
    try {
        const taskId = parseInt(request.params.id);
        
        if (isNaN(taskId)) {
            return response.status(400).json({
                error: "L'ID de la tâche doit être un nombre."
            });
        }
        
        const history = await getTaskHistory(taskId);
        return response.status(200).json(history);
    } catch (error) {
        console.error("Erreur lors de la récupération de l'historique:", error);
        return response.status(500).json({
            error: "Une erreur est survenue lors de la récupération de l'historique."
        });
    }
});

// Route pour obtenir l'historique de toutes les tâches
router.get("/api/tasks/history", ensureAuthenticated, async (request, response) => {
    try {
        const history = await getTaskHistory();
        return response.status(200).json(history);
    } catch (error) {
        console.error("Erreur lors de la récupération de l'historique:", error);
        return response.status(500).json({
            error: "Une erreur est survenue lors de la récupération de l'historique."
        });
    }
});

// Routes d'authentification - Pages

// Route pour afficher la page de connexion
router.get("/login", (request, response) => {
    const flashMessage = request.session.flashMessage;
    request.session.flashMessage = null; // Effacer le message après l'avoir récupéré
    
    response.render("login", {
        titre: "Connexion",
        styles: ["./css/style.css", "./css/auth.css"],
        user: request.user,
        flashMessage: flashMessage
    });
});

// Route pour afficher la page d'inscription
router.get("/register", (request, response) => {
    response.render("register", {
        titre: "Inscription",
        styles: ["./css/style.css", "./css/auth.css"],
        user: request.user
    });
});

// Route de déconnexion
router.get("/logout", (request, response, next) => {
    console.log("Tentative de déconnexion");
    
    // Vérifier si l'utilisateur est connecté
    if (request.isAuthenticated()) {
        console.log("Utilisateur authentifié, déconnexion");
        request.logout((err) => {
            if (err) {
                console.log("Erreur lors de la déconnexion:", err);
                return next(err);
            }
            
            console.log("Déconnexion réussie, redirection");
            // Rediriger vers la page d'accueil
            response.redirect("/");
        });
    } else {
        console.log("Utilisateur non authentifié, redirection simple");
        // Si l'utilisateur n'est pas connecté, rediriger simplement
        response.redirect("/");
    }
});

// Route de connexion avec redirection
router.post("/login", (request, response, next) => {
    console.log("Tentative de connexion:", request.body.email);
    
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            console.log("Erreur d'authentification:", err);
            return next(err);
        }
        
        if (!user) {
            console.log("Échec d'authentification:", info.erreur);
            // Authentification échouée
            return response.render("login", {
                titre: "Connexion",
                styles: ["./css/style.css", "./css/auth.css"],
                error: info.erreur === "mauvais_utilisateur" 
                    ? "Cet email n'est pas enregistré" 
                    : "Mot de passe incorrect"
            });
        }
        
        console.log("Authentification réussie pour:", user.email);
        // Authentification réussie, connexion de l'utilisateur
        request.logIn(user, (err) => {
            if (err) {
                console.log("Erreur lors de la connexion:", err);
                return next(err);
            }
            
            console.log("Utilisateur connecté avec succès, redirection");
            // Redirection vers la page d'accueil
            return response.redirect("/");
        });
    })(request, response, next);
});

// Route d'inscription
router.post("/register", async (request, response) => {
    try {
        const { email, password, name } = request.body;
        console.log("Tentative d'inscription:", email);
        
        if (!email || !password) {
            console.log("Échec: champs requis manquants");
            return response.render("register", {
                titre: "Inscription",
                styles: ["./css/style.css", "./css/auth.css"],
                error: "L'email et le mot de passe sont requis"
            });
        }

        try {
            // Créer l'utilisateur
            const user = await createUser(email, password);
            console.log("Utilisateur créé avec succès:", user.id);
            
            // Mettre à jour le nom d'utilisateur si fourni
            if (name) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { name }
                });
                console.log("Nom d'utilisateur mis à jour:", name);
            }
            
            console.log("Redirection vers la page de connexion");
            // Ajout d'un message flash pour indiquer le succès de l'inscription
            request.session.flashMessage = "Inscription réussie ! Vous pouvez maintenant vous connecter.";
            return response.redirect("/login");
        } catch (error) {
            if (error.message === 'Cet email est déjà utilisé') {
                console.log("Échec: email déjà utilisé");
                return response.render("register", {
                    titre: "Inscription",
                    styles: ["./css/style.css", "./css/auth.css"],
                    error: "Cet email est déjà utilisé"
                });
            }
            throw error;
        }
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        response.render("register", {
            titre: "Inscription",
            styles: ["./css/style.css", "./css/auth.css"],
            error: "Une erreur est survenue lors de l'inscription"
        });
    }
});

export default router;
