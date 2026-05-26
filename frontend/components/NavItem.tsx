import React, { memo } from 'react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isDesktopOpen: boolean;
}

export const NavItem = memo(function NavItem({ icon, label, active, isDesktopOpen }: NavItemProps) {
  return (
    <div 
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 group ${
        active 
          ? 'bg-gradient-to-r from-electric-indigo/20 to-transparent text-white border-l-2 border-electric-indigo' 
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-2 border-transparent'
      }`}
      title={!isDesktopOpen ? label : undefined}
      suppressHydrationWarning
    >
      <div className={`${active ? 'text-electric-indigo' : 'group-hover:text-slate-200'} ${!isDesktopOpen ? 'md:mx-auto' : ''}`}>
        {icon}
      </div>
      <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${!isDesktopOpen ? 'md:max-w-0 md:opacity-0' : 'md:max-w-[150px] md:opacity-100'}`}>{label}</span>
    </div>
  );
});
