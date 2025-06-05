
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Clock, CheckCircle, Plus, Users } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { TaskForm } from '@/components/TaskForm';
import { UserManagement } from '@/components/UserManagement';
import type { Task, User } from '../../server/src/schema';

interface DashboardData {
  overdue: Task[];
  nearingDeadline: Task[];
  inProgress: Task[];
  total: number;
}

function App() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    overdue: [],
    nearingDeadline: [],
    inProgress: [],
    total: 0
  });
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const loadDashboardData = useCallback(async () => {
    try {
      const result = await trpc.getDashboardTasks.query();
      setDashboardData(result);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, []);

  const loadAllTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setAllTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadDashboardData(), loadAllTasks(), loadUsers()]);
    } finally {
      setIsLoading(false);
    }
  }, [loadDashboardData, loadAllTasks, loadUsers]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'done': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find((u: User) => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-1">{task.title}</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Assigned to: {getUserName(task.assigned_member_id)}
            </CardDescription>
          </div>
          <Badge className={`${getStatusColor(task.status)} flex items-center gap-1`}>
            {getStatusIcon(task.status)}
            {task.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {task.description && (
          <p className="text-gray-700 mb-3">{task.description}</p>
        )}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>📅 Due: {formatDate(task.deadline)}</span>
          <span>⏱️ {task.effort_spent}h spent</span>
        </div>
        {task.dependencies.length > 0 && (
          <div className="mt-2 text-sm">
            <span className="text-gray-600">Dependencies: {task.dependencies.length} task(s)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task management system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">📋 Task Management System</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {dashboardData.total} total tasks
              </span>
              <Button
                onClick={() => setActiveTab('create-task')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="all-tasks" className="flex items-center gap-2">
              📋 All Tasks
            </TabsTrigger>
            <TabsTrigger value="create-task" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Task
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-red-800">🚨 Overdue Tasks</CardTitle>
                    <Badge variant="destructive">{dashboardData.overdue.length}</Badge>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-yellow-800">⏰ Nearing Deadline</CardTitle>
                    <Badge className="bg-yellow-100 text-yellow-800">{dashboardData.nearingDeadline.length}</Badge>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-blue-800">🏃 In Progress</CardTitle>
                    <Badge className="bg-blue-100 text-blue-800">{dashboardData.inProgress.length}</Badge>
                  </div>
                </CardHeader>
              </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Overdue Tasks ({dashboardData.overdue.length})
                </h2>
                {dashboardData.overdue.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-gray-500 text-center">🎉 No overdue tasks!</p>
                    </CardContent>
                  </Card>
                ) : (
                  dashboardData.overdue.map((task: Task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4 text-yellow-700 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Nearing Deadline ({dashboardData.nearingDeadline.length})
                </h2>
                {dashboardData.nearingDeadline.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-gray-500 text-center">✅ All tasks have comfortable deadlines</p>
                    </CardContent>
                  </Card>
                ) : (
                  dashboardData.nearingDeadline.map((task: Task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="all-tasks">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">All Tasks ({allTasks.length})</h2>
            </div>
            
            <div className="grid gap-4">
              {allTasks.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-500 text-center">No tasks created yet. Create your first task!</p>
                  </CardContent>
                </Card>
              ) : (
                allTasks.map((task: Task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="create-task">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold mb-6">Create New Task</h2>
              <TaskForm 
                users={users} 
                allTasks={allTasks}
                onSuccess={loadAllData}
              />
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement users={users} onUsersChange={loadUsers} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
