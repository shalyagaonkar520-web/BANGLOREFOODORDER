import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'kitchen_staff' | 'delivery_partner' | 'customer'>;
}

export default function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { user, profile, initialized, loading } = useAuthStore();

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FF5A1F] flex items-center justify-center shadow-[0_8px_24px_rgba(255,90,31,0.3)] animate-pulse">
          <span className="text-2xl">🍽️</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF5A1F]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const userRole = profile?.role || 'customer';

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
