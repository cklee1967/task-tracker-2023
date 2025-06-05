
import { db } from '../db';
import { tasksTable, usersTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // Verify that the assigned member exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.assigned_member_id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.assigned_member_id} does not exist`);
    }

    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        title: input.title,
        description: input.description,
        deadline: input.deadline,
        assigned_member_id: input.assigned_member_id,
        effort_spent: input.effort_spent, // Real column - no conversion needed
        status: input.status,
        dependencies: input.dependencies // JSONB column - stored as is
      })
      .returning()
      .execute();

    const task = result[0];
    return {
      ...task,
      dependencies: task.dependencies as string[] // Cast JSONB back to string array
    };
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
