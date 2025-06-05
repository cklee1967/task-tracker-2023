
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type GetTaskByIdInput, type CreateUserInput, type CreateTaskInput } from '../schema';
import { getTaskById } from '../handlers/get_task_by_id';

describe('getTaskById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a task by id', async () => {
    // Create a user first (required for foreign key)
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a task
    const taskInput = {
      title: 'Test Task',
      description: 'A task for testing',
      deadline: new Date('2024-12-31'),
      assigned_member_id: user.id,
      effort_spent: 5.5,
      status: 'in_progress' as const,
      dependencies: ['550e8400-e29b-41d4-a716-446655440000']
    };

    const taskResult = await db.insert(tasksTable)
      .values(taskInput)
      .returning()
      .execute();

    const createdTask = taskResult[0];

    // Test getting the task by ID
    const input: GetTaskByIdInput = {
      id: createdTask.id
    };

    const result = await getTaskById(input);

    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.deadline).toBeInstanceOf(Date);
    expect(result.assigned_member_id).toEqual(user.id);
    expect(result.effort_spent).toEqual(5.5);
    expect(result.status).toEqual('in_progress');
    expect(result.dependencies).toEqual(['550e8400-e29b-41d4-a716-446655440000']);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle task with null description', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create a task with null description
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Task Without Description',
        description: null,
        deadline: new Date('2024-12-31'),
        assigned_member_id: user.id,
        effort_spent: 0,
        status: 'todo',
        dependencies: []
      })
      .returning()
      .execute();

    const createdTask = taskResult[0];

    const input: GetTaskByIdInput = {
      id: createdTask.id
    };

    const result = await getTaskById(input);

    expect(result.description).toBeNull();
    expect(result.title).toEqual('Task Without Description');
  });

  it('should throw error when task not found', async () => {
    const input: GetTaskByIdInput = {
      id: '550e8400-e29b-41d4-a716-446655440000'
    };

    expect(getTaskById(input)).rejects.toThrow(/not found/i);
  });
});
