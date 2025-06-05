
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  try {
    // Check if task exists
    const existingTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (existingTask.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.deadline !== undefined) {
      updateData.deadline = input.deadline;
    }
    if (input.assigned_member_id !== undefined) {
      updateData.assigned_member_id = input.assigned_member_id;
    }
    if (input.effort_spent !== undefined) {
      updateData.effort_spent = input.effort_spent;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.dependencies !== undefined) {
      updateData.dependencies = input.dependencies;
    }

    // Update the task
    const result = await db.update(tasksTable)
      .set(updateData)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    const updatedTask = result[0];
    
    // Convert numeric fields and ensure proper types
    return {
      ...updatedTask,
      effort_spent: parseFloat(updatedTask.effort_spent.toString()),
      dependencies: updatedTask.dependencies as string[]
    };
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
};
