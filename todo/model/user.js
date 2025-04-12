// Définition des rôles possibles
export const ROLES = {
    ADMIN: 'admin',
    USER: 'user'
};

// Fonction pour créer un utilisateur
export async function createUser(email, password, role = ROLES.USER) {
    // TODO: Implémenter la création d'utilisateur avec Prisma
    // Cette fonction sera implémentée plus tard
}

// Fonction pour récupérer un utilisateur par email
export async function getUserByEmail(email) {
    // TODO: Implémenter la récupération d'utilisateur avec Prisma
    // Cette fonction sera implémentée plus tard
}

// Fonction pour vérifier si un utilisateur a un rôle spécifique
export function hasRole(user, role) {
    return user && user.role === role;
}

// Fonction pour vérifier si un utilisateur est admin
export function isAdmin(user) {
    return hasRole(user, ROLES.ADMIN);
}

// Fonction pour vérifier si un utilisateur est un utilisateur normal
export function isUser(user) {
    return hasRole(user, ROLES.USER);
} 