const variantClasses = {
  primary: 'bg-brand-primary text-white hover:bg-opacity-90',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  info: 'bg-blue-500 text-white hover:bg-blue-600',
  purple: 'bg-purple-500 text-white hover:bg-purple-600',
  success: 'bg-green-500 text-white hover:bg-green-600',
  warning: 'bg-orange-500 text-white hover:bg-orange-600',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  outline: 'border border-brand-subtle text-brand-text hover:bg-brand-bg',
  ghost: 'text-brand-text hover:bg-brand-bg',
};

const Button = ({ variant = 'primary', className = '', children, ...props }) => {
  const baseClass = 'px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed';
  const variantClass = variantClasses[variant] || variantClasses.primary;
  return (
    <button className={`${baseClass} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
