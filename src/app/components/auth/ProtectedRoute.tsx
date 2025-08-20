'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDealer } from '@/contexts/DealerContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { dealer, isLoading } = useDealer();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !dealer) {
      router.push('/auth/sign-in');
    }
  }, [dealer, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!dealer) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
} 