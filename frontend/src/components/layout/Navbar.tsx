import { ShoppingCart, UserPlus, LogIn, Lock } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/auth/useAuth';
import { useUnifiedCart } from '@/hooks/cart/useUnifiedCart';
import { ThemeToggle } from '../ui/theme-toggle';
import { UserMenu } from './UserMenu';

const Navbar: React.FC = () => {
	const { data: user } = useCurrentUser();
	const { totalQuantity } = useUnifiedCart();
	const location = useLocation();
	
	const isAdmin = user?.role === 'admin';
	const cartItemsCount = totalQuantity;

	return (
		<header className='fixed top-0 left-0 w-full bg-background/90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b border-border'>
			<div className='container mx-auto px-4 py-3'>
				<div className='flex flex-wrap justify-between items-center'>
					<Link to='/' className='text-2xl font-bold text-primary items-center space-x-2 flex'>
						E-Commerce
					</Link>

					<nav className='flex flex-wrap items-center gap-4'>
						<NavLink
							to={'/'}
							className={({ isActive }) => 
								`${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'} transition duration-300
					 ease-in-out`
							}
						>
							Home
						</NavLink>
						<Link
							to={'/cart'}
							className='relative group text-muted-foreground hover:text-primary transition duration-300 
						ease-in-out'
						>
							<ShoppingCart className='inline-block mr-1 group-hover:text-primary' size={20} />
							<span className='hidden sm:inline'>Cart</span>
							{cartItemsCount > 0 && (
								<span
									className='absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 
								text-xs group-hover:bg-primary/90 transition duration-300 ease-in-out'
								>
									{cartItemsCount}
								</span>
							)}
						</Link>
						{isAdmin && (
							location.pathname === '/secret-dashboard' ? (
								<div
									className='bg-primary/80 cursor-default text-primary-foreground px-3 py-1 rounded-md font-medium
									 transition duration-300 ease-in-out flex items-center'
								>
									<Lock className='inline-block mr-1' size={18} />
									<span className='hidden sm:inline'>Dashboard</span>
								</div>
							) : (
								<NavLink
									className={({ isActive }) => 
										`${isActive ? 'bg-primary/80' : 'bg-primary hover:bg-primary/90'} text-primary-foreground px-3 py-1 rounded-md font-medium
									 transition duration-300 ease-in-out flex items-center`
									}
									to={'/secret-dashboard'}
								>
									<Lock className='inline-block mr-1' size={18} />
									<span className='hidden sm:inline'>Dashboard</span>
								</NavLink>
							)
						)}

						{user ? (
							<UserMenu />
						) : (
							<>
								<Link
									to={'/signup'}
									className='bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 
									rounded-md flex items-center transition duration-300 ease-in-out'
								>
									<UserPlus className='mr-2' size={18} />
									Sign Up
								</Link>
								<Link
									to={'/login'}
									className='bg-muted hover:bg-muted/80 text-foreground py-2 px-4 
									rounded-md flex items-center transition duration-300 ease-in-out'
								>
									<LogIn className='mr-2' size={18} />
									Login
								</Link>
							</>
						)}
						<ThemeToggle />
					</nav>
				</div>
			</div>
		</header>
	);
};

export default Navbar;