
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, usersTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task', async () => {
    // Create a user first for the task assignment
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const testInput: CreateTaskInput = {
      title: 'Test Task',
      description: 'A task for testing',
      deadline: new Date('2024-12-31'),
      assigned_member_id: userResult[0].id,
      effort_spent: 2.5,
      status: 'in_progress',
      dependencies: ['550e8400-e29b-41d4-a716-446655440000']
    };

    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.deadline).toEqual(new Date('2024-12-31'));
    expect(result.assigned_member_id).toEqual(userResult[0].id);
    expect(result.effort_spent).toEqual(2.5);
    expect(result.status).toEqual('in_progress');
    expect(result.dependencies).toEqual(['550e8400-e29b-41d4-a716-446655440000']);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const testInput: CreateTaskInput = {
      title: 'Test Task',
      description: 'A task for testing',
      deadline: new Date('2024-12-31'),
      assigned_member_id: userResult[0].id,
      effort_spent: 2.5,
      status: 'in_progress',
      dependencies: ['550e8400-e29b-41d4-a716-446655440000']
    };

    const result = await createTask(testInput);

    // Query database to verify task was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].deadline).toEqual(new Date('2024-12-31'));
    expect(tasks[0].assigned_member_id).toEqual(userResult[0].id);
    expect(tasks[0].effort_spent).toEqual(2.5);
    expect(tasks[0].status).toEqual('in_progress');
    expect(tasks[0].dependencies).toEqual(['550e8400-e29b-41d4-a716-446655440000']);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
  });

  it('should create task with default values', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const testInput: CreateTaskInput = {
      title: 'Simple Task',
      description: null,
      deadline: new Date('2024-12-31'),
      assigned_member_id: userResult[0].id,
      effort_spent: 0,
      status: 'todo',
      dependencies: []
    };

    const result = await createTask(testInput);

    expect(result.title).toEqual('Simple Task');
    expect(result.description).toBeNull();
    expect(result.effort_spent).toEqual(0);
    expect(result.status).toEqual('todo');
    expect(result.dependencies).toEqual([]);
  });

  it('should throw error when assigned member does not exist', async () => {
    const testInput: CreateTaskInput = {
      title: 'Test Task',
      description: 'A task for testing',
      deadline: new Date('2024-12-31'),
      assigned_member_id: '550e8400-e29b-41d4-a716-446655440000', // Non-existent user
      effort_spent: 2.5,
      status: 'in_progress',
      dependencies: []
    };

    await expect(createTask(testInput)).rejects.toThrow(/user with id .* does not exist/i);
  });
});
