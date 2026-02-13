import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface TenantContextType {
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant | null) => void;
  availableTenants: Tenant[];
  setAvailableTenants: (tenants: Tenant[]) => void;
  isLoading: boolean;
  isSuperAdmin: boolean;
  setIsSuperAdmin: (value: boolean) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [selectedTenant, setSelectedTenantState] = useState<Tenant | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Load selected tenant from localStorage on mount
  useEffect(() => {
    const savedTenantId = localStorage.getItem('selectedTenantId');
    if (savedTenantId && availableTenants.length > 0) {
      const tenant = availableTenants.find(t => t.id === savedTenantId);
      if (tenant) {
        setSelectedTenantState(tenant);
      } else if (availableTenants.length > 0) {
        // If saved tenant not found, select first available
        setSelectedTenantState(availableTenants[0]);
      }
    } else if (availableTenants.length > 0 && !selectedTenant) {
      // Auto-select first tenant if none selected
      setSelectedTenantState(availableTenants[0]);
    }
    setIsLoading(false);
  }, [availableTenants]);

  const setSelectedTenant = (tenant: Tenant | null) => {
    setSelectedTenantState(tenant);
    if (tenant) {
      localStorage.setItem('selectedTenantId', tenant.id);
      applyBranding(tenant);
    } else {
      localStorage.removeItem('selectedTenantId');
    }
  };

  // Apply tenant branding to CSS variables
  const applyBranding = (tenant: Tenant) => {
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary', tenant.primaryColor);
    root.style.setProperty('--tenant-secondary', tenant.secondaryColor);
    root.style.setProperty('--tenant-accent', tenant.accentColor);
  };

  // Apply branding when tenant changes
  useEffect(() => {
    if (selectedTenant) {
      applyBranding(selectedTenant);
    }
  }, [selectedTenant]);

  return (
    <TenantContext.Provider
      value={{
        selectedTenant,
        setSelectedTenant,
        availableTenants,
        setAvailableTenants,
        isLoading,
        isSuperAdmin,
        setIsSuperAdmin
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

