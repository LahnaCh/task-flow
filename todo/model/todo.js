// importer ler client prisma
import { PrismaClient } from "@prisma/client";

//Creer une instance de prisma
const prisma = new PrismaClient();

/**
 * Pour ajouter une tache
 * @param {*} description
 */
export const addTodo = async (description) => {
    const todo = await prisma.todo.create({
        data: {
            description,
        },
    });
    return todo;
};

/**
 * Obtenir la liste de toutes les taches
 * @returns la liste des taches
 */
export const getTodos = async () => {
    const todos = await prisma.todo.findMany();
    return todos;
};

/**
 * Pour la mise à jour de la tache
 * @param {*} id
 * @returns todo
 */
export const updateTodo = async (id) => {
    const todo = await prisma.todo.findUnique({
        where: {
            id,
        },
    });

    const updatedTodo = await prisma.todo.update({
        where: {
            id,
        },

        data: {
            est_faite: !todo.est_faite,
        },
    });

    return updatedTodo;
};
