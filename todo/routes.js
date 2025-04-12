import { Router } from "express";
import { getTasks, getTaskById, createTask, updateTask, deleteTask, getTaskHistory } from "./model/task.js";
import passport from "passport";
import { createUser } from "./model/user.js";

const router = Router();

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

// API Routes

// Route pour obtenir la liste des tâches avec filtres optionnels
router.get("/api/tasks", async (request, response) => {
    try {
        const { priority, status, sortBy, sortOrder } = request.query;
        const tasks = await getTasks({ priority, status, sortBy, sortOrder });
        return response.status(200).json(tasks);
    } catch (error) {
        console.error("Erreur lors de la récupération des tâches:", error);
        return response.status(500).json({
            error: "Une erreur est survenue lors de la récupération des tâches."
        });
    }
});

// Route pour obtenir une tâche spécifique
router.get("/api/tasks/:id", async (request, response) => {
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
router.post("/api/tasks", async (request, response) => {
    try {
        const { title, description, priority, status, dueDate } = request.body;
        
        // Valider les champs requis
        if (!title || !description || !priority || !status || !dueDate) {
            return response.status(400).json({
                error: "Tous les champs sont obligatoires (titre, description, priorité, statut et date d'échéance)."
            });
        }
        
        const task = await createTask(request.body);
        return response.status(201).json(task);
    } catch (error) {
        console.error("Erreur lors de la création de la tâche:", error);
        return response.status(500).json({
            error: "Une erreur est survenue lors de la création de la tâche."
        });
    }
});

// Route pour mettre à jour une tâche
router.put("/api/tasks/:id", async (request, response) => {
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
router.delete("/api/tasks/:id", async (request, response) => {
    try {
        const taskId = parseInt(request.params.id);
        
        if (isNaN(taskId)) {
            return response.status(400).json({
                error: "L'ID de la tâche doit être un nombre."
            });
        }
        
        try {
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
router.get("/api/tasks/:id/history", async (request, response) => {
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
router.get("/api/tasks/history", async (request, response) => {
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
    response.render("login", {
        titre: "Connexion",
        styles: ["./css/style.css", "./css/auth.css"],
        user: request.user
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

// Route de connexion
router.post("/login", passport.authenticate("local"), (request, response) => {
    response.status(200).json({ message: "Connexion réussie" });
});

// Route d'inscription
router.post("/register", async (request, response) => {
    try {
        const { email, password } = request.body;
        
        if (!email || !password) {
            return response.status(400).json({
                error: "L'email et le mot de passe sont requis"
            });
        }

        const user = await createUser(email, password);
        response.status(201).json({ message: "Inscription réussie" });
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        response.status(500).json({
            error: "Une erreur est survenue lors de l'inscription"
        });
    }
});

// Route de déconnexion
router.post("/logout", (request, response) => {
    request.logout((err) => {
        if (err) {
            return response.status(500).json({
                error: "Une erreur est survenue lors de la déconnexion"
            });
        }
        response.status(200).json({ message: "Déconnexion réussie" });
    });
});

export default router;
