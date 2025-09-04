// src/components/Toast.jsx
import React, { useEffect } from 'react';

const Toast = ({ 
  isVisible, 
  type = 'success', // 'success', 'error', 'warning', 'info'
  message, 
  onClose, 
  duration = 3000,
  position = 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center'
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = "fixed z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out";
    
    const positionStyles = {
      'top-right': 'top-4 right-4 translate-x-0',
      'top-left': 'top-4 left-4 translate-x-0',
      'bottom-right': 'bottom-4 right-4 translate-x-0',
      'bottom-left': 'bottom-4 left-4 translate-x-0',
      'top-center': 'top-4 left-1/2 -translate-x-1/2'
    };

    return `${baseStyles} ${positionStyles[position]}`;
  };

  const getTypeStyles = () => {
    const styles = {
      success: {
        bg: 'bg-slate-50 border-slate-200',
        icon: '✓',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        textColor: 'text-slate-700'
      },
      error: {
        bg: 'bg-slate-50 border-slate-200',
        icon: '✕',
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
        textColor: 'text-slate-700'
      },
      warning: {
        bg: 'bg-slate-50 border-slate-200',
        icon: '⚠',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        textColor: 'text-slate-700'
      },
      info: {
        bg: 'bg-slate-50 border-slate-200',
        icon: 'ⓘ',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        textColor: 'text-slate-700'
      }
    };
    return styles[type] || styles.info;
  };

  const typeStyles = getTypeStyles();

  return (
    <div className={getToastStyles()}>
      <div className={`
        ${typeStyles.bg} 
        border 
        rounded-lg 
        shadow-lg 
        backdrop-blur-sm 
        p-4
        flex 
        items-start 
        space-x-3
        animate-in
        slide-in-from-top-2
        fade-in
      `}>
        {/* Icon */}
        <div className={`
          ${typeStyles.iconBg} 
          ${typeStyles.iconColor}
          w-8 
          h-8 
          rounded-full 
          flex 
          items-center 
          justify-center 
          text-sm 
          font-medium
          flex-shrink-0
        `}>
          {typeStyles.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`${typeStyles.textColor} text-sm leading-relaxed`}>
            {message}
          </p>
        </div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="
            text-slate-400 
            hover:text-slate-600 
            transition-colors 
            flex-shrink-0
            p-1
            -m-1
            rounded
            hover:bg-slate-100
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Custom hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = React.useState([]);

  const showToast = (message, type = 'success', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      ...options
    };
    
    setToasts(prev => [...prev, toast]);
    return id;
  };

  const hideToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          isVisible={true}
          type={toast.type}
          message={toast.message}
          onClose={() => hideToast(toast.id)}
          duration={toast.duration}
          position={toast.position}
        />
      ))}
    </>
  );

  return {
    showToast,
    hideToast,
    ToastContainer
  };
};

export default Toast;