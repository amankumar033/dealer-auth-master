'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Dealer {
  dealer_id: string;
  business_name: string;
  name: string;
  email: string;
  phone: string;
  business_address: string;
  city: string;
  state: string;
  pincode: string;
  tax_id: string;
  service_pincodes: string;
  service_types: string;
  is_verified: boolean;
  rating: number;
  created_at: string;
  updated_at: string;
}

interface DealerContextType {
  dealer: Dealer | null;
  setDealer: (dealer: Dealer | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const DealerContext = createContext<DealerContextType | undefined>(undefined);

export function DealerProvider({ children }: { children: ReactNode }) {
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing dealer session in localStorage
    const savedDealer = localStorage.getItem('dealer');
    if (savedDealer) {
      try {
        setDealer(JSON.parse(savedDealer));
      } catch (error) {
        console.error('Error parsing saved dealer:', error);
        localStorage.removeItem('dealer');
      }
    }
    setIsLoading(false);
  }, []);

  const logout = async () => {
    try {
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and storage
      setDealer(null);
      localStorage.removeItem('dealer');
      // Redirect to login page
      window.location.href = '/auth/sign-in';
    }
  };

  const value = {
    dealer,
    setDealer,
    logout,
    isLoading,
  };

  return (
    <DealerContext.Provider value={value}>
      {children}
    </DealerContext.Provider>
  );
}

export function useDealer() {
  const context = useContext(DealerContext);
  if (context === undefined) {
    throw new Error('useDealer must be used within a DealerProvider');
  }
  return context;
} 