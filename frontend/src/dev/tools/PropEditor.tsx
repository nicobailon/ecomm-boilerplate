import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { AlertCircle, Code, Copy, Check, RotateCcw } from 'lucide-react';

interface PropEditorProps {
  props: Record<string, any>;
  onChange: (props: Record<string, any>) => void;
  schema?: PropSchema;
}

interface PropSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'select' | 'json' | 'function';
    label?: string;
    description?: string;
    options?: Array<{ label: string; value: any }>;
    required?: boolean;
    defaultValue?: any;
  };
}

export const PropEditor: React.FC<PropEditorProps> = ({ props, onChange, schema }) => {
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonValue, setJsonValue] = useState(JSON.stringify(props, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setJsonValue(JSON.stringify(props, null, 2));
  }, [props]);

  const handleJsonChange = (value: string) => {
    setJsonValue(value);
    setJsonError(null);
    
    try {
      const parsed = JSON.parse(value);
      onChange(parsed);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  };

  const handlePropChange = (key: string, value: any) => {
    const newProps = { ...props, [key]: value };
    onChange(newProps);
  };

  const handleAddProp = () => {
    const key = prompt('Enter property name:');
    if (key && !props.hasOwnProperty(key)) {
      handlePropChange(key, '');
    }
  };

  const handleRemoveProp = (key: string) => {
    const newProps = { ...props };
    delete newProps[key];
    onChange(newProps);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (schema) {
      const defaultProps: Record<string, any> = {};
      Object.entries(schema).forEach(([key, config]) => {
        if (config.defaultValue !== undefined) {
          defaultProps[key] = config.defaultValue;
        }
      });
      onChange(defaultProps);
    } else {
      onChange({});
    }
  };

  const renderPropInput = (key: string, value: any, schemaConfig?: PropSchema[string]) => {
    const type = schemaConfig?.type || typeof value;

    switch (type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <Label htmlFor={key}>{schemaConfig?.label || key}</Label>
            <Switch
              id={key}
              checked={value}
              onCheckedChange={(checked) => handlePropChange(key, checked)}
            />
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>{schemaConfig?.label || key}</Label>
            <Input
              id={key}
              type="number"
              value={value}
              onChange={(e) => handlePropChange(key, Number(e.target.value))}
            />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>{schemaConfig?.label || key}</Label>
            <Select
              value={value}
              onChange={(e) => handlePropChange(key, e.target.value)}
              options={schemaConfig?.options || []}
            />
          </div>
        );

      case 'json':
      case 'object':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>{schemaConfig?.label || key}</Label>
            <Textarea
              id={key}
              value={JSON.stringify(value, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handlePropChange(key, parsed);
                } catch (error) {
                  // Invalid JSON, don't update
                }
              }}
              className="font-mono text-xs"
              rows={4}
            />
          </div>
        );

      case 'function':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>
              {schemaConfig?.label || key}
              <Badge variant="outline" className="ml-2 text-xs">Function</Badge>
            </Label>
            <div className="p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
              {value?.toString() || 'undefined'}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>{schemaConfig?.label || key}</Label>
            <Input
              id={key}
              value={value}
              onChange={(e) => handlePropChange(key, e.target.value)}
            />
          </div>
        );
    }
  };

  const propEntries = schema 
    ? Object.entries(schema).map(([key, config]) => [key, props[key] ?? config.defaultValue])
    : Object.entries(props);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Props Editor</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setJsonMode(!jsonMode)}
            size="sm"
            variant="outline"
          >
            <Code className="w-4 h-4 mr-2" />
            {jsonMode ? 'Form Mode' : 'JSON Mode'}
          </Button>
          <Button
            onClick={handleReset}
            size="sm"
            variant="ghost"
            title="Reset to defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {jsonMode ? (
        <div className="space-y-4">
          <div className="relative">
            <Textarea
              value={jsonValue}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="font-mono text-sm"
              rows={12}
              placeholder="Enter JSON props..."
            />
            <Button
              onClick={handleCopy}
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          {jsonError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <div>
                <p className="font-medium">JSON Error</p>
                <p className="text-sm">{jsonError}</p>
              </div>
            </Alert>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {propEntries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No props defined. Click "Add Prop" to get started.
            </p>
          ) : (
            propEntries.map(([key, value]) => (
              <div key={key} className="relative">
                {renderPropInput(key, value, schema?.[key])}
                {!schema && (
                  <button
                    onClick={() => handleRemoveProp(key)}
                    className="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs hover:bg-red-200"
                    title="Remove prop"
                  >
                    ×
                  </button>
                )}
                {schema?.[key]?.description && (
                  <p className="text-xs text-gray-500 mt-1">{schema[key].description}</p>
                )}
              </div>
            ))
          )}
          
          {!schema && (
            <Button
              onClick={handleAddProp}
              size="sm"
              variant="outline"
              className="w-full"
            >
              Add Prop
            </Button>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{Object.keys(props).length} props</span>
          <span>{jsonMode ? 'JSON' : 'Form'} mode</span>
        </div>
      </div>
    </Card>
  );
};

// Example schema for common components
export const commonPropSchemas: Record<string, PropSchema> = {
  button: {
    children: { type: 'string', label: 'Text', defaultValue: 'Button' },
    variant: {
      type: 'select',
      label: 'Variant',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Destructive', value: 'destructive' },
        { label: 'Outline', value: 'outline' },
        { label: 'Ghost', value: 'ghost' },
        { label: 'Link', value: 'link' },
      ],
      defaultValue: 'default',
    },
    size: {
      type: 'select',
      label: 'Size',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Default', value: 'default' },
        { label: 'Large', value: 'lg' },
        { label: 'Icon', value: 'icon' },
      ],
      defaultValue: 'default',
    },
    disabled: { type: 'boolean', label: 'Disabled', defaultValue: false },
    isLoading: { type: 'boolean', label: 'Loading', defaultValue: false },
    onClick: { type: 'function', label: 'Click Handler' },
  },
  input: {
    placeholder: { type: 'string', label: 'Placeholder', defaultValue: 'Enter text...' },
    value: { type: 'string', label: 'Value', defaultValue: '' },
    type: {
      type: 'select',
      label: 'Type',
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Email', value: 'email' },
        { label: 'Password', value: 'password' },
        { label: 'Number', value: 'number' },
        { label: 'Date', value: 'date' },
      ],
      defaultValue: 'text',
    },
    disabled: { type: 'boolean', label: 'Disabled', defaultValue: false },
    required: { type: 'boolean', label: 'Required', defaultValue: false },
  },
};