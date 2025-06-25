import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebSocketPanel } from './WebSocketPanel';
import { FeatureFlagsPanel } from './FeatureFlagsPanel';
import { MockDataPanel } from './MockDataPanel';
import { PropEditor, commonPropSchemas } from './PropEditor';
import { Badge } from '@/components/ui/Badge';
import { 
  Wifi, 
  ToggleLeft, 
  Database, 
  Settings2, 
  Wrench,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface ToolsPanelProps {
  selectedComponentId?: string;
  componentProps?: Record<string, any>;
  onPropsChange?: (props: Record<string, any>) => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ 
  selectedComponentId,
  componentProps = {},
  onPropsChange 
}) => {
  const tabs = [
    {
      id: 'websocket',
      label: 'WebSocket',
      icon: Wifi,
      description: 'Simulate WebSocket connections and messages',
    },
    {
      id: 'feature-flags',
      label: 'Feature Flags',
      icon: ToggleLeft,
      description: 'Toggle feature flags and experiments',
    },
    {
      id: 'mock-data',
      label: 'Mock Data',
      icon: Database,
      description: 'Generate mock data for testing',
    },
    {
      id: 'props',
      label: 'Props Editor',
      icon: Settings2,
      description: 'Edit component props',
      badge: selectedComponentId ? 'Active' : undefined,
    },
    {
      id: 'info',
      label: 'Info',
      icon: Info,
      description: 'Development tools information',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="websocket" className="flex-1 flex flex-col">
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Developer Tools
            </h2>
            {selectedComponentId && (
              <Badge variant="outline">
                Component: {selectedComponentId}
              </Badge>
            )}
          </div>
          
          <TabsList className="grid grid-cols-5 w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2 relative"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-1 -right-1 h-5 px-1 text-xs"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <TabsContent value="websocket" className="mt-0 h-full">
            <WebSocketPanel />
          </TabsContent>

          <TabsContent value="feature-flags" className="mt-0 h-full">
            <FeatureFlagsPanel />
          </TabsContent>

          <TabsContent value="mock-data" className="mt-0 h-full">
            <MockDataPanel />
          </TabsContent>

          <TabsContent value="props" className="mt-0 h-full">
            {selectedComponentId && onPropsChange ? (
              <PropEditor
                props={componentProps}
                onChange={onPropsChange}
                schema={commonPropSchemas[selectedComponentId]}
              />
            ) : (
              <Card className="p-8">
                <div className="text-center space-y-4">
                  <Settings2 className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="text-lg font-semibold">No Component Selected</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Select a component from the registry to edit its props
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="info" className="mt-0 h-full">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Development Tools Guide</h3>
              
              <div className="space-y-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <div key={tab.id} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">{tab.label}</h4>
                        <p className="text-sm text-gray-600 mt-1">{tab.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t">
                <h4 className="font-medium mb-3">Keyboard Shortcuts</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toggle Tools Panel</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Cmd+Shift+D</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Switch Tabs</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">1-5</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Copy Props</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Cmd+C</kbd>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-3">Tips</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Use the WebSocket panel to test real-time features</li>
                  <li>• Toggle feature flags without reloading the page</li>
                  <li>• Generate mock data for any component type</li>
                  <li>• Edit props in real-time to see changes instantly</li>
                  <li>• All settings persist in local storage</li>
                </ul>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};