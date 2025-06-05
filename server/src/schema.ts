
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for updating users
export const updateUserInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Task status enum
export const taskStatusEnum = z.enum(['todo', 'in_progress', 'done', 'overdue']);
export type TaskStatus = z.infer<typeof taskStatusEnum>;

// Task schema
export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  deadline: z.coerce.date(),
  assigned_member_id: z.string().uuid(),
  effort_spent: z.number().nonnegative(),
  status: taskStatusEnum,
  dependencies: z.array(z.string().uuid()),
  created_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  deadline: z.coerce.date(),
  assigned_member_id: z.string().uuid(),
  effort_spent: z.number().nonnegative().default(0),
  status: taskStatusEnum.default('todo'),
  dependencies: z.array(z.string().uuid()).default([])
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  deadline: z.coerce.date().optional(),
  assigned_member_id: z.string().uuid().optional(),
  effort_spent: z.number().nonnegative().optional(),
  status: taskStatusEnum.optional(),
  dependencies: z.array(z.string().uuid()).optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Query schema for filtering tasks
export const taskFilterSchema = z.object({
  status: taskStatusEnum.optional(),
  assigned_member_id: z.string().uuid().optional(),
  overdue_only: z.boolean().optional(),
  deadline_before: z.coerce.date().optional(),
  deadline_after: z.coerce.date().optional()
});

export type TaskFilter = z.infer<typeof taskFilterSchema>;

// Get task by ID input
export const getTaskByIdInputSchema = z.object({
  id: z.string().uuid()
});

export type GetTaskByIdInput = z.infer<typeof getTaskByIdInputSchema>;

// Get user by ID input
export const getUserByIdInputSchema = z.object({
  id: z.string().uuid()
});

export type GetUserByIdInput = z.infer<typeof getUserByIdInputSchema>;

// Delete task input
export const deleteTaskInputSchema = z.object({
  id: z.string().uuid()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;

// Delete user input
export const deleteUserInputSchema = z.object({
  id: z.string().uuid()
});

export type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;
