import { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrentUser, useLogout } from '@/hooks/auth/useAuth';
import { VerificationBadge } from '../ui/VerificationBadge';
import { motion, AnimatePresence } from 'framer-motion';

export const UserMenu: React.FC = () => {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    logout.mutate();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-muted hover:bg-muted/80 text-foreground py-2 px-4 
          rounded-md transition duration-300 ease-in-out"
      >
        <User size={18} />
        <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
        <ChevronDown size={16} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 bg-card text-card-foreground rounded-md shadow-lg backdrop-blur-sm overflow-hidden z-50 border border-border"
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <VerificationBadge verified={user.emailVerified} size="sm" />
                <span className="text-xs text-muted-foreground">
                  Email {user.emailVerified ? 'verified' : 'not verified'}
                </span>
              </div>
            </div>

            <div className="py-1">
              <Link
                to="/account/orders"
                onClick={() => setIsOpen(false)}
                className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Package size={16} className="mr-2" />
                My Orders
              </Link>
            </div>
            
            <div className="border-b border-border" />

            <div className="py-1">
              <button
                onClick={handleLogout}
                disabled={logout.isPending}
                className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <LogOut size={16} className="mr-2" />
                {logout.isPending ? 'Logging out...' : 'Log out'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};