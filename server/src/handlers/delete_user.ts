
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type DeleteUserInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteUser = async (input: DeleteUserInput): Promise<void> => {
  try {
    // Check if user has assigned tasks
    const assignedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.assigned_member_id, input.id))
      .execute();

    if (assignedTasks.length > 0) {
      throw new Error('Cannot delete user with assigned tasks');
    }

    // Delete the user
    const result = await db.delete(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    // Check if user existed
    if (result.rowCount === 0) {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
};
