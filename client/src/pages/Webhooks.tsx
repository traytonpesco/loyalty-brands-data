import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, BarChart3, Power } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface WebhookStats {
  total: number;
  success: number;
  failed: number;
  pending: number;
  successRate: number;
}

const AVAILABLE_EVENTS = [
  { id: 'campaign.created', label: 'Campaign Created' },
  { id: 'campaign.updated', label: 'Campaign Updated' },
  { id: 'campaign.deleted', label: 'Campaign Deleted' },
  { id: 'campaign.milestone', label: 'Campaign Milestone' },
  { id: 'machine.downtime', label: 'Machine Downtime' },
  { id: 'user.created', label: 'User Created' },
  { id: 'user.deleted', label: 'User Deleted' },
  { id: 'config.changed', label: 'Config Changed' },
  { id: 'csv.uploaded', label: 'CSV Uploaded' },
  { id: 'export.completed', label: 'Export Completed' },
];

export default function Webhooks() {
  const { selectedTenant } = useTenant();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as string[],
    description: '',
  });
  const [stats, setStats] = useState<Record<string, WebhookStats>>({});

  useEffect(() => {
    if (selectedTenant) {
      fetchWebhooks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant]);

  const fetchWebhooks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/webhooks/${selectedTenant?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks);
        
        // Fetch stats for each webhook
        for (const webhook of data.webhooks) {
          fetchWebhookStats(webhook.id);
        }
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWebhookStats = async (webhookId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/webhooks/${webhookId}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({ ...prev, [webhookId]: data.stats }));
      }
    } catch (error) {
      console.error('Error fetching webhook stats:', error);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      alert('Please provide URL and select at least one event');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/webhooks/${selectedTenant?.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWebhook),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Webhook created! Secret: ${data.webhook.secret}\n\nSave this secret - it won't be shown again!`);
        setIsDialogOpen(false);
        setNewWebhook({ url: '', events: [], description: '' });
        fetchWebhooks();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      alert('Failed to create webhook');
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!window.confirm('Delete this webhook? This cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  const handleToggleActive = async (webhookId: string, currentState: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentState }),
      });

      if (response.ok) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  };

  const handleRetryFailed = async (webhookId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/webhooks/${webhookId}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchWebhookStats(webhookId);
      }
    } catch (error) {
      console.error('Error retrying webhook:', error);
    }
  };

  const handleEventToggle = (eventId: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  if (!selectedTenant) {
    return <div className="text-center p-8">Please select a tenant</div>;
  }

  if (isLoading) {
    return <div className="text-center p-8">Loading webhooks...</div>;
  }

  const primaryColor = selectedTenant.primaryColor || '#78BE20';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>
            Webhooks
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure webhook endpoints for {selectedTenant.name}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: primaryColor }}>
              <Plus className="h-4 w-4 mr-2" />
              New Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="url">Endpoint URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/webhook"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
                />
              </div>
              <div>
                <Label>Events</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto p-2 border rounded">
                  {AVAILABLE_EVENTS.map(event => (
                    <label key={event.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={newWebhook.events.includes(event.id)}
                        onCheckedChange={() => handleEventToggle(event.id)}
                      />
                      <span>{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="What is this webhook for?"
                  value={newWebhook.description}
                  onChange={(e) => setNewWebhook({...newWebhook, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWebhook} style={{ backgroundColor: primaryColor }}>
                  Create Webhook
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <p>No webhooks configured yet.</p>
            <p className="mt-2">Create your first webhook to receive real-time event notifications.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {webhooks.map(webhook => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{webhook.url}</CardTitle>
                    {webhook.description && (
                      <CardDescription>{webhook.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(webhook.id, webhook.isActive)}
                      title={webhook.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power className={`h-4 w-4 ${webhook.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetryFailed(webhook.id)}
                      title="Retry failed deliveries"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      title="Delete webhook"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Events ({webhook.events.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map(event => (
                        <span
                          key={event}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>

                  {stats[webhook.id] && (
                    <div>
                      <div className="text-sm font-medium mb-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Delivery Statistics
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{stats[webhook.id].total}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{stats[webhook.id].success}</div>
                          <div className="text-xs text-muted-foreground">Success</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{stats[webhook.id].failed}</div>
                          <div className="text-xs text-muted-foreground">Failed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats[webhook.id].successRate.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Success Rate</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(webhook.createdAt).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How Webhooks Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Webhooks allow you to receive real-time HTTP POST notifications when events occur in your dashboard.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Each webhook has a unique secret for HMAC signature verification</li>
            <li>Failed deliveries are automatically retried with exponential backoff</li>
            <li>Maximum 3 retry attempts per delivery</li>
            <li>30 second timeout per request</li>
          </ul>
          <p className="mt-3">
            <strong>Verify signatures:</strong> Check the <code>X-Webhook-Signature</code> header using HMAC-SHA256.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

