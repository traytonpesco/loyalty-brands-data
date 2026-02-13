import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

type Props = { children: ReactNode; roles?: string[] };

export default function ProtectedRoute({ children }: Props) {
  // Check if user has authenticated - check both token and session
  const token = localStorage.getItem('token');
  const sessionAuth = sessionStorage.getItem('dashboard_auth') === 'true';
  
  const isAuthenticated = !!token || sessionAuth;
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
