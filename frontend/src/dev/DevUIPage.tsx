import { useState, useMemo, useEffect } from 'react';
import DevLayout from './DevLayout';
import PreviewControls from './PreviewControls';
import UIComponents from './categories/UIComponents';
import FormComponents from './categories/FormComponents';
import ProductComponents from './categories/ProductComponents';
import CartComponents from './categories/CartComponents';
import AdminComponents from './categories/AdminComponents';
import { ToolsPanel } from './tools/ToolsPanel';
import { 
  getAllComponents, 
  searchComponents,
  getComponentsByCategory,
  type ComponentRegistryItem,
  type ComponentCategory 
} from './components/registry';

export interface ComponentShowcaseProps {
  selectedCategory: string;
  searchQuery: string;
}

export interface ToolsPanelProps {
  selectedComponent: any;
}

export default function DevUIPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<ComponentRegistryItem | null>(null);
  const [showPreviewControls, setShowPreviewControls] = useState(true);

  // Track recently viewed components
  const handleComponentSelect = (component: ComponentRegistryItem) => {
    setSelectedComponent(component);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }

      // Cmd/Ctrl + / for keyboard shortcuts help
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        alert('Keyboard Shortcuts:\n\nCmd/Ctrl + K: Focus search\nCmd/Ctrl + P: Toggle preview controls\nEsc: Clear search');
      }

      // Cmd/Ctrl + P for preview controls toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setShowPreviewControls(prev => !prev);
      }

      // Escape to clear search
      if (e.key === 'Escape') {
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate component counts by category
  const componentCounts = useMemo(() => {
    const allComponents = getAllComponents();
    const counts: Record<string, number> = {
      all: allComponents.length,
    };
    
    // Count components by category
    allComponents.forEach((comp) => {
      counts[comp.category] = (counts[comp.category] || 0) + 1;
    });
    
    return counts;
  }, []);

  // Filter components based on search and category
  const filteredComponents = useMemo(() => {
    // Use search function if there's a query
    if (searchQuery.trim()) {
      return searchComponents(searchQuery).filter(comp => 
        selectedCategory === 'all' || comp.category === selectedCategory
      );
    }
    
    // Otherwise filter by category
    if (selectedCategory !== 'all') {
      return getComponentsByCategory(selectedCategory as ComponentCategory);
    }
    
    // Return all components
    return getAllComponents();
  }, [selectedCategory, searchQuery]);

  // Render the appropriate category component
  const renderCategoryView = () => {
    switch (selectedCategory) {
      case 'ui':
        return <UIComponents />;
      case 'forms':
        return <FormComponents />;
      case 'products':
        return <ProductComponents />;
      case 'cart':
        return <CartComponents />;
      case 'admin':
        return <AdminComponents />;
      default:
        // Show all components or search results
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {searchQuery ? 'Search Results' : 'All Components'}
              </h2>
              {searchQuery && (
                <p className="text-gray-600 dark:text-gray-400">
                  Found {filteredComponents.length} components matching "{searchQuery}"
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredComponents.length > 0 ? (
                filteredComponents.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleComponentSelect(item)}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.category}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery 
                      ? `No components found matching "${searchQuery}"`
                      : 'Components will appear here once Engineer 2 creates the registry'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <DevLayout 
      selectedCategory={selectedCategory} 
      onCategoryChange={setSelectedCategory}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      componentCounts={componentCounts}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Preview Controls */}
        {showPreviewControls && (
          <PreviewControls
            onViewportChange={() => {}}
            onContainerWidthChange={() => {}}
          />
        )}

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {renderCategoryView()}
            </div>
          </div>

          {/* Tools panel */}
          <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
            <ToolsPanel 
              selectedComponentId={selectedComponent?.id}
              componentProps={selectedComponent?.defaultProps}
              onPropsChange={(props) => {
                // This will be connected to the actual component display
                console.log('Props changed:', props);
              }}
            />
          </div>
        </div>
      </div>
    </DevLayout>
  );
}

