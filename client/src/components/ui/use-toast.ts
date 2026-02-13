// Simple toast hook implementation
import { useState } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = `toast-${toastCount++}`;
    const newToast: Toast = { id, title, description, variant };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);

    return { id };
  };

  const dismiss = (toastId?: string) => {
    setToasts((prev) => 
      toastId ? prev.filter((t) => t.id !== toastId) : []
    );
  };

  return {
    toast,
    dismiss,
    toasts,
  };
}

