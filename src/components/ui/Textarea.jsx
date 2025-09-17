const Textarea = ({ className = '', ...props }) => (
  <textarea
    className={`w-full mt-1 px-4 py-2 border border-brand-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary ${className}`}
    {...props}
  />
);

export default Textarea;
