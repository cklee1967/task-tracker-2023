
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task, type TaskFilter } from '../schema';
import { and, eq, lt, gt, SQL } from 'drizzle-orm';

export const getTasks = async (filter?: TaskFilter): Promise<Task[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter) {
      // Filter by status
      if (filter.status) {
        conditions.push(eq(tasksTable.status, filter.status));
      }

      // Filter by assigned member
      if (filter.assigned_member_id) {
        conditions.push(eq(tasksTable.assigned_member_id, filter.assigned_member_id));
      }

      // Filter for overdue tasks only
      if (filter.overdue_only) {
        const now = new Date();
        conditions.push(lt(tasksTable.deadline, now));
      }

      // Filter by deadline before
      if (filter.deadline_before) {
        conditions.push(lt(tasksTable.deadline, filter.deadline_before));
      }

      // Filter by deadline after
      if (filter.deadline_after) {
        conditions.push(gt(tasksTable.deadline, filter.deadline_after));
      }
    }

    // Build and execute query
    const query = conditions.length > 0
      ? db.select().from(tasksTable).where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : db.select().from(tasksTable);

    const results = await query.execute();

    // Convert results to match Task schema
    return results.map(task => ({
      ...task,
      effort_spent: Number(task.effort_spent), // Convert real to number
      dependencies: task.dependencies as string[] // Cast jsonb to string array
    }));
  } catch (error) {
    console.error('Get tasks failed:', error);
    throw error;
  }
};
