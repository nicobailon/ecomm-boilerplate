import { 
  createMockUser, 
  createMockProduct, 
  createMockCollection
} from '@/mocks/factories';

// UI Component Mock Data
export const buttonMockData = {
  default: { children: 'Click Me' },
  primary: { children: 'Primary Button', variant: 'default' },
  secondary: { children: 'Secondary', variant: 'secondary' },
  destructive: { children: 'Delete', variant: 'destructive' },
  outline: { children: 'Outline', variant: 'outline' },
  ghost: { children: 'Ghost', variant: 'ghost' },
  link: { children: 'Link Button', variant: 'link' },
  withIcon: { children: 'Save Changes', variant: 'default' },
  loading: { children: 'Loading...', disabled: true },
  disabled: { children: 'Disabled', disabled: true },
  small: { children: 'Small', size: 'sm' },
  large: { children: 'Large', size: 'lg' },
};

export const inputMockData = {
  default: { placeholder: 'Enter text...' },
  withValue: { value: 'Hello World', placeholder: 'Enter text...' },
  email: { type: 'email', placeholder: 'email@example.com' },
  password: { type: 'password', placeholder: 'Enter password' },
  number: { type: 'number', placeholder: '0', min: 0, max: 100 },
  disabled: { placeholder: 'Disabled input', disabled: true },
  error: { placeholder: 'Invalid input', className: 'border-red-500' },
  withLabel: { placeholder: 'Your name', label: 'Full Name' },
};

export const cardMockData = {
  default: { 
    children: 'This is a card component with some content inside.' 
  },
  withHeader: {
    children: (
      <>
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p>Card content goes here.</p>
      </>
    )
  },
  withFooter: {
    children: (
      <>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Card with Footer</h3>
          <p>Main content area</p>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600">Footer content</p>
        </div>
      </>
    )
  },
};

export const alertMockData = {
  default: { 
    children: 'This is a default alert message.' 
  },
  info: { 
    children: 'This is an informational message.',
    variant: 'default'
  },
  success: { 
    children: 'Operation completed successfully!',
    variant: 'success'
  },
  warning: { 
    children: 'Please review before proceeding.',
    variant: 'warning'
  },
  error: { 
    children: 'An error occurred. Please try again.',
    variant: 'destructive'
  },
};

export const badgeMockData = {
  default: { children: 'Badge' },
  secondary: { children: 'Secondary', variant: 'secondary' },
  outline: { children: 'Outline', variant: 'outline' },
  destructive: { children: 'Error', variant: 'destructive' },
  success: { children: 'Success', className: 'bg-green-100 text-green-800' },
  warning: { children: 'Warning', className: 'bg-yellow-100 text-yellow-800' },
};

// Additional UI Component Mock Data
export const dialogMockData = {
  default: {
    trigger: 'Open Dialog',
    title: 'Confirm Action',
    description: 'Are you sure you want to proceed with this action?',
    primaryAction: 'Confirm',
    secondaryAction: 'Cancel',
  },
  destructive: {
    trigger: 'Delete Item',
    title: 'Delete Item',
    description: 'This action cannot be undone. This will permanently delete the item.',
    primaryAction: 'Delete',
    secondaryAction: 'Cancel',
    primaryVariant: 'destructive',
  },
};

export const drawerMockData = {
  default: {
    trigger: 'Open Drawer',
    title: 'Drawer Title',
    description: 'This is a drawer component that slides in from the side.',
  },
  withForm: {
    trigger: 'Edit Settings',
    title: 'Settings',
    description: 'Update your preferences below.',
  },
};

export const dropdownMockData = {
  default: {
    trigger: 'Options',
    items: [
      { label: 'Profile', value: 'profile' },
      { label: 'Settings', value: 'settings' },
      { label: 'Logout', value: 'logout' },
    ],
  },
  withIcons: {
    trigger: 'Actions',
    items: [
      { label: 'Edit', value: 'edit', icon: 'Edit' },
      { label: 'Duplicate', value: 'duplicate', icon: 'Copy' },
      { label: 'Delete', value: 'delete', icon: 'Trash', variant: 'destructive' },
    ],
  },
};

export const tabsMockData = {
  default: {
    defaultValue: 'tab1',
    tabs: [
      { value: 'tab1', label: 'Tab 1', content: 'Content for tab 1' },
      { value: 'tab2', label: 'Tab 2', content: 'Content for tab 2' },
      { value: 'tab3', label: 'Tab 3', content: 'Content for tab 3' },
    ],
  },
  withBadges: {
    defaultValue: 'overview',
    tabs: [
      { value: 'overview', label: 'Overview', content: 'Overview content' },
      { value: 'analytics', label: 'Analytics', badge: '3', content: 'Analytics content' },
      { value: 'reports', label: 'Reports', badge: 'New', content: 'Reports content' },
    ],
  },
};

export const selectMockData = {
  default: {
    placeholder: 'Select an option',
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
      { label: 'Option 3', value: 'option3' },
    ],
  },
  withGroups: {
    placeholder: 'Select a fruit',
    groups: [
      {
        label: 'Citrus',
        options: [
          { label: 'Orange', value: 'orange' },
          { label: 'Lemon', value: 'lemon' },
        ],
      },
      {
        label: 'Berries',
        options: [
          { label: 'Strawberry', value: 'strawberry' },
          { label: 'Blueberry', value: 'blueberry' },
        ],
      },
    ],
  },
};

export const checkboxMockData = {
  default: { label: 'Accept terms and conditions' },
  checked: { label: 'Subscribe to newsletter', defaultChecked: true },
  disabled: { label: 'This option is disabled', disabled: true },
};

export const switchMockData = {
  default: { label: 'Enable notifications' },
  checked: { label: 'Dark mode', defaultChecked: true },
  disabled: { label: 'Maintenance mode', disabled: true },
};

export const radioMockData = {
  default: {
    name: 'plan',
    options: [
      { label: 'Free', value: 'free' },
      { label: 'Pro', value: 'pro' },
      { label: 'Enterprise', value: 'enterprise' },
    ],
    defaultValue: 'free',
  },
};

export const textareaMockData = {
  default: { placeholder: 'Enter your message...' },
  withValue: { value: 'This is a multi-line\ntext area component', rows: 4 },
  disabled: { placeholder: 'This textarea is disabled', disabled: true },
};

export const labelMockData = {
  default: { children: 'Label text', htmlFor: 'input-id' },
  required: { children: 'Required field', required: true },
};

export const stockBadgeMockData = {
  default: { children: 'Badge' },
  secondary: { children: 'Secondary', variant: 'secondary' },
  outline: { children: 'Outline', variant: 'outline' },
  destructive: { children: 'Error', variant: 'destructive' },
  success: { children: 'Success', className: 'bg-green-100 text-green-800' },
  warning: { children: 'Warning', className: 'bg-yellow-100 text-yellow-800' },
};

// Form Component Mock Data
export const loginFormMockData = {
  default: {
    onSubmit: (data: any) => console.log('Login submitted:', data),
  },
  withError: {
    onSubmit: (data: any) => console.log('Login submitted:', data),
    initialError: 'Invalid email or password',
  },
};

export const signupFormMockData = {
  default: {
    onSubmit: (data: any) => console.log('Signup submitted:', data),
  },
};

export const productFormMockData = {
  default: {
    onSubmit: (data: any) => console.log('Product submitted:', data),
  },
  withProduct: {
    product: createMockProduct(),
    onSubmit: (data: any) => console.log('Product updated:', data),
  },
};

// Product Component Mock Data
export const productCardMockData = {
  default: {
    product: createMockProduct(),
  },
  featured: {
    product: createMockProduct({ isFeatured: true, name: 'Featured Product' }),
  },
  outOfStock: {
    product: createMockProduct({ inventory: 0, name: 'Out of Stock Product' }),
  },
  onSale: {
    product: createMockProduct({ 
      price: 49.99, 
      name: 'Sale Product' 
    }),
  },
};

export const productsListMockData = {
  default: {
    products: Array.from({ length: 6 }, (_, i) => 
      createMockProduct({ 
        name: `Product ${i + 1}`,
        price: Math.floor(Math.random() * 100) + 19.99 
      })
    ),
  },
  empty: {
    products: [],
  },
  loading: {
    products: [],
    isLoading: true,
  },
};

// Cart Component Mock Data
export const cartItemMockData = {
  default: {
    item: {
      product: createMockProduct(),
      quantity: 1,
    },
    onUpdateQuantity: (quantity: number) => console.log('Update quantity:', quantity),
    onRemove: () => console.log('Remove item'),
  },
  multipleQuantity: {
    item: {
      product: createMockProduct({ name: 'Bulk Item' }),
      quantity: 5,
    },
    onUpdateQuantity: (quantity: number) => console.log('Update quantity:', quantity),
    onRemove: () => console.log('Remove item'),
  },
};

export const orderSummaryMockData = {
  default: {
    subtotal: 299.97,
    shipping: 15.00,
    tax: 25.50,
    total: 340.47,
    itemCount: 3,
  },
  withDiscount: {
    subtotal: 299.97,
    shipping: 15.00,
    tax: 25.50,
    discount: 30.00,
    total: 310.47,
    itemCount: 3,
    couponCode: 'SAVE10',
  },
  empty: {
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    itemCount: 0,
  },
};

// Admin Component Mock Data
export const inventoryManagementMockData = {
  default: {
    products: Array.from({ length: 10 }, (_, i) => ({
      ...createMockProduct({ 
        name: `Product ${i + 1}`,
        inventory: Math.floor(Math.random() * 100) 
      }),
      sku: `SKU-${1000 + i}`,
    })),
  },
};

// Layout Component Mock Data
export const navbarMockData = {
  default: {
    user: null,
  },
  authenticated: {
    user: createMockUser(),
  },
  admin: {
    user: createMockUser({ role: 'admin', name: 'Admin User' }),
  },
};

// Collection Component Mock Data
export const collectionMockData = {
  default: {
    collections: Array.from({ length: 4 }, (_, i) => 
      createMockCollection({
        name: `Collection ${i + 1}`,
        slug: `collection-${i + 1}`,
        products: Array.from({ length: 3 }, () => createMockProduct()._id),
      })
    ),
  },
  empty: {
    collections: [],
  },
};

// Helper function to get mock data for a component
export const getMockDataForComponent = (componentId: string): any => {
  const mockDataMap: Record<string, any> = {
    // UI Components
    'button': buttonMockData.default,
    'input': inputMockData.default,
    'card': cardMockData.default,
    'alert': alertMockData.default,
    'badge': badgeMockData.default,
    'dialog': dialogMockData.default,
    'drawer': drawerMockData.default,
    'dropdown': dropdownMockData.default,
    'tabs': tabsMockData.default,
    'select': selectMockData.default,
    'checkbox': checkboxMockData.default,
    'switch': switchMockData.default,
    'radio': radioMockData.default,
    'textarea': textareaMockData.default,
    'label': labelMockData.default,
    
    // Form Components
    'login-form': loginFormMockData.default,
    'signup-form': signupFormMockData.default,
    'product-form': productFormMockData.default,
    
    // Product Components
    'product-card': productCardMockData.default,
    'products-list': productsListMockData.default,
    
    // Cart Components
    'cart-item': cartItemMockData.default,
    'order-summary': orderSummaryMockData.default,
    
    // Admin Components
    'inventory-management': inventoryManagementMockData.default,
    
    // Layout Components
    'navbar': navbarMockData.default,
    
    // Collection Components
    'collections-list': collectionMockData.default,
  };
  
  return mockDataMap[componentId] || {};
};

// Export all mock data collections
export const allMockData = {
  ui: {
    button: buttonMockData,
    input: inputMockData,
    card: cardMockData,
    alert: alertMockData,
    badge: badgeMockData,
    dialog: dialogMockData,
    drawer: drawerMockData,
    dropdown: dropdownMockData,
    tabs: tabsMockData,
    select: selectMockData,
    checkbox: checkboxMockData,
    switch: switchMockData,
    radio: radioMockData,
    textarea: textareaMockData,
    label: labelMockData,
  },
  forms: {
    loginForm: loginFormMockData,
    signupForm: signupFormMockData,
    productForm: productFormMockData,
  },
  products: {
    productCard: productCardMockData,
    productsList: productsListMockData,
  },
  cart: {
    cartItem: cartItemMockData,
    orderSummary: orderSummaryMockData,
  },
  admin: {
    inventoryManagement: inventoryManagementMockData,
  },
  layout: {
    navbar: navbarMockData,
  },
  collections: {
    collections: collectionMockData,
  },
};

// Mock data for ProductInfo component
export const productInfoMockData = {
  default: {
    product: {
      _id: '1',
      name: 'Premium Wireless Headphones',
      description: 'Experience premium sound quality with our flagship wireless headphones. Features active noise cancellation, 30-hour battery life, and premium comfort.',
      price: 299.99,
      images: ['https://via.placeholder.com/600'],
      category: 'electronics',
      brand: 'AudioTech',
      inventory: 50,
      variants: [
        {
          variantId: 'v1',
          label: 'Black',
          price: 299.99,
          inventory: 25,
          images: ['https://via.placeholder.com/600'],
          attributes: { color: 'Black' },
        },
        {
          variantId: 'v2',
          label: 'Silver',
          price: 299.99,
          inventory: 25,
          images: ['https://via.placeholder.com/600/C0C0C0'],
          attributes: { color: 'Silver' },
        },
      ],
    },
    selectedVariant: null,
    onAddToCartSuccess: () => console.log('Added to cart successfully'),
  },
  withSelectedVariant: {
    product: {
      _id: '1',
      name: 'Premium Wireless Headphones',
      description: 'Experience premium sound quality with our flagship wireless headphones.',
      price: 299.99,
      images: ['https://via.placeholder.com/600'],
      category: 'electronics',
      brand: 'AudioTech',
      inventory: 50,
      variants: [
        {
          variantId: 'v1',
          label: 'Black',
          price: 299.99,
          inventory: 25,
          images: ['https://via.placeholder.com/600'],
          attributes: { color: 'Black' },
        },
      ],
    },
    selectedVariant: {
      variantId: 'v1',
      label: 'Black',
      price: 299.99,
      inventory: 5,
      images: ['https://via.placeholder.com/600'],
      attributes: { color: 'Black' },
    },
    onAddToCartSuccess: () => console.log('Added to cart successfully'),
  },
  outOfStock: {
    product: {
      _id: '1',
      name: 'Limited Edition Headphones',
      description: 'Exclusive limited edition model.',
      price: 399.99,
      images: ['https://via.placeholder.com/600'],
      category: 'electronics',
      brand: 'AudioTech',
      inventory: 0,
    },
    selectedVariant: {
      variantId: 'v1',
      label: 'Gold',
      price: 399.99,
      inventory: 0,
      images: ['https://via.placeholder.com/600/FFD700'],
      attributes: { color: 'Gold' },
    },
    onAddToCartSuccess: () => console.log('Added to cart successfully'),
  },
};

// Mock data for EmailVerificationBanner
export const emailVerificationBannerMockData = {
  default: {
    // Component uses auth hooks internally, no props needed
  },
};

// Mock data for VerificationBadge
export const verificationBadgeMockData = {
  default: {
    verified: true,
    size: 'md' as const,
    showLabel: true,
  },
  unverified: {
    verified: false,
    size: 'md' as const,
    showLabel: true,
  },
  smallNoLabel: {
    verified: true,
    size: 'sm' as const,
    showLabel: false,
  },
  large: {
    verified: true,
    size: 'lg' as const,
    showLabel: true,
  },
};

// Mock data for withInventoryErrorBoundary HOC demo
export const withInventoryErrorBoundaryMockData = {
  default: {
    // This is a HOC, so we'll wrap a sample component
    // The actual implementation will be shown in the demo
  },
};