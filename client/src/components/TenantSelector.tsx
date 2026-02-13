import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Building2, ChevronDown } from 'lucide-react';

export const TenantSelector: React.FC = () => {
  const { selectedTenant, availableTenants, setSelectedTenant } = useTenant();
  const navigate = useNavigate();

  if (availableTenants.length <= 1) {
    // Don't show selector if user only has access to one tenant
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>{selectedTenant?.name || 'Select Tenant'}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {availableTenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => {
              setSelectedTenant(tenant);
              navigate('/dashboard');
            }}
            className={selectedTenant?.id === tenant.id ? 'bg-accent' : ''}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: tenant.primaryColor }}
              />
              <span>{tenant.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

