
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, usersTable } from '../db/schema';
import { type DeleteTaskInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a task', async () => {
    // Create a user first (required for task foreign key)
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create a task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing deletion',
        deadline: new Date('2024-12-31'),
        assigned_member_id: userId,
        effort_spent: 5.5,
        status: 'in_progress',
        dependencies: ['550e8400-e29b-41d4-a716-446655440000']
      })
      .returning()
      .execute();
    
    const taskId = taskResult[0].id;

    // Verify task exists
    const tasksBeforeDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    
    expect(tasksBeforeDelete).toHaveLength(1);

    // Delete the task
    const deleteInput: DeleteTaskInput = { id: taskId };
    await deleteTask(deleteInput);

    // Verify task is deleted
    const tasksAfterDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    
    expect(tasksAfterDelete).toHaveLength(0);
  });

  it('should not throw error when deleting non-existent task', async () => {
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
    const deleteInput: DeleteTaskInput = { id: nonExistentId };

    // Should not throw error even if task doesn't exist
    await expect(deleteTask(deleteInput)).resolves.toBeUndefined();
  });

  it('should only delete the specified task', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create two tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        deadline: new Date('2024-12-31'),
        assigned_member_id: userId,
        effort_spent: 2.0,
        status: 'todo',
        dependencies: []
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task',
        deadline: new Date('2024-12-31'),
        assigned_member_id: userId,
        effort_spent: 3.0,
        status: 'done',
        dependencies: []
      })
      .returning()
      .execute();
    
    const task1Id = task1Result[0].id;
    const task2Id = task2Result[0].id;

    // Delete only the first task
    const deleteInput: DeleteTaskInput = { id: task1Id };
    await deleteTask(deleteInput);

    // Verify first task is deleted
    const task1AfterDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task1Id))
      .execute();
    
    expect(task1AfterDelete).toHaveLength(0);

    // Verify second task still exists
    const task2AfterDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task2Id))
      .execute();
    
    expect(task2AfterDelete).toHaveLength(1);
    expect(task2AfterDelete[0].title).toEqual('Task 2');
  });
});
