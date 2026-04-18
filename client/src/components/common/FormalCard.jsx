import React from 'react';

const FormalCard = ({
  children,
  variant = 'default',
  className = '',
  header,
  footer,
  hoverable = true,
  glass = false,
  tech = false,
  ...props
}) => {
  const variantClasses = {
    default: 'formal-card',
    alt: 'formal-card-alt',
    tech: 'tech-card-v2',
    premium: 'formal-card mesh-gradient-vibrant shadow-premium-xl border-primary-300/30 shimmer-sweep',
  };

  const classes = `
    ${variantClasses[variant]}
    ${hoverable ? 'hover-lift' : ''}
    ${glass ? 'glass-premium' : ''}
    ${tech ? 'tech-corner' : ''}
    ${props.glow ? 'shadow-glow-lg' : ''}
    ${className}
  `.trim().split(/\s+/).join(' ');

  return (
    <div className={classes} {...props}>
      {header && (
        <div className="border-b border-primary-100/50 pb-4 mb-4">
          {typeof header === 'string' ? (
            <h3 className="text-lg font-bold text-themed-text">{header}</h3>
          ) : (
            header
          )}
        </div>
      )}
      
      <div className="card-content text-themed-text-sec">
        {children}
      </div>
      
      {footer && (
        <div className="border-t border-primary-100/50 pt-4 mt-4">
          {typeof footer === 'string' ? (
            <p className="text-sm text-themed-text-ter">{footer}</p>
          ) : (
            footer
          )}
        </div>
      )}
    </div>
  );
};

export default FormalCard;
