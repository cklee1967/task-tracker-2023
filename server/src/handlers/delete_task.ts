
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (input: DeleteTaskInput): Promise<void> => {
  try {
    await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};
