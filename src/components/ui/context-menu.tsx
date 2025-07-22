import React from 'react';

// Context Menu Container
export const ContextMenu = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-600 rounded-md shadow-lg backdrop-blur-sm min-w-[160px] py-1 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Context Menu Item
export const ContextMenuItem = ({
  children,
  icon: Icon, // Destructure icon prop
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ComponentType<{ size?: number; className?: string }> }) => (
  <button
    className={`w-full text-left px-3 py-2 text-sm text-gray-200 bg-transparent hover:!bg-gray-700/50 dark:hover:!bg-gray-800/50 flex items-center gap-3 transition-colors duration-150 focus:outline-none focus:!bg-gray-700/50 dark:focus:!bg-gray-800/50 !shadow-none !border-none ${className}`}
    {...props}
  >
    {Icon && <Icon size={16} className="text-gray-400" />} {/* Render icon */}
    <span>{children}</span>
  </button>
);

// Context Menu Root Component
export const ContextMenuRoot = ({ 
  position, 
  children, 
  menuRef 
}: { 
  position: { x: number; y: number } | null; 
  children: React.ReactNode; 
  menuRef: React.RefObject<HTMLDivElement | null>;
}) => {
  if (!position) return null;
  
  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000
      }}
      className="animate-in fade-in-0 zoom-in-95 duration-200"
    >
      {children}
    </div>
  );
};
