
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateUserInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Test user input
const testUser: CreateUserInput = {
  name: 'Test User',
  email: 'test@example.com'
};

// Another test user for assignment changes
const secondUser: CreateUserInput = {
  name: 'Second User',
  email: 'second@example.com'
};

describe('updateTask', () => {
  let userId: string;
  let secondUserId: string;
  let taskId: string;

  beforeEach(async () => {
    await createDB();
    
    // Create test users
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    const secondUserResult = await db.insert(usersTable)
      .values(secondUser)
      .returning()
      .execute();
    secondUserId = secondUserResult[0].id;

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Original Task',
        description: 'Original description',
        deadline: new Date('2024-12-31'),
        assigned_member_id: userId,
        effort_spent: 5.5,
        status: 'todo',
        dependencies: ['dep1', 'dep2']
      })
      .returning()
      .execute();
    taskId = taskResult[0].id;
  });

  afterEach(resetDB);

  it('should update task title', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Task Title'
    };

    const result = await updateTask(input);

    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description'); // Other fields unchanged
    expect(result.id).toEqual(taskId);
  });

  it('should update multiple fields simultaneously', async () => {
    const newDeadline = new Date('2025-01-15');
    const input: UpdateTaskInput = {
      id: taskId,
      title: 'Multi-Update Task',
      description: 'Updated description',
      deadline: newDeadline,
      assigned_member_id: secondUserId,
      effort_spent: 10.5,
      status: 'in_progress',
      dependencies: ['new-dep1', 'new-dep2', 'new-dep3']
    };

    const result = await updateTask(input);

    expect(result.title).toEqual('Multi-Update Task');
    expect(result.description).toEqual('Updated description');
    expect(result.deadline).toEqual(newDeadline);
    expect(result.assigned_member_id).toEqual(secondUserId);
    expect(result.effort_spent).toEqual(10.5);
    expect(typeof result.effort_spent).toEqual('number');
    expect(result.status).toEqual('in_progress');
    expect(result.dependencies).toEqual(['new-dep1', 'new-dep2', 'new-dep3']);
  });

  it('should update task status to done', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      status: 'done',
      effort_spent: 15.0
    };

    const result = await updateTask(input);

    expect(result.status).toEqual('done');
    expect(result.effort_spent).toEqual(15.0);
    expect(result.title).toEqual('Original Task'); // Other fields unchanged
  });

  it('should handle null description update', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      description: null
    };

    const result = await updateTask(input);

    expect(result.description).toBeNull();
    expect(result.title).toEqual('Original Task'); // Other fields unchanged
  });

  it('should save updates to database', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      title: 'Database Update Test',
      effort_spent: 8.5
    };

    await updateTask(input);

    // Verify changes in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Update Test');
    expect(parseFloat(tasks[0].effort_spent.toString())).toEqual(8.5);
  });

  it('should throw error for non-existent task', async () => {
    const input: UpdateTaskInput = {
      id: '00000000-0000-0000-0000-000000000000',
      title: 'Non-existent Task'
    };

    expect(updateTask(input)).rejects.toThrow(/not found/i);
  });

  it('should update empty dependencies array', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      dependencies: []
    };

    const result = await updateTask(input);

    expect(result.dependencies).toEqual([]);
    expect(Array.isArray(result.dependencies)).toBe(true);
  });

  it('should handle effort_spent with zero value', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      effort_spent: 0
    };

    const result = await updateTask(input);

    expect(result.effort_spent).toEqual(0);
    expect(typeof result.effort_spent).toEqual('number');
  });
});
