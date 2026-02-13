import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { TenantSelector } from './TenantSelector';
import ThemeToggle from './ThemeToggle';
import AccessibilitySettings from './AccessibilitySettings';
import { useTenant } from '../contexts/TenantContext';
import { Settings, Users, TrendingUp, Webhook, CalendarClock } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AppHeader() {
  const navigate = useNavigate();
  const { selectedTenant, isSuperAdmin, setIsSuperAdmin, setAvailableTenants } = useTenant();
  const [logo, setLogo] = useState('/bb-logo.svg');

  useEffect(() => {
    // Fetch user's tenants and check if super admin
    const token = localStorage.getItem('token');
    if (token) {
      // Decode JWT to get tenant info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsSuperAdmin(payload.isSuperAdmin || false);
        
        // Fetch tenants for the user
        fetchUserTenants(payload.isSuperAdmin);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  useEffect(() => {
    // Update logo based on selected tenant
    if (selectedTenant?.logoUrl) {
      setLogo(selectedTenant.logoUrl);
    } else {
      setLogo('/bb-logo.svg');
    }
  }, [selectedTenant]);

  const fetchUserTenants = async (isSuperAdmin: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(isSuperAdmin ? '/api/admin/tenants' : '/api/campaigns', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (isSuperAdmin) {
          setAvailableTenants(data.items || []);
        } else {
          // Extract unique tenants from campaigns
          const campaigns = data || [];
          const uniqueTenants = Array.from(
            new Map(campaigns.map((c: any) => [c.Tenant.id, c.Tenant])).values()
          );
          setAvailableTenants(uniqueTenants as any);
        }
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  function onLogout() {
    // Clear session storage auth and token
    sessionStorage.removeItem('dashboard_auth');
    localStorage.removeItem('token');
    localStorage.removeItem('selectedTenantId');
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm no-print">
      <div className="container mx-auto h-20 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img 
            src={logo}
            alt="Logo" 
            className="h-20 w-20 object-contain"
            onError={() => setLogo('/bb-logo.svg')}
          />
        </Link>
        <div className="flex items-center gap-3">
          <TenantSelector />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-2"
            aria-label="View analytics"
          >
            <TrendingUp className="h-4 w-4" />
            Analytics
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/scheduled-exports')}
            className="flex items-center gap-2"
            aria-label="Manage scheduled exports"
          >
            <CalendarClock className="h-4 w-4" />
            Scheduled Exports
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/webhooks')}
            className="flex items-center gap-2"
            aria-label="Manage webhooks"
          >
            <Webhook className="h-4 w-4" />
            Webhooks
          </Button>
          {isSuperAdmin && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/admin/tenants')}
                className="flex items-center gap-2"
                aria-label="Manage tenants"
              >
                <Settings className="h-4 w-4" />
                Tenants
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/admin/users')}
                className="flex items-center gap-2"
                aria-label="Manage users"
              >
                <Users className="h-4 w-4" />
                Users
              </Button>
            </>
          )}
          <ThemeToggle />
          <AccessibilitySettings />
          <Button size="sm" variant="outline" onClick={onLogout} className="border-asda-green text-asda-green hover:bg-asda-green hover:text-white">
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
