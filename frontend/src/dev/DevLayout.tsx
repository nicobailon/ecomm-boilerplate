import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/Input';

interface DevLayoutProps {
  children: ReactNode;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  componentCounts?: Record<string, number>;
}

const categories = [
  { id: 'all', name: 'All Components', icon: '🏠' },
  { id: 'ui', name: 'UI Components', icon: '🎨' },
  { id: 'forms', name: 'Form Components', icon: '📝' },
  { id: 'products', name: 'Product Components', icon: '📦' },
  { id: 'cart', name: 'Cart Components', icon: '🛒' },
  { id: 'admin', name: 'Admin Components', icon: '⚙️' },
];

export default function DevLayout({
  children,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  componentCounts = {},
}: DevLayoutProps) {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🛠️</span>
            <span className="text-xl font-bold">Dev UI</span>
          </Link>
        </div>

        {/* Search */}
        <div className="p-4">
          <Input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-content">
          <ul className="p-2">
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  onClick={() => onCategoryChange(category.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="text-sm font-medium flex-1">{category.name}</span>
                  {componentCounts[category.id] !== undefined && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                      {componentCounts[category.id]}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to App
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}