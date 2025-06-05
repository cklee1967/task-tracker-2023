
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type DeleteUserInput, type CreateUserInput, type CreateTaskInput } from '../schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

const testUserInput: CreateUserInput = {
  name: 'Test User',
  email: 'test@example.com'
};

const testTaskInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  deadline: new Date('2024-12-31'),
  assigned_member_id: '', // Will be set after creating user
  effort_spent: 0,
  status: 'todo',
  dependencies: []
};

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();

    const user = userResult[0];
    const deleteInput: DeleteUserInput = { id: user.id };

    // Delete the user
    await deleteUser(deleteInput);

    // Verify user is deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(users).toHaveLength(0);
  });

  it('should throw error when user not found', async () => {
    const deleteInput: DeleteUserInput = { 
      id: '550e8400-e29b-41d4-a716-446655440000' // Non-existent UUID
    };

    await expect(deleteUser(deleteInput)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when user has assigned tasks', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();

    const user = userResult[0];

    // Create task assigned to user
    const taskInput = {
      ...testTaskInput,
      assigned_member_id: user.id
    };

    await db.insert(tasksTable)
      .values({
        ...taskInput,
        dependencies: JSON.stringify(taskInput.dependencies)
      })
      .execute();

    const deleteInput: DeleteUserInput = { id: user.id };

    // Try to delete user with assigned tasks
    await expect(deleteUser(deleteInput)).rejects.toThrow(/cannot delete user with assigned tasks/i);

    // Verify user still exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(users).toHaveLength(1);
  });

  it('should allow deletion when user has no assigned tasks', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUserInput)
      .returning()
      .execute();

    const user = userResult[0];

    // Create another user to assign task to
    const otherUserResult = await db.insert(usersTable)
      .values({
        name: 'Other User',
        email: 'other@example.com'
      })
      .returning()
      .execute();

    const otherUser = otherUserResult[0];

    // Create task assigned to other user
    const taskInput = {
      ...testTaskInput,
      assigned_member_id: otherUser.id
    };

    await db.insert(tasksTable)
      .values({
        ...taskInput,
        dependencies: JSON.stringify(taskInput.dependencies)
      })
      .execute();

    const deleteInput: DeleteUserInput = { id: user.id };

    // Should successfully delete user without assigned tasks
    await deleteUser(deleteInput);

    // Verify user is deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(users).toHaveLength(0);

    // Verify other user and task still exist
    const otherUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, otherUser.id))
      .execute();

    expect(otherUsers).toHaveLength(1);

    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.assigned_member_id, otherUser.id))
      .execute();

    expect(tasks).toHaveLength(1);
  });
});
