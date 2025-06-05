
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].email).toEqual('john.doe@example.com');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(testInput);

    // Attempt to create user with same email
    await expect(createUser(testInput)).rejects.toThrow(/unique/i);
  });

  it('should handle different user data correctly', async () => {
    const anotherInput: CreateUserInput = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    };

    const result = await createUser(anotherInput);

    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify it's saved in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, 'jane.smith@example.com'))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('Jane Smith');
  });
});
