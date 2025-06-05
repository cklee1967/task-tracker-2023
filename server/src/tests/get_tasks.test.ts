
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type TaskFilter } from '../schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all tasks when no filter is provided', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test tasks
    await db.insert(tasksTable)
      .values([
        {
          title: 'Task 1',
          description: 'First task',
          deadline: new Date('2024-12-31'),
          assigned_member_id: userId,
          effort_spent: 2.5,
          status: 'todo',
          dependencies: ['uuid-1', 'uuid-2']
        },
        {
          title: 'Task 2',
          description: null,
          deadline: new Date('2024-12-25'),
          assigned_member_id: userId,
          effort_spent: 0,
          status: 'in_progress',
          dependencies: []
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Task 1');
    expect(result[0].effort_spent).toEqual(2.5);
    expect(typeof result[0].effort_spent).toBe('number');
    expect(result[0].dependencies).toEqual(['uuid-1', 'uuid-2']);
    expect(result[1].title).toEqual('Task 2');
    expect(result[1].description).toBeNull();
    expect(result[1].dependencies).toEqual([]);
  });

  it('should filter tasks by status', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create tasks with different statuses
    await db.insert(tasksTable)
      .values([
        {
          title: 'Todo Task',
          description: 'Task to do',
          deadline: new Date('2024-12-31'),
          assigned_member_id: userId,
          status: 'todo'
        },
        {
          title: 'Done Task',
          description: 'Completed task',
          deadline: new Date('2024-12-31'),
          assigned_member_id: userId,
          status: 'done'
        }
      ])
      .execute();

    const filter: TaskFilter = { status: 'todo' };
    const result = await getTasks(filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Todo Task');
    expect(result[0].status).toEqual('todo');
  });

  it('should filter tasks by assigned member', async () => {
    // Create test users
    const user1Result = await db.insert(usersTable)
      .values({
        name: 'User 1',
        email: 'user1@example.com'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        name: 'User 2',
        email: 'user2@example.com'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create tasks assigned to different users
    await db.insert(tasksTable)
      .values([
        {
          title: 'Task for User 1',
          description: 'First user task',
          deadline: new Date('2024-12-31'),
          assigned_member_id: user1Id
        },
        {
          title: 'Task for User 2',
          description: 'Second user task',
          deadline: new Date('2024-12-31'),
          assigned_member_id: user2Id
        }
      ])
      .execute();

    const filter: TaskFilter = { assigned_member_id: user1Id };
    const result = await getTasks(filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Task for User 1');
    expect(result[0].assigned_member_id).toEqual(user1Id);
  });

  it('should filter overdue tasks', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create tasks with past and future deadlines
    const pastDate = new Date('2020-01-01');
    const futureDate = new Date('2030-12-31');

    await db.insert(tasksTable)
      .values([
        {
          title: 'Overdue Task',
          description: 'Past deadline',
          deadline: pastDate,
          assigned_member_id: userId
        },
        {
          title: 'Future Task',
          description: 'Future deadline',
          deadline: futureDate,
          assigned_member_id: userId
        }
      ])
      .execute();

    const filter: TaskFilter = { overdue_only: true };
    const result = await getTasks(filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Overdue Task');
    expect(result[0].deadline).toEqual(pastDate);
  });

  it('should filter tasks by deadline range', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create tasks with different deadlines
    await db.insert(tasksTable)
      .values([
        {
          title: 'Early Task',
          description: 'Early deadline',
          deadline: new Date('2024-01-01'),
          assigned_member_id: userId
        },
        {
          title: 'Middle Task',
          description: 'Middle deadline',
          deadline: new Date('2024-06-15'),
          assigned_member_id: userId
        },
        {
          title: 'Late Task',
          description: 'Late deadline',
          deadline: new Date('2024-12-31'),
          assigned_member_id: userId
        }
      ])
      .execute();

    const filter: TaskFilter = {
      deadline_after: new Date('2024-02-01'),
      deadline_before: new Date('2024-12-01')
    };
    const result = await getTasks(filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Middle Task');
  });

  it('should handle multiple filters combined', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create tasks
    await db.insert(tasksTable)
      .values([
        {
          title: 'Matching Task',
          description: 'Matches all filters',
          deadline: new Date('2024-06-15'),
          assigned_member_id: userId,
          status: 'in_progress'
        },
        {
          title: 'Wrong Status',
          description: 'Wrong status',
          deadline: new Date('2024-06-15'),
          assigned_member_id: userId,
          status: 'done'
        },
        {
          title: 'Wrong Date',
          description: 'Wrong date',
          deadline: new Date('2024-12-31'),
          assigned_member_id: userId,
          status: 'in_progress'
        }
      ])
      .execute();

    const filter: TaskFilter = {
      status: 'in_progress',
      assigned_member_id: userId,
      deadline_before: new Date('2024-07-01')
    };
    const result = await getTasks(filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Matching Task');
  });

  it('should return empty array when no tasks match filter', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create a task
    await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'Test',
        deadline: new Date('2024-12-31'),
        assigned_member_id: userId,
        status: 'todo'
      })
      .execute();

    const filter: TaskFilter = { status: 'done' };
    const result = await getTasks(filter);

    expect(result).toHaveLength(0);
  });
});
