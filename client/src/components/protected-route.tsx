'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && roles && !roles.includes(user.role)) {
      // Redirect to appropriate page based on role
      if (user.role === 'parent') {
        router.push('/students');
      } else if (user.role === 'student') {
        router.push('/classes');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router, roles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-dojo-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Check if user has required role
  if (roles && !roles.includes(user.role)) {
    return null; // Will redirect to appropriate page
  }

  return <>{children}</>;
} 