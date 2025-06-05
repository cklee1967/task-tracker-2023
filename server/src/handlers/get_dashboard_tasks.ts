
import { db } from '../db';
import { tasksTable, usersTable } from '../db/schema';
import { type Task } from '../schema';
import { eq, and, lt, lte, gte, SQL } from 'drizzle-orm';

export const getDashboardTasks = async (): Promise<{
  overdue: Task[];
  nearingDeadline: Task[];
  inProgress: Task[];
  total: number;
}> => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    // Get all tasks with assigned member info
    const results = await db.select()
      .from(tasksTable)
      .innerJoin(usersTable, eq(tasksTable.assigned_member_id, usersTable.id))
      .execute();

    // Convert results to Task objects
    const allTasks: Task[] = results.map(result => ({
      id: result.tasks.id,
      title: result.tasks.title,
      description: result.tasks.description,
      deadline: result.tasks.deadline,
      assigned_member_id: result.tasks.assigned_member_id,
      effort_spent: result.tasks.effort_spent,
      status: result.tasks.status,
      dependencies: Array.isArray(result.tasks.dependencies) ? result.tasks.dependencies : [],
      created_at: result.tasks.created_at
    }));

    // Categorize tasks
    const overdue = allTasks.filter(task => 
      task.deadline < now && task.status !== 'done'
    );

    const nearingDeadline = allTasks.filter(task => 
      task.deadline >= now && 
      task.deadline <= threeDaysFromNow && 
      task.status !== 'done'
    );

    const inProgress = allTasks.filter(task => 
      task.status === 'in_progress'
    );

    return {
      overdue,
      nearingDeadline,
      inProgress,
      total: allTasks.length
    };
  } catch (error) {
    console.error('Dashboard tasks fetch failed:', error);
    throw error;
  }
};
