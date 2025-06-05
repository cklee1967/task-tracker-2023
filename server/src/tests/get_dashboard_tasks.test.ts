
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { getDashboardTasks } from '../handlers/get_dashboard_tasks';

describe('getDashboardTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty dashboard when no tasks exist', async () => {
    const result = await getDashboardTasks();

    expect(result.overdue).toHaveLength(0);
    expect(result.nearingDeadline).toHaveLength(0);
    expect(result.inProgress).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should categorize tasks correctly', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([
        { name: 'Test User', email: 'test@example.com' }
      ])
      .returning()
      .execute();
    const userId = users[0].id;

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Create test tasks
    await db.insert(tasksTable)
      .values([
        {
          title: 'Overdue Task',
          description: 'Should be overdue',
          deadline: yesterday,
          assigned_member_id: userId,
          status: 'todo',
          effort_spent: 0,
          dependencies: []
        },
        {
          title: 'Nearing Deadline Task',
          description: 'Should be nearing deadline',
          deadline: tomorrow,
          assigned_member_id: userId,
          status: 'todo',
          effort_spent: 0,
          dependencies: []
        },
        {
          title: 'In Progress Task',
          description: 'Should be in progress',
          deadline: nextWeek,
          assigned_member_id: userId,
          status: 'in_progress',
          effort_spent: 5,
          dependencies: []
        },
        {
          title: 'Done Task',
          description: 'Should not appear in overdue even if past deadline',
          deadline: yesterday,
          assigned_member_id: userId,
          status: 'done',
          effort_spent: 10,
          dependencies: []
        }
      ])
      .execute();

    const result = await getDashboardTasks();

    expect(result.overdue).toHaveLength(1);
    expect(result.overdue[0].title).toBe('Overdue Task');
    expect(result.overdue[0].status).toBe('todo');

    expect(result.nearingDeadline).toHaveLength(1);
    expect(result.nearingDeadline[0].title).toBe('Nearing Deadline Task');
    expect(result.nearingDeadline[0].status).toBe('todo');

    expect(result.inProgress).toHaveLength(1);
    expect(result.inProgress[0].title).toBe('In Progress Task');
    expect(result.inProgress[0].status).toBe('in_progress');

    expect(result.total).toBe(4);
  });

  it('should handle tasks with dependencies correctly', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([
        { name: 'Test User', email: 'test@example.com' }
      ])
      .returning()
      .execute();
    const userId = users[0].id;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create task with dependencies
    await db.insert(tasksTable)
      .values([
        {
          title: 'Task with Dependencies',
          description: 'Has dependencies',
          deadline: tomorrow,
          assigned_member_id: userId,
          status: 'in_progress',
          effort_spent: 3,
          dependencies: ['123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-43d7-8f9e-123456789012']
        }
      ])
      .execute();

    const result = await getDashboardTasks();

    expect(result.inProgress).toHaveLength(1);
    expect(result.inProgress[0].dependencies).toHaveLength(2);
    expect(result.inProgress[0].dependencies).toContain('123e4567-e89b-12d3-a456-426614174000');
    expect(result.inProgress[0].dependencies).toContain('987fcdeb-51a2-43d7-8f9e-123456789012');
    expect(result.total).toBe(1);
  });

  it('should not include done tasks in overdue or nearing deadline', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([
        { name: 'Test User', email: 'test@example.com' }
      ])
      .returning()
      .execute();
    const userId = users[0].id;

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create done tasks with past and near deadlines
    await db.insert(tasksTable)
      .values([
        {
          title: 'Done Past Deadline',
          description: 'Done task with past deadline',
          deadline: yesterday,
          assigned_member_id: userId,
          status: 'done',
          effort_spent: 8,
          dependencies: []
        },
        {
          title: 'Done Near Deadline',
          description: 'Done task with near deadline',
          deadline: tomorrow,
          assigned_member_id: userId,
          status: 'done',
          effort_spent: 5,
          dependencies: []
        }
      ])
      .execute();

    const result = await getDashboardTasks();

    expect(result.overdue).toHaveLength(0);
    expect(result.nearingDeadline).toHaveLength(0);
    expect(result.inProgress).toHaveLength(0);
    expect(result.total).toBe(2);
  });
});
