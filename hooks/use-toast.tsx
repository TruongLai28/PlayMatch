'use client'

import { toast } from 'sonner'

export function useToast() {
  const success = (message: string) => {
    toast.success(message)
  }

  const error = (message: string) => {
    toast.error(message)
  }

  const info = (message: string) => {
    toast.info(message)
  }

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    switch (type) {
      case 'success':
        return success(message)
      case 'error':
        return error(message)
      case 'info':
      default:
        return info(message)
    }
  }

  return {
    success,
    error,
    info,
    addToast,
    // Legacy props for backward compatibility
    toasts: [],
    removeToast: () => {}
  }
}

// Legacy ToastContainer component for backward compatibility
export function ToastContainer() {
  return null
}