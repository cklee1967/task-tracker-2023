
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Mail, User } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreateUserInput, User as UserType } from '../../../server/src/schema';

interface UserManagementProps {
  users: UserType[];
  onUsersChange: () => void;
}

export function UserManagement({ users, onUsersChange }: UserManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateUserInput>({
    name: '',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await trpc.createUser.mutate(formData);
      
      // Reset form
      setFormData({
        name: '',
        email: ''
      });
      
      onUsersChange();
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Add New User Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Team Member
            </CardTitle>
            <CardDescription>
              Add a new user to assign tasks to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isLoading || !formData.name || !formData.email}>
                  {isLoading ? 'Adding...' : 'Add User'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({ name: '', email: '' })}
                >
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* User Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👥 Team Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Team Members</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {users.length}
                </Badge>
              </div>
              <Separator />
              <div className="text-sm text-gray-600">
                {users.length === 0 
                  ? "No team members yet. Add your first team member to start assigning tasks!"
                  : `You have ${users.length} team member${users.length === 1 ? '' : 's'} ready to take on tasks.`
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Team Members ({users.length})
        </h3>
        
        {users.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-500 text-center">
                No team members added yet. Use the form above to add your first team member!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user: UserType) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">{user.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500">
                    <span>📅 Joined: {formatDate(user.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
