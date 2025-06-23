// Demo data for Storybook stories

export const demoProducts = {
  productDetails: {
    description: `Experience the ultimate in comfort and style with our premium product.
    Crafted with attention to detail and built to last, this item combines
    functionality with elegant design.`,
    features: [
      'High-quality materials',
      'Ergonomic design',
      'Sustainable manufacturing',
      '1-year warranty included',
    ],
    specifications: {
      dimensions: '12" x 8" x 4"',
      weight: '2.5 lbs',
      material: 'Premium aluminum alloy',
      color: 'Space Gray',
    },
  },
  reviews: [
    {
      id: '1',
      author: 'John D.',
      rating: 5,
      comment: 'Excellent product! Exceeded my expectations.',
    },
    {
      id: '2',
      author: 'Sarah M.',
      rating: 4,
      comment: 'Great quality, but shipping took longer than expected.',
    },
  ],
  shippingInfo: {
    standard: '5-7 business days',
    express: '2-3 business days',
    international: '10-14 business days',
    freeShippingThreshold: 50,
  },
};

export const demoLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

export const demoNotifications = [
  {
    id: '1',
    type: 'message',
    icon: '📧',
    color: 'text-blue-500',
    title: 'New message from Sarah',
    description: 'Hey, can you review the latest designs?',
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'success',
    icon: '✅',
    color: 'text-green-500',
    title: 'Order #1234 delivered',
    description: 'Your order has been successfully delivered',
    time: '5 hours ago',
  },
  {
    id: '3',
    type: 'warning',
    icon: '⚠️',
    color: 'text-yellow-500',
    title: 'Low stock alert',
    description: 'Product "Wireless Mouse" is running low',
    time: '1 day ago',
  },
];

export const demoFruits = [
  'Apple', 'Banana', 'Cherry', 'Date', 'Elderberry',
  'Fig', 'Grape', 'Honeydew', 'Kiwi', 'Lemon',
];

export const demoFormData = {
  departments: [
    { value: 'engineering', label: 'Engineering' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'sales', label: 'Sales' },
    { value: 'hr', label: 'Human Resources' },
  ],
  titles: [
    { value: 'mr', label: 'Mr.' },
    { value: 'mrs', label: 'Mrs.' },
    { value: 'ms', label: 'Ms.' },
    { value: 'dr', label: 'Dr.' },
  ],
  locations: [
    { value: 'ny', label: 'New York' },
    { value: 'sf', label: 'San Francisco' },
    { value: 'london', label: 'London' },
    { value: 'tokyo', label: 'Tokyo' },
  ],
};

export const demoSettings = {
  privacy: {
    notifications: { label: 'Push Notifications', default: true },
    marketing: { label: 'Marketing Emails', default: false },
    analytics: { label: 'Analytics Cookies', default: true },
    newsletter: { label: 'Newsletter', default: false },
  },
  accessibility: {
    screenReader: { 
      label: 'Screen Reader', 
      description: 'Enable screen reader support' 
    },
    highContrast: { 
      label: 'High Contrast', 
      description: 'Increase color contrast for better visibility' 
    },
    reduceMotion: { 
      label: 'Reduce Motion', 
      description: 'Minimize animations and transitions' 
    },
  },
};