import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Plus, UserPlus, Trash2, ArrowLeft, Shield } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function TenantUsers() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isManageRolesDialogOpen, setIsManageRolesDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserRoles, setSelectedUserRoles] = useState<string[]>([]);

  const [createForm, setCreateForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    roles: [] as string[],
  });

  const [assignUserId, setAssignUserId] = useState('');

  useEffect(() => {
    if (tenantId) {
      fetchTenantData();
      fetchRoles();
    }
  }, [tenantId]);

  const fetchTenantData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch tenant details
      const tenantResponse = await fetch(`/api/admin/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json();
        setTenant(tenantData);
      }

      // Fetch tenant users
      const usersResponse = await fetch(`/api/admin/tenants/${tenantId}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      // Fetch all users for assignment dropdown
      const allUsersResponse = await fetch('/api/admin/users?pageSize=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (allUsersResponse.ok) {
        const allUsersData = await allUsersResponse.json();
        setAllUsers(allUsersData.items || []);
      }
    } catch (error) {
      console.error('Error fetching tenant data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedUserRoles(data.map((r: Role) => r.name));
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Create user
      const createResponse = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      if (createResponse.ok) {
        const newUser = await createResponse.json();
        
        // Assign user to tenant
        await fetch(`/api/admin/tenants/${tenantId}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userIds: [newUser.id] }),
        });

        setIsCreateDialogOpen(false);
        setCreateForm({
          email: '',
          firstName: '',
          lastName: '',
          password: '',
          roles: [],
        });
        fetchTenantData();
      } else {
        const error = await createResponse.json();
        alert(error.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const handleAssignUser = async () => {
    if (!assignUserId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/tenants/${tenantId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: [assignUserId] }),
      });

      if (response.ok) {
        setIsAssignDialogOpen(false);
        setAssignUserId('');
        fetchTenantData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to assign user');
      }
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Failed to assign user');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this user from the tenant?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/tenants/${tenantId}/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchTenantData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove user');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Failed to remove user');
    }
  };

  const handleOpenManageRoles = async (user: User) => {
    setSelectedUser(user);
    await fetchUserRoles(user.id);
    setIsManageRolesDialogOpen(true);
  };

  const handleUpdateUserRoles = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roles: selectedUserRoles }),
      });

      if (response.ok) {
        setIsManageRolesDialogOpen(false);
        setSelectedUser(null);
        setSelectedUserRoles([]);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update roles');
      }
    } catch (error) {
      console.error('Error updating roles:', error);
      alert('Failed to update roles');
    }
  };

  const toggleRole = (roleName: string) => {
    setSelectedUserRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    );
  };

  const availableUsersToAssign = allUsers.filter(
    (user) => !users.some((u) => u.id === user.id)
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/tenants')}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tenants
        </Button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {tenant?.name} - User Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage users and their access to this tenant
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAssignDialogOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Assign Existing User
            </Button>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New User
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                  No users assigned to this tenant yet
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {user.firstName || user.lastName
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenManageRoles(user)}
                        title="Manage roles"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id)}
                        title="Remove from tenant"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user and assign them to this tenant
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <Label>Roles</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.roles.includes(role.name)}
                      onChange={() => {
                        setCreateForm((prev) => ({
                          ...prev,
                          roles: prev.roles.includes(role.name)
                            ? prev.roles.filter((r) => r !== role.name)
                            : [...prev.roles, role.name],
                        }));
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!createForm.email || !createForm.password}
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Existing User Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Existing User</DialogTitle>
            <DialogDescription>
              Add an existing user to this tenant
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="user-select">Select User</Label>
              <Select value={assignUserId} onValueChange={setAssignUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsersToAssign.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email} {user.firstName ? `(${user.firstName} ${user.lastName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableUsersToAssign.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  All users are already assigned to this tenant
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignUser} disabled={!assignUserId}>
              Assign User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage User Roles Dialog */}
      <Dialog open={isManageRolesDialogOpen} onOpenChange={setIsManageRolesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              Update roles for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label>Roles</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUserRoles.includes(role.name)}
                      onChange={() => toggleRole(role.name)}
                      className="rounded"
                    />
                    <span className="text-sm">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageRolesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUserRoles}>
              Update Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

