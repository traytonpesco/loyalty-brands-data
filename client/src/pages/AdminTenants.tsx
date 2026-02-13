import React, { useEffect, useState } from 'react';
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
import { extractColorsFromImage } from '../utils/colorExtractor';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Plus, Edit, Upload, Users, Palette, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [selectedTenantForUpload, setSelectedTenantForUpload] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const navigate = useNavigate();
  const { setSelectedTenant } = useTenant();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logoUrl: '',
    primaryColor: '#78BE20',
    secondaryColor: '#006633',
    accentColor: '#78BE20',
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/tenants', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTenants(data.items || []);
      } else if (response.status === 403) {
        // User doesn't have permission
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl || '',
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        accentColor: tenant.accentColor,
      });
    } else {
      setEditingTenant(null);
      setFormData({
        name: '',
        slug: '',
        logoUrl: '',
        primaryColor: '#78BE20',
        secondaryColor: '#006633',
        accentColor: '#78BE20',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveTenant = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingTenant
        ? `/api/admin/tenants/${editingTenant.id}`
        : '/api/admin/tenants';
      
      const method = editingTenant ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        fetchTenants();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save tenant');
      }
    } catch (error) {
      console.error('Error saving tenant:', error);
      alert('Failed to save tenant');
    }
  };

  const handleUploadCSV = async () => {
    if (!csvFile || !selectedTenantForUpload) return;

    try {
      setUploadStatus('Uploading...');
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      const response = await fetch(`/api/admin/tenants/${selectedTenantForUpload}/upload-csv`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus('Upload successful!');
        setTimeout(() => {
          setIsUploadDialogOpen(false);
          setUploadStatus('');
          setCsvFile(null);
        }, 2000);
      } else {
        const error = await response.json();
        setUploadStatus(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setUploadStatus('Upload failed');
    }
  };

  const handleOpenUploadDialog = (tenantId: string) => {
    setSelectedTenantForUpload(tenantId);
    setIsUploadDialogOpen(true);
    setCsvFile(null);
    setUploadStatus('');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading tenants...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <p className="text-gray-600 mt-1">Manage tenants, branding, and data uploads</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Tenant
        </Button>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Branding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{tenant.slug}</code>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: tenant.primaryColor }}
                      title="Primary"
                    />
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: tenant.secondaryColor }}
                      title="Secondary"
                    />
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: tenant.accentColor }}
                      title="Accent"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      tenant.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTenant({
                          id: tenant.id,
                          name: tenant.name,
                          slug: tenant.slug,
                          logoUrl: tenant.logoUrl,
                          primaryColor: tenant.primaryColor,
                          secondaryColor: tenant.secondaryColor,
                          accentColor: tenant.accentColor,
                          isActive: tenant.isActive,
                        });
                        navigate('/dashboard');
                      }}
                      title="View as this brand"
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View as
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(tenant)}
                      title="Edit tenant"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenUploadDialog(tenant.id)}
                      title="Upload CSV"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/tenants/${tenant.id}/users`)}
                      title="Manage users"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Tenant Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTenant ? 'Edit Tenant' : 'Create New Tenant'}</DialogTitle>
            <DialogDescription>
              Configure tenant details and branding customization.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Tenant Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Acme Brand"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug (URL identifier)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  placeholder="asda-demo"
                />
              </div>
            </div>

            <div>
              <Label>Logo — upload to auto-detect brand colors</Label>
              <Input
                type="file"
                accept="image/*"
                className="mt-1"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setFormData((prev) => ({ ...prev, logoUrl: url }));
                    try {
                      const brandColors = await extractColorsFromImage(file);
                      setFormData((prev) => ({
                        ...prev,
                        primaryColor: brandColors.primary,
                        secondaryColor: brandColors.secondary,
                        accentColor: brandColors.accent,
                      }));
                    } catch (err) {
                      console.warn('Could not extract colors from logo:', err);
                    }
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a brand logo to automatically fill primary, secondary, and accent colors. You can adjust them below.
              </p>
            </div>
            <div>
              <Label htmlFor="logoUrl">Logo URL (optional, or use upload above)</Label>
              <Input
                id="logoUrl"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="/logo.png"
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="h-4 w-4" />
                <Label>Brand Colors</Label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      placeholder="#78BE20"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      placeholder="#006633"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="accentColor"
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      placeholder="#78BE20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTenant}>
              {editingTenant ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload CSV Data</DialogTitle>
            <DialogDescription>
              Upload campaign data CSV file for this tenant.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="csvFile">CSV File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
            </div>
            
            {uploadStatus && (
              <div className={`p-3 rounded ${
                uploadStatus.includes('Error') || uploadStatus.includes('failed')
                  ? 'bg-red-100 text-red-800'
                  : uploadStatus.includes('successful')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {uploadStatus}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadCSV} disabled={!csvFile || uploadStatus === 'Uploading...'}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

