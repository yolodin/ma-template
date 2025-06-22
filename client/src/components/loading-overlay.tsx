"use client";
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function LoadingOverlay() {
  const { loading: authLoading } = useAuth();
  const [routeLoading, setRouteLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    setRouteLoading(true);
    timeout = setTimeout(() => setRouteLoading(false), 500); // Simulate short route loading
    return () => clearTimeout(timeout);
  }, [pathname]);

  const show = authLoading || routeLoading;

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
      <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600"></div>
    </div>
  );
} 