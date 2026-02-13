import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useTenant } from '../contexts/TenantContext';
import CampaignOverviewAPI from './CampaignOverviewAPI';
import GenericCampaign from './GenericCampaign';
import MetricCard from '../components/MetricCard';

interface Campaign {
  id: string;
  name: string;
  [key: string]: any;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  isActive: boolean;
}

interface AdminAggregate {
  verifiedEngagement: number;
  journeyCompleted: number;
  totalImpressions: number;
  engagementRate: number;
  completionRate: number;
  qualifiedContacts: number;
  contactRate: number;
  avgDurationSeconds: number;
  deepEngagementPct: number;
  campaignCount: number;
  tenantCount: number;
}

function AdminLanding({
  availableTenants,
  setSelectedTenant,
  isLoadingTenants,
}: {
  availableTenants: Tenant[];
  setSelectedTenant: (t: Tenant | null) => void;
  isLoadingTenants: boolean;
}) {
  const [aggregate, setAggregate] = useState<AdminAggregate | null>(null);
  const accentColor = '#78BE20';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/campaigns/admin/aggregate', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then(setAggregate)
      .catch(() => setAggregate(null));
  }, []);

  if (isLoadingTenants) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading brands...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem' }}>
        <h1 className="text-3xl font-bold mb-2" style={{ color: accentColor }}>
          Brand Portal — Admin
        </h1>
        <p className="text-gray-600 mb-6">Cross-brand overview. Select a brand to view as.</p>

        {aggregate && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Verified Engagement"
              subtitle="How many people chose you"
              value={aggregate.verifiedEngagement.toLocaleString()}
              context={aggregate.totalImpressions > 0 ? `of ${aggregate.totalImpressions.toLocaleString()} passersby = ${aggregate.engagementRate}%` : undefined}
              accentColor={accentColor}
            />
            <MetricCard
              title="Attention Quality"
              subtitle="How long they stayed"
              value={`${aggregate.avgDurationSeconds}s`}
              context={`${aggregate.deepEngagementPct}% deep engagement (60s+)`}
              accentColor={accentColor}
            />
            <MetricCard
              title="Experience Completion"
              subtitle="Did the story land"
              value={`${aggregate.completionRate}%`}
              context={`${aggregate.journeyCompleted.toLocaleString()} completed`}
              accentColor={accentColor}
            />
            <MetricCard
              title="Qualified Contacts"
              subtitle="Permission-based leads"
              value={aggregate.qualifiedContacts.toLocaleString()}
              context={`${aggregate.contactRate}% of engaged`}
              accentColor={accentColor}
            />
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-800 mb-3">Brands</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableTenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-white p-4 rounded-lg shadow border flex items-center justify-between gap-3"
            >
              {tenant.logoUrl ? (
                <img src={tenant.logoUrl} alt="" className="h-10 object-contain flex-shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded flex-shrink-0" style={{ backgroundColor: tenant.primaryColor }} />
              )}
              <span className="font-medium text-gray-800 flex-1 truncate">{tenant.name}</span>
              <button
                type="button"
                onClick={() => setSelectedTenant(tenant)}
                className="px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors flex-shrink-0"
                style={{ backgroundColor: tenant.accentColor || accentColor }}
              >
                View as
              </button>
            </div>
          ))}
        </div>
        {availableTenants.length === 0 && (
          <p className="text-gray-500">No brands yet. Create one from Tenants.</p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { selectedTenant, availableTenants, setAvailableTenants, setSelectedTenant, setIsSuperAdmin } = useTenant();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  // Fetch tenants if not already loaded
  useEffect(() => {
    if (availableTenants.length === 0 && !isLoadingTenants) {
      fetchTenants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTenants = async () => {
    try {
      setIsLoadingTenants(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Decode token to check if super admin
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isSuperAdmin = payload.isSuperAdmin || false;
      setIsSuperAdmin(isSuperAdmin);

      const response = await fetch(isSuperAdmin ? '/api/admin/tenants' : '/api/campaigns', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (isSuperAdmin) {
          const tenants = data.items || [];
          setAvailableTenants(tenants);
          // Do not auto-select tenant for super_admin; they see admin landing until they click "View as"
        } else {
          const campaigns = data || [];
          const uniqueTenants = Array.from(
            new Map(campaigns.map((c: any) => [c.Tenant.id, c.Tenant])).values()
          ) as any[];
          setAvailableTenants(uniqueTenants);
          if (uniqueTenants.length > 0 && !selectedTenant) {
            setSelectedTenant(uniqueTenants[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setIsLoadingTenants(false);
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      // Reset to overview tab when tenant changes
      setActiveTab('overview');
      fetchCampaigns();
    } else {
      // No tenant selected - stop loading
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant]); // Fetch when tenant changes

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const url = `/api/campaigns?tenantId=${selectedTenant?.id}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Super admin with no tenant selected: show admin landing (cross-brand overview + brand list)
  if (isSuperAdmin && !selectedTenant) {
    return (
      <AdminLanding
        availableTenants={availableTenants}
        setSelectedTenant={setSelectedTenant}
        isLoadingTenants={isLoadingTenants}
      />
    );
  }

  // Non–super-admin or no tenant: show loading or prompt
  if (!selectedTenant) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          {isLoadingTenants ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-xl font-semibold text-gray-800 mb-2">Loading your dashboard...</p>
              <p className="text-gray-600">Fetching tenant data</p>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-gray-800 mb-2">No Tenant Available</p>
              <p className="text-gray-600">Please contact your administrator to get access to a tenant.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  const primaryColor = selectedTenant.primaryColor;
  const secondaryColor = selectedTenant.secondaryColor;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {isSuperAdmin && (
        <div
          className="flex items-center justify-between gap-4 px-4 py-2 no-print"
          style={{ backgroundColor: 'rgba(0,0,0,0.06)', borderBottom: '1px solid #e5e7eb' }}
        >
          <span className="text-sm font-medium text-gray-700">
            Viewing as: <strong>{selectedTenant.name}</strong>
          </span>
          <button
            type="button"
            onClick={() => setSelectedTenant(null)}
            className="text-sm font-medium px-3 py-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Back to all brands
          </button>
        </div>
      )}
      <div style={{ maxWidth: '80rem', margin: '0 auto', paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div style={{ paddingLeft: '8.5rem', paddingRight: '1rem' }}>
          {selectedTenant.logoUrl ? (
            <img 
              src={selectedTenant.logoUrl}
              alt={selectedTenant.name} 
              style={{ height: '3.5rem', marginBottom: '1.5rem', objectFit: 'contain' }}
            />
          ) : (
            <h1 
              className="text-4xl font-bold mb-6" 
              style={{ color: primaryColor }}
            >
              {selectedTenant.name}
            </h1>
          )}
        </div>
        
        <div style={{ paddingLeft: '8.5rem', paddingRight: '1rem' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" id="main-content">
            <TabsList 
              className="inline-flex h-10 items-center justify-center rounded-md p-1 text-muted-foreground"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <TabsTrigger 
                value="overview"
                style={{ 
                  color: activeTab === 'overview' ? 'white' : secondaryColor,
                  backgroundColor: activeTab === 'overview' ? primaryColor : 'transparent'
                }}
              >
                Overview
              </TabsTrigger>
              {campaigns.map((campaign) => (
                <TabsTrigger 
                  key={campaign.id} 
                  value={campaign.id}
                  style={{ 
                    color: activeTab === campaign.id ? 'white' : secondaryColor,
                    backgroundColor: activeTab === campaign.id ? primaryColor : 'transparent'
                  }}
                >
                  {campaign.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <CampaignOverviewAPI />
            </TabsContent>

            {campaigns.map((campaign) => (
              <TabsContent key={campaign.id} value={campaign.id} className="space-y-4">
                <GenericCampaign campaignId={campaign.id} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

