import type { HTMLAttributes } from 'react';
import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  className?: string;
  portalId?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  triggerRef,
  children,
  className,
  portalId,
  ...props
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  
  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    
    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Position above if not enough space below
      const shouldFlip = spaceBelow < 300 && spaceAbove > spaceBelow;
      
      setPosition({
        top: shouldFlip ? rect.top - 8 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };
    
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, triggerRef]);
  
  if (!isOpen) return null;
  
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        zIndex: 999999,
        pointerEvents: 'auto',
      }}
      className={cn(
        'bg-popover text-popover-foreground border rounded-md shadow-lg backdrop-blur-sm',
        className
      )}
      data-portal-id={portalId}
      data-radix-popper-content-wrapper=""
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
};