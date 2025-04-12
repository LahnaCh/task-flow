import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Définition des rôles possibles
export const ROLES = {
    ADMIN: 'admin',
    USER: 'user'
};

// Fonction pour créer un utilisateur
export async function createUser(email, password, role = ROLES.USER) {
    try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw new Error('Cet email est déjà utilisé');
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur dans la base de données
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role
            }
        });

        // Retourner l'utilisateur sans le mot de passe
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        throw error;
    }
}

// Fonction pour récupérer un utilisateur par email
export async function getUserByEmail(email) {
    try {
        return await prisma.user.findUnique({
            where: { email }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        throw error;
    }
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