
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          name: 'John Doe',
          email: 'john@example.com'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com'
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Check first user
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].email).toEqual('john@example.com');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Check second user
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[1].email).toEqual('jane@example.com');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return users in consistent order', async () => {
    // Create multiple users
    const testUsers = [
      { name: 'Alice Brown', email: 'alice@example.com' },
      { name: 'Bob Wilson', email: 'bob@example.com' },
      { name: 'Charlie Davis', email: 'charlie@example.com' }
    ];

    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result1 = await getUsers();
    const result2 = await getUsers();

    expect(result1).toHaveLength(3);
    expect(result2).toHaveLength(3);
    
    // Results should be consistent between calls
    expect(result1.map(u => u.email)).toEqual(result2.map(u => u.email));
  });
});
