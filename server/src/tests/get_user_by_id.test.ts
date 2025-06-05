
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type GetUserByIdInput } from '../schema';
import { getUserById } from '../handlers/get_user_by_id';

describe('getUserById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get user by id', async () => {
    // Create a test user
    const testUser = await db.insert(usersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .returning()
      .execute();

    const userId = testUser[0].id;
    const input: GetUserByIdInput = { id: userId };

    const result = await getUserById(input);

    expect(result.id).toEqual(userId);
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user not found', async () => {
    const input: GetUserByIdInput = { 
      id: '00000000-0000-0000-0000-000000000000' 
    };

    await expect(getUserById(input)).rejects.toThrow(/not found/i);
  });

  it('should return correct user when multiple users exist', async () => {
    // Create multiple test users
    const users = await db.insert(usersTable)
      .values([
        { name: 'User One', email: 'user1@example.com' },
        { name: 'User Two', email: 'user2@example.com' },
        { name: 'User Three', email: 'user3@example.com' }
      ])
      .returning()
      .execute();

    const targetUserId = users[1].id; // Get second user
    const input: GetUserByIdInput = { id: targetUserId };

    const result = await getUserById(input);

    expect(result.id).toEqual(targetUserId);
    expect(result.name).toEqual('User Two');
    expect(result.email).toEqual('user2@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
