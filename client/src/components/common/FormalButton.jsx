import React from 'react';

const FormalButton = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  fullWidth = false,
  icon: Icon = null,
  tech = true,
  ...props
}) => {
  const baseClass = 'btn-formal';
  
  const variantClasses = {
    primary: 'btn-formal-primary shimmer-sweep',
    secondary: 'btn-formal-secondary',
    outline: 'btn-formal-outline',
    danger: 'btn-formal-danger',
    success: 'btn-formal-success',
    premium: 'btn-formal-primary shadow-premium-xl shimmer-sweep ring-2 ring-primary-500/20 ring-offset-2',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const techClasses = tech ? 'interactive-scale btn-tech' : '';

  const classes = `
    ${baseClass}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${techClasses}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim().split(/\s+/).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      <span className="inline-flex items-center gap-2">
        {loading && (
          <span className="inline-block animate-spin">⟳</span>
        )}
        {Icon && !loading && <Icon size={18} />}
        {children}
      </span>
    </button>
  );
};

export default FormalButton;
