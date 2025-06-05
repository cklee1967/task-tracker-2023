
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskByIdInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const getTaskById = async (input: GetTaskByIdInput): Promise<Task> => {
  try {
    const result = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (result.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    const task = result[0];
    return {
      ...task,
      effort_spent: task.effort_spent, // real type - no conversion needed
      dependencies: task.dependencies as string[] // Cast JSONB to string array
    };
  } catch (error) {
    console.error('Get task by ID failed:', error);
    throw error;
  }
};
