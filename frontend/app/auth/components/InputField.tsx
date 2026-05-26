import { InputHTMLAttributes, ReactNode, forwardRef, memo } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: ReactNode;
  error?: string;
  rightLabel?: ReactNode;
  rightIcon?: ReactNode;
}

export const InputField = memo(forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, icon, error, rightLabel, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col mb-4">
        <div className="flex items-center justify-between mb-2 h-4">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest ml-1 block leading-none">
            {label}
          </label>
          {rightLabel && <div className="leading-none flex items-center">{rightLabel}</div>}
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110 z-10">
            {icon}
          </div>
          <input
            ref={ref}
            className={`block w-full pl-12 ${rightIcon ? 'pr-12' : 'pr-4'} py-3.5 border border-glass-border/50 rounded-xl leading-5 bg-obsidian-light/40 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyber-purple/60 focus:border-cyber-purple/60 transition-all duration-300 sm:text-sm backdrop-blur-xl shadow-inner disabled:opacity-50 disabled:cursor-not-allowed relative z-0 ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center z-10">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-red-400 text-xs mt-1 ml-1">{error}</p>}
      </div>
    );
  }
));
InputField.displayName = 'InputField';
