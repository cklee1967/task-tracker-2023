
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreateTaskInput, User, Task, TaskStatus } from '../../../server/src/schema';

interface TaskFormProps {
  users: User[];
  allTasks: Task[];
  onSuccess: () => void;
}

export function TaskForm({ users, allTasks, onSuccess }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: null,
    deadline: new Date(),
    assigned_member_id: '',
    effort_spent: 0,
    status: 'todo' as TaskStatus,
    dependencies: []
  });

  const [selectedDependency, setSelectedDependency] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await trpc.createTask.mutate(formData);
      
      // Reset form
      setFormData({
        title: '',
        description: null,
        deadline: new Date(),
        assigned_member_id: '',
        effort_spent: 0,
        status: 'todo' as TaskStatus,
        dependencies: []
      });
      
      onSuccess();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addDependency = () => {
    if (selectedDependency && !formData.dependencies.includes(selectedDependency)) {
      setFormData((prev: CreateTaskInput) => ({
        ...prev,
        dependencies: [...prev.dependencies, selectedDependency]
      }));
      setSelectedDependency('');
    }
  };

  const removeDependency = (dependencyId: string) => {
    setFormData((prev: CreateTaskInput) => ({
      ...prev,
      dependencies: prev.dependencies.filter((id: string) => id !== dependencyId)
    }));
  };

  const getTaskTitle = (taskId: string) => {
    const task = allTasks.find((t: Task) => t.id === taskId);
    return task ? task.title : 'Unknown Task';
  };

  const availableTasks = allTasks.filter((task: Task) => !formData.dependencies.includes(task.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>📝 Task Details</CardTitle>
        <CardDescription>Fill in the information for the new task</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateTaskInput) => ({
                  ...prev,
                  description: e.target.value || null
                }))
              }
              placeholder="Describe the task (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline instanceof Date 
                  ? formData.deadline.toISOString().split('T')[0] 
                  : new Date(formData.deadline).toISOString().split('T')[0]
                }
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTaskInput) => ({ 
                    ...prev, 
                    deadline: new Date(e.target.value) 
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_member">Assigned Member *</Label>
              <Select
                value={formData.assigned_member_id}
                onValueChange={(value: string) =>
                  setFormData((prev: CreateTaskInput) => ({ ...prev, assigned_member_id: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: User) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effort_spent">Effort Spent (hours)</Label>
              <Input
                id="effort_spent"
                type="number"
                min="0"
                step="0.5"
                value={formData.effort_spent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTaskInput) => ({ 
                    ...prev, 
                    effort_spent: parseFloat(e.target.value) || 0 
                  }))
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TaskStatus) =>
                  setFormData((prev: CreateTaskInput) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">📋 To Do</SelectItem>
                  <SelectItem value="in_progress">🏃 In Progress</SelectItem>
                  <SelectItem value="done">✅ Done</SelectItem>
                  <SelectItem value="overdue">🚨 Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Dependencies</Label>
            <div className="flex gap-2">
              <Select
                value={selectedDependency}
                onValueChange={setSelectedDependency}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a task dependency" />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks.map((task: Task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={addDependency}
                disabled={!selectedDependency}
                variant="outline"
              >
                Add
              </Button>
            </div>
            
            {formData.dependencies.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Selected dependencies:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.dependencies.map((depId: string) => (
                    <Badge key={depId} variant="secondary" className="flex items-center gap-1">
                      {getTaskTitle(depId)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-gray-200"
                        onClick={() => removeDependency(depId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading || !formData.title || !formData.assigned_member_id}>
              {isLoading ? 'Creating...' : 'Create Task'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  title: '',
                  description: null,
                  deadline: new Date(),
                  assigned_member_id: '',
                  effort_spent: 0,
                  status: 'todo' as TaskStatus,
                  dependencies: []
                });
                setSelectedDependency('');
              }}
            >
              Reset Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
