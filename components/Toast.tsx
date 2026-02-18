import React, { useEffect } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000); // Auto dismiss after 3s
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-green-900/90 border-green-500/50 text-green-100';
      case 'error': return 'bg-red-900/90 border-red-500/50 text-red-100';
      case 'warning': return 'bg-yellow-900/90 border-yellow-500/50 text-yellow-100';
      default: return 'bg-gray-800/90 border-gray-600/50 text-gray-100';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
      case 'error': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'warning': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
      default: return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };

  return (
    <div className={`
      pointer-events-auto mx-4 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-md flex items-center gap-3
      animate-slide-up transform transition-all
      ${getStyles(toast.type)}
    `}>
      <div className="shrink-0">{getIcon(toast.type)}</div>
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
};

export default ToastContainer;
