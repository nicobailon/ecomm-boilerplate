import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './Navbar';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useGuestCartSync } from '@/hooks/cart/useGuestCartSync';

function RootLayout() {
  useGuestCartSync();
  return (
    <div className='min-h-screen bg-background text-foreground relative overflow-hidden'>
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute inset-0'>
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.3)_0%,rgba(10,80,60,0.2)_45%,rgba(0,0,0,0.1)_100%)]' />
        </div>
      </div>

      <div className='relative z-50 pt-20'>
        <Navbar />
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </div>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: 'bg-background text-foreground border-border',
        }}
      />
    </div>
  );
}

export default RootLayout;