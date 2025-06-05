
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  name: 'John Doe',
  email: 'john@example.com'
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user name only', async () => {
    // Create initial user
    const createResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = createResult[0].id;

    // Update only name
    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Jane Smith'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('john@example.com'); // Email unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update user email only', async () => {
    // Create initial user
    const createResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = createResult[0].id;

    // Update only email
    const updateInput: UpdateUserInput = {
      id: userId,
      email: 'jane@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.name).toEqual('John Doe'); // Name unchanged
    expect(result.email).toEqual('jane@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and email', async () => {
    // Create initial user
    const createResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = createResult[0].id;

    // Update both fields
    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated user to database', async () => {
    // Create initial user
    const createResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = createResult[0].id;

    // Update user
    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    await updateUser(updateInput);

    // Verify changes persisted to database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('Updated Name');
    expect(users[0].email).toEqual('updated@example.com');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Random UUID

    const updateInput: UpdateUserInput = {
      id: nonExistentId,
      name: 'Updated Name'
    };

    expect(updateUser(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle empty update gracefully', async () => {
    // Create initial user
    const createResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const userId = createResult[0].id;

    // Update with no fields (technically valid input)
    const updateInput: UpdateUserInput = {
      id: userId
    };

    const result = await updateUser(updateInput);

    // Should return user unchanged
    expect(result.id).toEqual(userId);
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user with empty update', async () => {
    const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Random UUID

    const updateInput: UpdateUserInput = {
      id: nonExistentId
    };

    expect(updateUser(updateInput)).rejects.toThrow(/not found/i);
  });
});
