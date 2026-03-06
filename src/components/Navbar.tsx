import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Menu, X, User, LogOut, Package } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin') || user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className="font-bold text-2xl tracking-tight text-gray-900">ServiceMarket</span>
            </Link>
            
            {!isAdmin && (
              <div className="hidden md:flex items-center relative">
                <input 
                  type="text" 
                  placeholder="What service are you looking for?" 
                  className="w-96 pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button className="absolute right-0 top-0 h-full px-3 bg-gray-900 text-white rounded-r-md hover:bg-gray-800">
                  <Search size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-gray-600 hover:text-green-600 font-medium flex items-center gap-1">
                    <User size={18} /> Admin Panel
                  </Link>
                )}
                {user.role === 'user' && (
                  <Link to="/orders" className="text-gray-600 hover:text-green-600 font-medium flex items-center gap-1">
                    <Package size={18} /> My Orders
                  </Link>
                )}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  <button onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-green-600 font-medium">Sign In</Link>
                <Link to="/signup" className="text-gray-600 hover:text-green-600 font-medium px-4 py-1.5 border border-green-500 text-green-500 rounded hover:bg-green-50 transition-colors">
                  Join
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 hover:text-gray-900">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Home</Link>
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Admin Panel</Link>
                )}
                <Link to="/orders" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">My Orders</Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Sign In</Link>
                <Link to="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-green-600 hover:bg-green-50">Join</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
