
import { pgTable, uuid, text, timestamp, real, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Task status enum
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done', 'overdue']);

// Users table
export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'), // Nullable
  deadline: timestamp('deadline').notNull(),
  assigned_member_id: uuid('assigned_member_id').notNull().references(() => usersTable.id),
  effort_spent: real('effort_spent').notNull().default(0),
  status: taskStatusEnum('status').notNull().default('todo'),
  dependencies: jsonb('dependencies').notNull().default([]), // Array of UUIDs stored as JSON
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  tasks: many(tasksTable),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  assignedMember: one(usersTable, {
    fields: [tasksTable.assigned_member_id],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  tasks: tasksTable 
};
