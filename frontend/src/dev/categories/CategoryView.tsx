import { useState } from 'react';
import type { ComponentCategory, ComponentRegistryItem } from '../components/registry';
import { getComponentsByCategory } from '../components/registry';
import ComponentDisplay from '../ComponentDisplay';

interface CategoryViewProps {
  category: ComponentCategory;
  title: string;
  description: string;
}

export default function CategoryView({ category, title, description }: CategoryViewProps) {
  const components = getComponentsByCategory(category);
  const [selectedComponent, setSelectedComponent] = useState<ComponentRegistryItem | null>(null);
  const [currentProps, setCurrentProps] = useState<Record<string, unknown>>({});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>

      {selectedComponent ? (
        <>
          <button
            onClick={() => setSelectedComponent(null)}
            className="mb-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to {title.toLowerCase()}
          </button>
          <ComponentDisplay
            component={selectedComponent.component}
            metadata={{
              name: selectedComponent.name,
              category: selectedComponent.category,
              description: selectedComponent.description,
              props: selectedComponent.defaultProps,
              examples: selectedComponent.variations?.map(v => ({
                title: v.name,
                props: v.props,
              })),
            }}
            currentProps={currentProps}
            onPropsChange={setCurrentProps}
          />
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {components.length > 0 ? (
            components.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedComponent(item);
                  setCurrentProps(item.defaultProps ?? {});
                }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <h3 className="font-semibold mb-2">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                )}
                {item.subcategory && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {item.subcategory}
                  </p>
                )}
                {item.status && (
                  <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                    item.status === 'stable' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    item.status === 'beta' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {item.status}
                  </span>
                )}
                {item.variations && item.variations.length > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {item.variations.length} variations
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No {category} components found
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}