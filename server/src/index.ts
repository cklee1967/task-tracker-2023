
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { 
  createUserInputSchema, 
  getUserByIdInputSchema, 
  updateUserInputSchema, 
  deleteUserInputSchema,
  createTaskInputSchema,
  getTaskByIdInputSchema,
  updateTaskInputSchema,
  deleteTaskInputSchema,
  taskFilterSchema
} from './schema';

import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { getUserById } from './handlers/get_user_by_id';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { getTaskById } from './handlers/get_task_by_id';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { getDashboardTasks } from './handlers/get_dashboard_tasks';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // User operations
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),
  
  getUserById: publicProcedure
    .input(getUserByIdInputSchema)
    .query(({ input }) => getUserById(input)),
  
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  
  deleteUser: publicProcedure
    .input(deleteUserInputSchema)
    .mutation(({ input }) => deleteUser(input)),
  
  // Task operations
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
  
  getTasks: publicProcedure
    .input(taskFilterSchema.optional())
    .query(({ input }) => getTasks(input)),
  
  getTaskById: publicProcedure
    .input(getTaskByIdInputSchema)
    .query(({ input }) => getTaskById(input)),
  
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),
  
  deleteTask: publicProcedure
    .input(deleteTaskInputSchema)
    .mutation(({ input }) => deleteTask(input)),
  
  // Dashboard
  getDashboardTasks: publicProcedure
    .query(() => getDashboardTasks()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
