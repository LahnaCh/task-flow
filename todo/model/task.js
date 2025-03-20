// Import Prisma client
import { PrismaClient } from "@prisma/client";

// Create a Prisma instance
const prisma = new PrismaClient();

/**
 * Get all tasks with optional filtering and sorting
 * @param {Object} options - Filter and sort options
 * @returns {Array} - List of tasks
 */
export const getTasks = async (options = {}) => {
    const { priority, status, sortBy, sortOrder } = options;
    
    // Build where clause for filtering
    const where = {};
    if (priority) where.priority = priority;
    if (status) where.status = status;
    
    // Build orderBy for sorting
    let orderBy = {};
    if (sortBy === 'dueDate') {
        orderBy.dueDate = sortOrder === 'desc' ? 'desc' : 'asc';
    } else {
        // Default sort by creation date
        orderBy.createdAt = sortOrder === 'desc' ? 'desc' : 'asc';
    }
    
    // Get tasks with their assignee
    const tasks = await prisma.task.findMany({
        where,
        orderBy,
        include: {
            assignee: true
        }
    });
    
    // Convertir les BigInt en Number pour la sérialisation JSON
    const serializedTasks = tasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? Number(task.dueDate) : null
    }));
    
    return serializedTasks;
};

/**
 * Get a single task by ID
 * @param {Number} id - Task ID
 * @returns {Object} - Task details
 */
export const getTaskById = async (id) => {
    const task = await prisma.task.findUnique({
        where: { id },
        include: {
            assignee: true,
            history: {
                orderBy: {
                    timestamp: 'desc'
                }
            }
        }
    });
    
    if (!task) return null;
    
    // Convertir les BigInt en Number pour la sérialisation JSON
    const serializedTask = {
        ...task,
        dueDate: task.dueDate ? Number(task.dueDate) : null
    };
    
    return serializedTask;
};

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @returns {Object} - Created task
 */
export const createTask = async (taskData) => {
    const { title, description, priority, status, dueDate, assigneeId = 1 } = taskData;
    
    // Validation des champs obligatoires
    if (!title || !description || !priority || !status || !dueDate) {
        throw new Error("Tous les champs sont obligatoires (titre, description, priorité, statut et date d'échéance)");
    }
    
    // Create the task
    const task = await prisma.task.create({
        data: {
            title,
            description,
            priority,
            status,
            dueDate: Number(dueDate),
            assigneeId
        },
        include: {
            assignee: true
        }
    });
    
    // Create history entry for task creation
    await prisma.history.create({
        data: {
            taskId: task.id,
            field: 'creation',
            newValue: 'Task created',
        }
    });
    
    // Convertir les BigInt en Number pour la sérialisation JSON
    const serializedTask = {
        ...task,
        dueDate: task.dueDate ? Number(task.dueDate) : null
    };
    
    return serializedTask;
};

/**
 * Update a task
 * @param {Number} id - Task ID
 * @param {Object} taskData - Updated task data
 * @returns {Object} - Updated task
 */
export const updateTask = async (id, taskData) => {
    const { title, description, priority, status, dueDate } = taskData;
    
    // Validation des champs obligatoires
    if (!title || !description || !priority || !status || !dueDate) {
        throw new Error("Tous les champs sont obligatoires (titre, description, priorité, statut et date d'échéance)");
    }
    
    // Get the current task state
    const currentTask = await getTaskById(id);
    if (!currentTask) {
        throw new Error(`La tâche avec l'ID ${id} n'existe pas.`);
    }
    
    // Préparer les données pour la mise à jour
    const updateData = { 
        title,
        description,
        priority,
        status,
        dueDate: Number(dueDate)
    };
    
    // Create history entries for each changed field
    const historyEntries = [];
    
    for (const [key, value] of Object.entries(updateData)) {
        // Skip if the value hasn't changed
        if (currentTask[key] === value) continue;
        
        // Add history entry for this change
        historyEntries.push({
            taskId: id,
            field: key,
            oldValue: String(currentTask[key] || ''),
            newValue: String(value)
        });
    }
    
    // Start a transaction to update task and add history entries
    const result = await prisma.$transaction(async (tx) => {
        // Update the task
        const updatedTask = await tx.task.update({
            where: { id },
            data: updateData,
            include: {
                assignee: true
            }
        });
        
        // Add history entries
        if (historyEntries.length > 0) {
            await tx.history.createMany({
                data: historyEntries
            });
        }
        
        return updatedTask;
    });
    
    // Convertir les BigInt en Number pour la sérialisation JSON
    const serializedResult = {
        ...result,
        dueDate: result.dueDate ? Number(result.dueDate) : null
    };
    
    return serializedResult;
};

/**
 * Delete a task
 * @param {Number} id - Task ID
 * @returns {Object} - Deleted task
 */
export const deleteTask = async (id) => {
    // Vérifier si la tâche existe avant de la supprimer
    const task = await prisma.task.findUnique({
        where: { id },
        include: {
            assignee: true
        }
    });
    
    if (!task) {
        throw new Error(`La tâche avec l'ID ${id} n'existe pas ou a déjà été supprimée.`);
    }
    
    // Supprimer d'abord l'historique de la tâche
    await prisma.history.deleteMany({
        where: { taskId: id }
    });
    
    // Supprimer la tâche
    const deletedTask = await prisma.task.delete({
        where: { id },
        include: {
            assignee: true
        }
    });
    
    // Convertir les BigInt en Number pour la sérialisation JSON
    const serializedTask = {
        ...deletedTask,
        dueDate: deletedTask.dueDate ? Number(deletedTask.dueDate) : null
    };
    
    return serializedTask;
};

/**
 * Get task history
 * @param {Number} taskId - Task ID
 * @returns {Array} - History entries
 */
export const getTaskHistory = async (taskId) => {
    const history = await prisma.history.findMany({
        where: { taskId },
        orderBy: {
            timestamp: 'desc'
        }
    });
    
    return history;
};
