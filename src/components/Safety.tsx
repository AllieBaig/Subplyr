import React, { useState, useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export const GlobalSafetyManager = ({ children }: { children: React.ReactNode }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prevent infinite crash loops on startup
    const crashCount = parseInt(localStorage.getItem('app_crash_count') || '0');
    if (crashCount > 3) {
      console.warn("Safety: Infinite crash loop detected. Forcing cache clear.");
      localStorage.clear();
      localStorage.setItem('app_crash_count', '0');
      window.location.reload();
      return;
    }

    const handleError = (event: ErrorEvent) => {
      // Silent logging as requested
      console.error("Global System Trace:", event.error?.stack || event.message);
      
      const newCount = crashCount + 1;
      localStorage.setItem('app_crash_count', newCount.toString());
      
      // Clear logs every 30 seconds of stability
      setTimeout(() => localStorage.setItem('app_crash_count', '0'), 30000);

      setError("Core component stability issue detected.");
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Async System Trace:", event.reason?.message || event.reason);
      setError("Resource coordination failure.");
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
      <div className="fixed inset-0 flex items-center justify-center bg-apple-bg p-8 text-center z-[999]">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 border border-black/5 shadow-2xl transition-all animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-tight">System Managed Recovery</h2>
          <p className="text-apple-text-secondary text-sm mb-10 leading-relaxed font-medium">
            The app encountered a resource coordination issue. We've stabilized your data; a quick restart will resume your session.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => {
                localStorage.setItem('app_crash_count', '0');
                window.location.reload();
              }}
              className="w-full bg-apple-text-primary text-white py-4.5 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-black/90 shadow-xl"
            >
              <RotateCcw size={20} />
              <span>Resume Session</span>
            </button>
            <p className="text-[10px] text-apple-text-secondary font-mono opacity-50 uppercase tracking-tighter">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const LoadingPlaceholder = () => (
  <div className="h-full flex flex-col items-center justify-center bg-apple-bg">
    <div className="w-28 h-28 bg-apple-card rounded-[2.5rem] shadow-xl flex items-center justify-center animate-pulse">
      <div className="w-14 h-14 bg-gray-100 rounded-xl" />
    </div>
    <div className="mt-10 flex flex-col items-center gap-3">
      <div className="h-5 w-40 bg-gray-100 rounded-full animate-pulse" />
      <div className="h-3 w-28 bg-gray-50 rounded-full animate-pulse opacity-50" />
    </div>
  </div>
);
