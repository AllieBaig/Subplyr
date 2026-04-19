import React, { useState, useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export const GlobalSafetyManager = ({ children }: { children: React.ReactNode }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global Safety caught error:", event.error);
      setError(event.error?.message || "An unexpected error occurred");
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Global Safety caught rejection:", event.reason);
      setError(event.reason?.message || "A background process failed");
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-apple-bg p-8 text-center">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-2xl">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-apple-text-secondary text-sm mb-8">
            The application encountered an error and needs to restart.
          </p>
          <div className="bg-red-50 rounded-2xl p-4 mb-8 text-left">
             <p className="text-[10px] font-mono text-red-600 break-words line-clamp-2">
               {error}
             </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-apple-text-primary text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <RotateCcw size={20} />
            <span>Restart Application</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const LoadingPlaceholder = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-apple-bg">
    <div className="w-24 h-24 bg-apple-card rounded-[2rem] shadow-xl flex items-center justify-center animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-lg" />
    </div>
    <div className="mt-8 flex flex-col items-center gap-2">
      <div className="h-4 w-32 bg-gray-200 rounded-full animate-pulse" />
      <div className="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
    </div>
  </div>
);
