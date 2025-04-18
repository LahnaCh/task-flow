//Doit etre en debut de fichier pour charger les variables d'environnement
import "dotenv/config";

//importer les routes
import routerExterne from "./routes.js";

// Importation des fichiers et librairies
import { engine } from "express-handlebars";
import express, { json } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cspOption from "./csp-options.js";
// Importations de la session
import session from 'express-session';
//Importation de la memorystore
import memorystore from 'memorystore';
// Importation de Passport
import passport from "passport";
// Importation de l'authentification
import "./authentification.js";
// Pour le HTTPS
import https from "node:https";
import { readFile } from "node:fs/promises";

// Création du serveur express
const app = express();
const MemoryStore = memorystore(session);

// Configuration de Handlebars avec les helpers personnalisés
const hbs = engine({
    helpers: {
        // Helper pour comparer deux valeurs (égalité)
        eq: function(a, b) {
            return a === b;
        },
        // Helper pour convertir une chaîne en minuscules
        toLowerCase: function(text) {
            return text ? text.toLowerCase() : '';
        },
        // Helper pour tronquer un texte
        truncate: function(text, length) {
            if (!text) return '';
            if (text.length <= length) return text;
            return text.substring(0, length) + '...';
        },
        // Helper pour formater une date avec l'heure
        formatDateTime: function(timestamp) {
            if (!timestamp) return '';
            const date = new Date(Number(timestamp));
            const dateStr = date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const timeStr = date.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            return `${dateStr} à ${timeStr}`;
        },
        // Helper pour formater une date pour l'input datetime-local
        formatDateInput: function(timestamp) {
            if (!timestamp) return '';
            const date = new Date(Number(timestamp));
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
    }
});

app.engine("handlebars", hbs); // Pour indiquer a express que l'on utilise handlebars
app.set("view engine", "handlebars"); // Pour indiquer le rendu des vues
app.set("views", "./views"); // Pour indiquer le dossier des vues

// Ajout de middlewares
app.use(helmet(cspOption));
app.use(compression());
app.use(cors());
app.use(json());
app.use(session({
    cookie: { maxAge: 3600000 },
    name: process.env.npm_package_name,
    store: new MemoryStore({ checkPeriod: 3600000 }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET
}));

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware pour passer l'utilisateur connecté aux templates
app.use((request, response, next) => {
    response.locals.user = request.user;
    next();
});

// Middleware pour parser les données des formulaires
app.use(express.urlencoded({ extended: true })); 

//Middeleware integre a express pour gerer la partie static du serveur
//le dossier 'public' est la partie statique de notre serveur
app.use(express.static("public"));

// Ajout des routes
app.use(routerExterne);

// Renvoyer une erreur 404 pour les routes non définies
app.use((request, response) => {
    // Renvoyer simplement une chaîne de caractère indiquant que la page n'existe pas
    response.status(404).send(`${request.originalUrl} Route introuvable.`);
});

// Démarrage du serveur
// Usage du HTTPS
if (process.env.NODE_ENV === "development") {
    try {
        let credentials = {
            key: await readFile("./security/localhost.key"),
            cert: await readFile("./security/localhost.cert")
        };
    
        https.createServer(credentials, app).listen(process.env.PORT);
        console.info("Serveur démarré avec succès (HTTPS) :");
        console.info(`https://localhost:${process.env.PORT}`);
    } catch (error) {
        console.error("Erreur lors du chargement des certificats HTTPS:", error.message);
        console.info("Démarrage du serveur en mode HTTP :");
        app.listen(process.env.PORT);
        console.info(`http://localhost:${process.env.PORT}`);
    }
} else {
    app.listen(process.env.PORT);
    console.info("Serveur démarré avec succès :");
    console.info(`http://localhost:${process.env.PORT}`);
}
