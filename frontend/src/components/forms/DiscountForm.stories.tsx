import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiscountForm } from './DiscountForm';
import { within, userEvent, expect, waitFor, fn } from '@storybook/test';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProductSelector } from '@/components/product/ProductSelector';
import type { Discount } from '@/types/discount';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/Badge';
import { Info, Shuffle, Calendar, DollarSign, Users, AlertCircle, RefreshCw, Save, AlertTriangle, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/Alert';

// mockProducts removed - was unused

const mockDiscount: Discount = {
  _id: 'disc1',
  code: 'SUMMER2024',
  discountPercentage: 20,
  expirationDate: addDays(new Date(), 30).toISOString(),
  isActive: true,
  description: 'Summer sale - 20% off all items',
  currentUses: 45,
  maxUses: 100,
  minimumPurchaseAmount: 50,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Extended form with product restrictions and advanced options
const ExtendedDiscountForm = ({ 
  mode, 
  initialData,
}: { 
  mode: 'create' | 'edit';
  initialData?: Discount;
}) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [userRestrictions, setUserRestrictions] = useState({
    newCustomersOnly: false,
    onePerCustomer: false,
    minimumItems: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateCode = () => {
    const prefixes = ['SAVE', 'DEAL', 'SHOP', 'GET', 'OFF'];
    const suffixes = ['NOW', '2024', 'TODAY', 'SALE', 'DEAL'];
    const numbers = Math.floor(Math.random() * 100);
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix}${numbers}${suffix}`;
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Prepare discount data with selected products and restrictions
    const fullData = {
      ...data,
      discountType,
      applicableProducts: selectedProducts,
      userRestrictions,
    };
    
    // Submit discount data
    console.log('Full discount data:', fullData);
    toast.success(mode === 'create' ? 'Discount created!' : 'Discount updated!');
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <DiscountForm
            mode={mode}
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const code = generateCode();
                const input = document.querySelector<HTMLInputElement>('input[name="code"]')!;
                input.value = code;
                input.dispatchEvent(new Event('input', { bubbles: true }));
              }}
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Generate Code
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="restrictions" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Usage Restrictions</h3>
            
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Customers Only</p>
                  <p className="text-sm text-muted-foreground">
                    Limit to first-time buyers
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={userRestrictions.newCustomersOnly}
                  onChange={(e) => setUserRestrictions({
                    ...userRestrictions,
                    newCustomersOnly: e.target.checked,
                  })}
                  className="w-4 h-4"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">One Per Customer</p>
                  <p className="text-sm text-muted-foreground">
                    Each customer can only use once
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={userRestrictions.onePerCustomer}
                  onChange={(e) => setUserRestrictions({
                    ...userRestrictions,
                    onePerCustomer: e.target.checked,
                  })}
                  className="w-4 h-4"
                />
              </div>
              
              <div>
                <label className="font-medium">Minimum Items in Cart</label>
                <input
                  type="number"
                  value={userRestrictions.minimumItems}
                  onChange={(e) => setUserRestrictions({
                    ...userRestrictions,
                    minimumItems: parseInt(e.target.value) || 0,
                  })}
                  className="w-full mt-2 p-2 border rounded-md"
                  min="0"
                />
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Product Restrictions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Leave empty to apply to all products, or select specific products
            </p>
            <ProductSelector
              selectedProductIds={selectedProducts}
              onSelectionChange={setSelectedProducts}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {selectedProducts.length === 0 
                ? 'Applies to all products' 
                : `Applies to ${selectedProducts.length} selected products`}
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Advanced Options</h3>
            
            <Card className="p-4 space-y-4">
              <div>
                <p className="font-medium mb-2">Discount Type</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="discountType"
                      value="percentage"
                      checked={discountType === 'percentage'}
                      onChange={() => setDiscountType('percentage')}
                    />
                    <span>Percentage</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="discountType"
                      value="fixed"
                      checked={discountType === 'fixed'}
                      onChange={() => setDiscountType('fixed')}
                    />
                    <span>Fixed Amount</span>
                  </label>
                </div>
              </div>
              
              <div>
                <p className="font-medium mb-2">Stacking Rules</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Can this discount be combined with others?
                </p>
                <select className="w-full p-2 border rounded-md">
                  <option value="no-stacking">Cannot be combined</option>
                  <option value="stack-with-sales">Can combine with sale prices</option>
                  <option value="stack-all">Can combine with other discounts</option>
                </select>
              </div>
              
              <div>
                <p className="font-medium mb-2">Scheduling</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Start Date</label>
                    <input
                      type="datetime-local"
                      className="w-full mt-1 p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">End Date</label>
                    <input
                      type="datetime-local"
                      className="w-full mt-1 p-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <Toaster position="top-right" />
    </div>
  );
};

const meta = {
  title: 'Forms/DiscountForm',
  component: DiscountForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onSubmit: fn(),
  },
} satisfies Meta<typeof DiscountForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
  args: {
    mode: 'create',
  },
};

export const EditMode: Story = {
  args: {
    mode: 'edit',
    initialData: mockDiscount,
  },
};

export const CodeGeneration: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => <ExtendedDiscountForm mode="create" />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click generate code button
    const generateButton = canvas.getByRole('button', { name: /generate code/i });
    await userEvent.click(generateButton);
    
    // Check that a code was generated
    const codeInput = canvas.getByPlaceholderText('SUMMER2024');
    void expect((codeInput as HTMLInputElement).value).toMatch(/^[A-Z]+\d+[A-Z]+$/);
  },
};

export const PercentageSlider: Story = {
  args: {
    mode: 'create',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the percentage input
    const percentageInput = canvas.getByRole('spinbutton', { name: /percentage/i });
    
    // Clear and type new value
    await userEvent.clear(percentageInput);
    await userEvent.type(percentageInput, '35');
    
    // Should update slider
    const slider = canvas.getByRole('slider', { name: /discount percentage slider/i });
    void expect(slider).toHaveAttribute('aria-valuenow', '35');
  },
};

export const ValidationErrors: Story = {
  args: {
    mode: 'create',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Clear required fields
    const codeInput = canvas.getByPlaceholderText('SUMMER2024');
    await userEvent.clear(codeInput);
    
    // Set invalid percentage
    const percentageInput = canvas.getByRole('spinbutton', { name: /percentage/i });
    await userEvent.clear(percentageInput);
    await userEvent.type(percentageInput, '150');
    
    // Submit form
    const submitButton = canvas.getByRole('button', { name: /create discount/i });
    await userEvent.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      void expect(canvas.getByText(/discount code must be/i)).toBeInTheDocument();
      void expect(canvas.getByText(/must be between 0 and 100/i)).toBeInTheDocument();
    });
  },
};

export const ExpirationDate: Story = {
  args: {
    mode: 'create',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Set expiration date
    const dateInput = canvas.getByLabelText(/expiration date/i);
    const futureDate = format(addDays(new Date(), 7), 'yyyy-MM-dd\'T\'HH:mm');
    
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, futureDate);
  },
};

export const UsageLimits: Story = {
  args: {
    mode: 'create',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Set max uses
    const maxUsesInput = canvas.getByLabelText(/max uses/i);
    await userEvent.type(maxUsesInput, '50');
    
    // Set minimum purchase
    const minPurchaseInput = canvas.getByLabelText(/min purchase/i);
    await userEvent.type(minPurchaseInput, '100');
  },
};

export const ProductRestrictions: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => <ExtendedDiscountForm mode="create" />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Navigate to products tab
    const productsTab = canvas.getByRole('tab', { name: /products/i });
    await userEvent.click(productsTab);
    
    // Select some products
    await waitFor(() => {
      const firstProduct = canvas.getByText('Premium Headphones');
      void expect(firstProduct).toBeInTheDocument();
    });
  },
};

export const AdvancedOptions: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => <ExtendedDiscountForm mode="create" />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Navigate to advanced tab
    const advancedTab = canvas.getByRole('tab', { name: /advanced/i });
    await userEvent.click(advancedTab);
    
    // Select fixed amount discount type
    const fixedRadio = canvas.getByLabelText(/fixed amount/i);
    await userEvent.click(fixedRadio);
    
    // Set stacking rules
    const stackingSelect = canvas.getByRole('combobox');
    await userEvent.selectOptions(stackingSelect, 'stack-with-sales');
  },
};

export const LoadingState: Story = {
  args: {
    mode: 'create',
    isSubmitting: true,
  },
};

export const ActiveStatusToggle: Story = {
  args: {
    mode: 'edit',
    initialData: mockDiscount,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Toggle active status
    const activeSwitch = canvas.getByRole('switch', { name: /active status/i });
    await userEvent.click(activeSwitch);
    
    // Should show disabled message
    await waitFor(() => {
      void expect(canvas.getByText(/code is disabled/i)).toBeInTheDocument();
    });
    
    // Toggle back
    await userEvent.click(activeSwitch);
    
    // Should show active message
    await waitFor(() => {
      void expect(canvas.getByText(/customers can use this code/i)).toBeInTheDocument();
    });
  },
};

export const DiscountPreview: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [formData, setFormData] = useState<any>(null);
      
      return (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Create Discount</h3>
            <DiscountForm
              mode="create"
              onSubmit={(data) => {
                setFormData(data);
                toast.success('Discount preview updated!');
              }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Preview</h3>
            {formData ? (
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-bold">{formData.code}</h4>
                    <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>{formData.discountPercentage}% off</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Expires {format(new Date(formData.expirationDate as string), 'MMM d, yyyy')}</span>
                    </div>
                    {formData.maxUses && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>Max {formData.maxUses} uses</span>
                      </div>
                    )}
                    {formData.minimumPurchaseAmount && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>Min ${formData.minimumPurchaseAmount}</span>
                      </div>
                    )}
                  </div>
                  
                  {formData.description && (
                    <p className="text-muted-foreground">{formData.description}</p>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                <p>Fill out the form to see a preview</p>
              </Card>
            )}
          </div>
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const MobileView: Story = {
  args: {
    mode: 'create',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => <ExtendedDiscountForm mode="create" />,
  ],
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const BulkCodeGeneration: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [codes, setCodes] = useState<string[]>([]);
      
      const generateBulkCodes = (count: number) => {
        const newCodes = Array.from({ length: count }, () => {
          const prefixes = ['SAVE', 'DEAL', 'SHOP', 'GET', 'OFF'];
          const numbers = Math.floor(Math.random() * 10000);
          const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
          return `${prefix}${numbers}`;
        });
        setCodes(newCodes);
      };
      
      return (
        <div className="space-y-6">
          <Card className="p-4 bg-info/10 border-info/20">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Bulk Code Generation</p>
                <p className="text-muted-foreground">
                  Generate multiple unique discount codes at once for campaigns
                </p>
              </div>
            </div>
          </Card>
          
          <div className="flex gap-2">
            <Button onClick={() => generateBulkCodes(5)}>
              Generate 5 Codes
            </Button>
            <Button onClick={() => generateBulkCodes(10)} variant="outline">
              Generate 10 Codes
            </Button>
            <Button onClick={() => setCodes([])} variant="ghost">
              Clear
            </Button>
          </div>
          
          {codes.length > 0 && (
            <Card className="p-4">
              <h4 className="font-semibold mb-2">Generated Codes</h4>
              <div className="grid grid-cols-2 gap-2">
                {codes.map((code, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <code className="text-sm font-mono">{code}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void navigator.clipboard.writeText(code);
                        toast.success(`Copied ${code}`);
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          <DiscountForm mode="create" onSubmit={fn()} />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

// Enhanced Error State Stories
export const SaveError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [saveError, setSaveError] = useState<string | null>(null);
      const [isSubmitting, setIsSubmitting] = useState(false);
      
      const simulateSaveError = async () => {
        setIsSubmitting(true);
        setSaveError(null);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSaveError('Failed to save discount. Please try again.');
        setIsSubmitting(false);
        toast.error('Failed to save discount');
      };
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Save Error Simulation</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Click save to simulate a server error
            </p>
            <Button onClick={simulateSaveError} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Discount
                </>
              )}
            </Button>
          </Card>
          
          {saveError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          
          <DiscountForm mode="create" onSubmit={fn()} />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const DuplicateCodeError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [codeError, setCodeError] = useState<string | null>(null);
      
      return (
        <div className="space-y-4">
          <Card className="p-4 border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <h4 className="font-medium">Duplicate Code Warning</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              The code &quot;SUMMER2024&quot; is already in use
            </p>
          </Card>
          
          {codeError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{codeError}</AlertDescription>
            </Alert>
          )}
          
          <DiscountForm 
            mode="create" 
            initialData={{ code: 'SUMMER2024' } as any}
            onSubmit={async () => {
              setCodeError('A discount with this code already exists');
              toast.error('Duplicate code detected');
            }} 
          />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const InvalidDateError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [dateError, setDateError] = useState(true);
      
      return (
        <div className="space-y-4">
          {dateError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Invalid Date Configuration</p>
                  <p className="text-sm">Expiration date cannot be in the past</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDateError(false)}
                  >
                    Fix Date
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <DiscountForm 
            mode="create" 
            initialData={{
              code: 'EXPIRED',
              expirationDate: new Date('2020-01-01').toISOString(),
            } as any}
            onSubmit={fn()} 
          />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const UsageLimitError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [limitError, setLimitError] = useState<string | null>(null);
      
      const checkUsageLimit = () => {
        setLimitError('This discount has reached its usage limit (100/100)');
        toast.error('Usage limit reached');
      };
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Usage Limit Check</h4>
              <Badge variant="destructive">100/100 Uses</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              This discount has reached its maximum usage
            </p>
            <Button size="sm" onClick={checkUsageLimit}>
              Check Usage
            </Button>
          </Card>
          
          {limitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{limitError}</AlertDescription>
            </Alert>
          )}
          
          <DiscountForm 
            mode="edit" 
            initialData={{
              ...mockDiscount,
              currentUses: 100,
              maxUses: 100,
            }}
            onSubmit={fn()} 
          />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const ProductRestrictionError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [productError, setProductError] = useState(false);
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Product Restriction Error Demo</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Some selected products are no longer available
            </p>
            <Button
              size="sm"
              onClick={() => {
                setProductError(true);
                toast.error('Invalid product selection');
              }}
            >
              Validate Products
            </Button>
          </Card>
          
          {productError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>3 selected products are no longer available:</p>
                  <ul className="text-sm list-disc list-inside">
                    <li>Product #123 - Discontinued</li>
                    <li>Product #456 - Out of stock</li>
                    <li>Product #789 - Not found</li>
                  </ul>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProductError(false)}
                  >
                    Remove Invalid Products
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <ExtendedDiscountForm mode="create" />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const ServerValidationError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [validationErrors, setValidationErrors] = useState<string[]>([]);
      
      const triggerValidation = () => {
        setValidationErrors([
          'Discount percentage must be between 5% and 90%',
          'Minimum purchase amount cannot exceed $1000',
          'Code must not contain special characters',
        ]);
        toast.error('Validation failed');
      };
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Server Validation Demo</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Simulates server-side validation errors
            </p>
            <Button size="sm" onClick={triggerValidation}>
              Trigger Validation Errors
            </Button>
          </Card>
          
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Please fix the following errors:</p>
                <ul className="text-sm list-disc list-inside">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <DiscountForm mode="create" onSubmit={fn()} />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const SchedulingConflictError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [conflictError, setConflictError] = useState(true);
      const conflictingDiscounts = [
        { code: 'BLACKFRIDAY', dates: 'Nov 24-26' },
        { code: 'CYBERMONDAY', dates: 'Nov 27-28' },
      ];
      
      return (
        <div className="space-y-4">
          {conflictError && (
            <Alert variant="destructive">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Scheduling Conflict</p>
                  <p className="text-sm">This discount overlaps with existing promotions:</p>
                  <div className="space-y-1">
                    {conflictingDiscounts.map((discount, i) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        <Badge variant="outline">{discount.code}</Badge>
                        <span className="text-muted-foreground">{discount.dates}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConflictError(false)}
                  >
                    Adjust Schedule
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <ExtendedDiscountForm mode="create" />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const ErrorRecovery: Story = {
  args: {
    mode: 'create',
    onSubmit: fn(),
  },
  decorators: [
    () => {
      const [error, setError] = useState<string | null>('Connection lost. Changes not saved.');
      const [isRetrying, setIsRetrying] = useState(false);
      const [retryCount, setRetryCount] = useState(0);
      
      const retry = async () => {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (retryCount >= 1) {
          setError(null);
          toast.success('Discount saved successfully!');
        } else {
          toast.error('Still having issues. Please try again.');
        }
        
        setIsRetrying(false);
      };
      
      return (
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={retry}
                    disabled={isRetrying}
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry ({retryCount + 1}/2)
                      </>
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">Error Recovery Demo</h4>
            <p className="text-sm text-muted-foreground">
              {retryCount === 0 ? 'First retry will fail, second will succeed' : 'Next retry will succeed'}
            </p>
          </Card>
          
          <DiscountForm 
            mode="create" 
            initialData={{
              code: 'RECOVER2024',
              discountPercentage: 15,
            } as any}
            onSubmit={fn()} 
          />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};