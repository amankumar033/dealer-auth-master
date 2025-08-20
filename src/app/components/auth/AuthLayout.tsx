import React, { ReactNode } from 'react';
import Head from 'next/head';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, description }) => {
  return (
    <div className="min-h-screen flex">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>
      
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
      
      {/* Right side - Content */}
      <div className="hidden md:flex md:w-1/2 bg-blue-600 items-center justify-center p-12 text-white">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-6">Dealer Portal</h1>
          <p className="text-xl mb-8">
            Join our network of trusted Dealers and get access to exclusive inventory, 
            special pricing, and marketing tools.
          </p>
          <div className="bg-white rounded-lg p-1 inline-block">
            <img 
              src="/Dealer-image.png" 
              alt="Dealer Benefits" 
              className="rounded-lg"
              width={400}
              height={300}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;