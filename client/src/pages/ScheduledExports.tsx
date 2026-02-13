import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../components/ui/use-toast';
import { useTenant } from '../contexts/TenantContext';
import { PlusCircle, Edit, Trash2, Play, Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface ScheduledExport {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  exportType: 'campaign' | 'campaigns' | 'aggregate';
  format: 'csv' | 'excel' | 'json' | 'xml';
  schedule: string;
  recipients: string[];
  filters?: any;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
  Tenant?: { id: string; name: string };
}

interface ExportHistoryItem {
  id: string;
  format: string;
  status: string;
  fileName?: string;
  fileSize?: number;
  recordCount?: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export default function ScheduledExports() {
  const { selectedTenant, availableTenants, isSuperAdmin } = useTenant();
  const [exports, setExports] = useState<ScheduledExport[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [currentExport, setCurrentExport] = useState<ScheduledExport | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [formState, setFormState] = useState({
    tenantId: selectedTenant?.id || '',
    name: '',
    description: '',
    exportType: 'aggregate' as 'campaign' | 'campaigns' | 'aggregate',
    format: 'excel' as 'csv' | 'excel' | 'json' | 'xml',
    schedule: '0 9 * * 1', // Every Monday at 9 AM
    recipients: '',
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const schedulePresets = [
    { label: 'Every Monday at 9 AM', value: '0 9 * * 1' },
    { label: 'Every Day at 8 AM', value: '0 8 * * *' },
    { label: 'Every Friday at 5 PM', value: '0 17 * * 5' },
    { label: 'First day of month at 9 AM', value: '0 9 1 * *' },
    { label: 'Every 3 hours', value: '0 */3 * * *' },
    { label: 'Custom', value: 'custom' },
  ];

  useEffect(() => {
    if (selectedTenant || isSuperAdmin) {
      fetchScheduledExports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant, isSuperAdmin]);

  const fetchScheduledExports = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/scheduled-exports', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setExports(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch scheduled exports.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching scheduled exports:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while fetching scheduled exports.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExportHistory = async (exportId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/scheduled-exports/${exportId}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setExportHistory(data);
        setIsHistoryDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching export history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch export history.',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormState(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }));
  };

  const handleSwitchChange = (id: string, checked: boolean) => {
    setFormState(prev => ({ ...prev, [id]: checked }));
  };

  const handleCreateClick = () => {
    setCurrentExport(null);
    setFormState({
      tenantId: selectedTenant?.id || '',
      name: '',
      description: '',
      exportType: 'aggregate',
      format: 'excel',
      schedule: '0 9 * * 1',
      recipients: '',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditClick = (exportItem: ScheduledExport) => {
    setCurrentExport(exportItem);
    setFormState({
      tenantId: exportItem.tenantId,
      name: exportItem.name,
      description: exportItem.description || '',
      exportType: exportItem.exportType,
      format: exportItem.format,
      schedule: exportItem.schedule,
      recipients: exportItem.recipients.join(', '),
      isActive: exportItem.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse recipients
    const recipientsArray = formState.recipients
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    if (recipientsArray.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one recipient email is required.',
        variant: 'destructive',
      });
      return;
    }

    const token = localStorage.getItem('token');
    const method = currentExport ? 'PUT' : 'POST';
    const url = currentExport ? `/api/scheduled-exports/${currentExport.id}` : '/api/scheduled-exports';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formState,
          recipients: recipientsArray,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Scheduled export ${currentExport ? 'updated' : 'created'} successfully.`,
        });
        fetchScheduledExports();
        setIsDialogOpen(false);
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || `Failed to ${currentExport ? 'update' : 'create'} scheduled export.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving scheduled export:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while saving the scheduled export.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this scheduled export?')) {
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/scheduled-exports/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Scheduled export deleted successfully.',
        });
        fetchScheduledExports();
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to delete scheduled export.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting scheduled export:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while deleting the scheduled export.',
        variant: 'destructive',
      });
    }
  };

  const handleTrigger = async (id: string, name: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/scheduled-exports/${id}/trigger`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Export "${name}" triggered. You will receive an email when complete.`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to trigger export.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error triggering export:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during export trigger.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading scheduled exports...</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Scheduled Exports</h1>
          <p className="text-muted-foreground">
            Automate data exports with scheduled email delivery.
          </p>
        </div>
        <Button onClick={handleCreateClick} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" /> New Scheduled Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Scheduled Exports</CardTitle>
          <CardDescription>List of all configured scheduled exports.</CardDescription>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <p className="text-center text-muted-foreground">No scheduled exports configured yet.</p>
          ) : (
            <div className="space-y-4">
              {exports.map((exportItem) => (
                <Card key={exportItem.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{exportItem.name}</h3>
                        {exportItem.isActive ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Inactive</span>
                        )}
                      </div>
                      {exportItem.description && (
                        <p className="text-sm text-muted-foreground mt-1">{exportItem.description}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Format:</span>
                          <span className="ml-2 font-medium">{exportItem.format.toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="ml-2 font-medium capitalize">{exportItem.exportType}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Schedule:</span>
                          <span className="ml-2 font-mono text-xs">{exportItem.schedule}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Recipients:</span>
                          <span className="ml-2 font-medium">{exportItem.recipients.length}</span>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        {exportItem.lastRunAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last run: {dayjs(exportItem.lastRunAt).fromNow()}
                          </div>
                        )}
                        {exportItem.Tenant && (
                          <div className="flex items-center gap-1">
                            Tenant: {exportItem.Tenant.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTrigger(exportItem.id, exportItem.name)}
                        title="Trigger Now"
                      >
                        <Play className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchExportHistory(exportItem.id)}
                        title="View History"
                      >
                        <Calendar className="h-4 w-4 text-purple-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(exportItem)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4 text-yellow-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(exportItem.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentExport ? 'Edit Scheduled Export' : 'New Scheduled Export'}</DialogTitle>
            <DialogDescription>
              {currentExport
                ? 'Modify the details of this scheduled export.'
                : 'Create a new scheduled export with automatic email delivery.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            {isSuperAdmin && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tenantId" className="text-right">
                  Tenant *
                </Label>
                <Select
                  value={formState.tenantId}
                  onValueChange={(value) => handleSelectChange('tenantId', value)}
                  disabled={!!currentExport}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTenants.map(tenant => (
                      <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={formState.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Weekly Campaign Report"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formState.description}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="exportType" className="text-right">
                Export Type *
              </Label>
              <Select value={formState.exportType} onValueChange={(value) => handleSelectChange('exportType', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aggregate">Aggregate Metrics</SelectItem>
                  <SelectItem value="campaigns">All Campaigns</SelectItem>
                  <SelectItem value="campaign">Single Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="format" className="text-right">
                Format *
              </Label>
              <Select value={formState.format} onValueChange={(value) => handleSelectChange('format', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (XLSX)</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="schedule" className="text-right">
                Schedule *
              </Label>
              <div className="col-span-3 space-y-2">
                <Select value={formState.schedule} onValueChange={(value) => handleSelectChange('schedule', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {schedulePresets.map(preset => (
                      <SelectItem key={preset.value} value={preset.value}>{preset.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="schedule"
                  value={formState.schedule}
                  onChange={handleInputChange}
                  placeholder="0 9 * * 1 (Cron expression)"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Format: minute hour day month weekday. <a href="https://crontab.guru" target="_blank" rel="noopener noreferrer" className="underline">Learn more</a>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipients" className="text-right">
                Recipients *
              </Label>
              <div className="col-span-3 space-y-1">
                <Textarea
                  id="recipients"
                  value={formState.recipients}
                  onChange={handleInputChange}
                  placeholder="user@example.com, another@example.com"
                  rows={3}
                  required
                />
                <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <Switch
                id="isActive"
                checked={formState.isActive}
                onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{currentExport ? 'Save Changes' : 'Create Scheduled Export'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Export History</DialogTitle>
            <DialogDescription>Recent execution history for this scheduled export.</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {exportHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No history available yet.</p>
            ) : (
              <div className="space-y-2">
                {exportHistory.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {item.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {item.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                          {item.status === 'processing' && <Clock className="h-4 w-4 text-blue-500 animate-spin" />}
                          <span className="font-medium capitalize">{item.status}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">File:</span>
                            <span className="ml-2">{item.fileName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Size:</span>
                            <span className="ml-2">{formatFileSize(item.fileSize)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Records:</span>
                            <span className="ml-2">{item.recordCount || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {item.completedAt
                            ? `Completed ${dayjs(item.completedAt).fromNow()}`
                            : `Started ${dayjs(item.startedAt || item.createdAt).fromNow()}`}
                        </div>
                        {item.error && (
                          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                            <strong>Error:</strong> {item.error}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHistoryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

