import type { ComponentType } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Drawer } from '@/components/ui/Drawer';
import { Dropdown } from '@/components/ui/Dropdown';
import { Tabs } from '@/components/ui/tabs';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { HeroBanner } from '@/components/ui/HeroBanner';
import { HeroImageUpload } from '@/components/ui/HeroImageUpload';
import { ProductImageUpload } from '@/components/ui/ProductImageUpload';
import { LoginForm } from '@/components/forms/LoginForm';
import { SignupForm } from '@/components/forms/SignupForm';
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';
import { ProductForm } from '@/components/forms/ProductForm';
import { CollectionForm } from '@/components/forms/CollectionForm';
import { DiscountForm } from '@/components/forms/DiscountForm';
import { VariantEditor } from '@/components/forms/VariantEditor';
import { VariantAttributesEditor } from '@/components/forms/VariantAttributesEditor';
import ProductCard from '@/components/product/ProductCard';
import ProductsList from '@/components/product/ProductsList';
import FeaturedProducts from '@/components/product/FeaturedProducts';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { ProductMediaCarousel } from '@/components/product/ProductMediaCarousel';
import { ProductSelector } from '@/components/product/ProductSelector';
import { ProductVariantSelector } from '@/components/product/ProductVariantSelector';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { VirtualizedProductGrid } from '@/components/product/VirtualizedProductGrid';
import CartItem from '@/components/cart/CartItem';
import OrderSummary from '@/components/cart/OrderSummary';
import GiftCouponCard from '@/components/cart/GiftCouponCard';
import { InventoryManagement } from '@/components/admin/InventoryManagement';
import { BulkInventoryUpdate } from '@/components/admin/BulkInventoryUpdate';
import Navbar from '@/components/layout/Navbar';
import { UserMenu } from '@/components/layout/UserMenu';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CollectionsList } from '@/components/collections/CollectionsList';
import { CollectionEditDrawer } from '@/components/drawers/CollectionEditDrawer';
import { ProductEditDrawer } from '@/components/drawers/ProductEditDrawer';
import { DiscountEditDrawer } from '@/components/drawers/DiscountEditDrawer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TRPCErrorBoundary } from '@/components/ui/TRPCErrorBoundary';
import { InventoryErrorBoundary } from '@/components/ui/InventoryErrorBoundary';
import { AuthGuard } from '@/components/auth/AuthGuard';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductCardSkeleton } from '@/components/ui/ProductCardSkeleton';
import { CartSkeleton } from '@/components/ui/CartSkeleton';
import { AnalyticsStatsSkeleton } from '@/components/ui/AnalyticsSkeleton';
import { DiscountsTableSkeleton } from '@/components/ui/DiscountsSkeleton';
import { InventorySkeleton } from '@/components/ui/InventorySkeleton';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Progress } from '@/components/ui/Progress';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import MetaTagsWrapper from '@/dev/components/MetaTagsWrapper';
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';
import { ProductInfo } from '@/components/product/ProductInfo';
import { RealtimeStockBadge } from '@/components/ui/RealtimeStockBadge';
import { ProductVariantAttributeSelector } from '@/components/product/ProductVariantAttributeSelector';
import { VideoPlayer } from '@/components/product/VideoPlayer';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ThemeAnnouncement } from '@/components/ui/theme-announcement';
import { TransitionOverlay } from '@/components/ui/transition-overlay';
import { StockBadge } from '@/components/ui/StockBadge';
import { InventoryBadge } from '@/components/ui/InventoryBadge';
import { FeaturedBadge } from '@/components/ui/FeaturedBadge';
import { CheckoutCallout } from '@/components/ui/CheckoutCallout';
import { withInventoryErrorBoundary } from '@/components/ui/withInventoryErrorBoundary';
import { MediaGalleryManager } from '@/components/admin/MediaGalleryManager';
import { MediaItemCard } from '@/components/admin/MediaItemCard';
import { YouTubeAddModal } from '@/components/admin/YouTubeAddModal';
import { VirtualizedInventoryTable } from '@/components/admin/VirtualizedInventoryTable';
import { CollectionCard } from '@/components/collections/CollectionCard';
import { CollectionPreview } from '@/components/ui/CollectionPreview';
import { CreatableCollectionSelect } from '@/components/ui/CreatableCollectionSelect';
import { EmailVerificationBanner } from '@/components/ui/EmailVerificationBanner';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { 
  buttonMockData, inputMockData, cardMockData, alertMockData, badgeMockData,
  dialogMockData, drawerMockData, dropdownMockData, tabsMockData, selectMockData,
  checkboxMockData, switchMockData, textareaMockData, labelMockData,
  loginFormMockData, signupFormMockData, productFormMockData,
  productCardMockData, productsListMockData, cartItemMockData, orderSummaryMockData,
  inventoryManagementMockData, navbarMockData, collectionMockData,
  stockBadgeMockData, productInfoMockData, emailVerificationBannerMockData,
  verificationBadgeMockData, heroBannerMockData,
} from './mockData.js';

// Helper to safely cast components to the registry type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const castComponent = (component: ComponentType<any>): ComponentType<Record<string, unknown>> => 
  component as ComponentType<Record<string, unknown>>;

export interface ComponentRegistryItem {
  id: string;
  name: string;
  description?: string;
  component: ComponentType<Record<string, unknown>>;
  defaultProps?: Record<string, unknown>;
  category: ComponentCategory;
  subcategory?: string;
  variations?: ComponentVariation[];
  requirements?: string[];
  status?: 'stable' | 'beta' | 'deprecated';
}

export interface ComponentVariation {
  id: string;
  name: string;
  props: Record<string, unknown>;
}

export type ComponentCategory = 
  | 'ui' 
  | 'forms' 
  | 'products' 
  | 'cart' 
  | 'admin' 
  | 'layout' 
  | 'auth' 
  | 'collections' 
  | 'media' 
  | 'seo'
  | 'drawers'
  | 'common';

export interface ComponentRegistry {
  ui: ComponentRegistryItem[];
  forms: ComponentRegistryItem[];
  products: ComponentRegistryItem[];
  cart: ComponentRegistryItem[];
  admin: ComponentRegistryItem[];
  layout: ComponentRegistryItem[];
  auth: ComponentRegistryItem[];
  collections: ComponentRegistryItem[];
  media: ComponentRegistryItem[];
  seo: ComponentRegistryItem[];
  drawers: ComponentRegistryItem[];
  common: ComponentRegistryItem[];
}

// Initialize registry with UI components
export const componentRegistry: ComponentRegistry = {
  ui: [
    {
      id: 'button',
      name: 'Button',
      description: 'Base button component with multiple variants and states',
      component: castComponent(Button),
      defaultProps: buttonMockData.default,
      category: 'ui',
      subcategory: 'inputs',
      status: 'stable',
      variations: [
        { id: 'primary', name: 'Primary', props: buttonMockData.primary },
        { id: 'secondary', name: 'Secondary', props: buttonMockData.secondary },
        { id: 'destructive', name: 'Destructive', props: buttonMockData.destructive },
        { id: 'outline', name: 'Outline', props: buttonMockData.outline },
        { id: 'ghost', name: 'Ghost', props: buttonMockData.ghost },
        { id: 'link', name: 'Link', props: buttonMockData.link },
        { id: 'loading', name: 'Loading', props: buttonMockData.loading },
        { id: 'disabled', name: 'Disabled', props: buttonMockData.disabled },
        { id: 'small', name: 'Small Size', props: buttonMockData.small },
        { id: 'large', name: 'Large Size', props: buttonMockData.large },
      ],
      requirements: ['Supports keyboard navigation', 'ARIA compliant'],
    },
    {
      id: 'hero-banner',
      name: 'Hero Banner',
      description: 'Large promotional banner with image, text, and optional call-to-action',
      component: castComponent(HeroBanner),
      defaultProps: heroBannerMockData.default,
      category: 'ui',
      subcategory: 'display',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: heroBannerMockData.default },
        { id: 'withButton', name: 'With Button', props: heroBannerMockData.withButton },
        { id: 'small', name: 'Small Size', props: heroBannerMockData.small },
        { id: 'noOverlay', name: 'No Overlay', props: heroBannerMockData.noOverlay },
      ],
      requirements: ['Responsive design', 'Accessible alt text', 'Motion effects'],
    },
    {
      id: 'hero-image-upload',
      name: 'HeroImageUpload',
      description: 'Image upload component specifically for hero banners with drag-and-drop support',
      component: castComponent(HeroImageUpload),
      defaultProps: {
        onChange: (_url: string | undefined) => { /* Image changed */ },
      },
      category: 'ui',
      subcategory: 'upload',
      status: 'stable',
      variations: [
        { id: 'empty', name: 'Empty State', props: { onChange: () => { /* Image changed */ } } },
        { id: 'withImage', name: 'With Image', props: { value: 'https://via.placeholder.com/400x200', onChange: () => { /* Image changed */ } } },
        { id: 'disabled', name: 'Disabled', props: { disabled: true, onChange: () => { /* Image changed */ } } },
      ],
      requirements: ['File validation', 'Progress indicators', 'Error handling'],
    },
    {
      id: 'product-image-upload',
      name: 'ProductImageUpload',
      description: 'Image upload component for products with manual URL input option',
      component: castComponent(ProductImageUpload),
      defaultProps: {
        onChange: (_url: string | undefined) => { /* Image changed */ },
        showManualInput: true,
      },
      category: 'ui',
      subcategory: 'upload',
      status: 'stable',
      variations: [
        { id: 'empty', name: 'Empty State', props: { onChange: () => { /* Image changed */ } } },
        { id: 'withImage', name: 'With Image', props: { value: 'https://via.placeholder.com/400x200', onChange: () => { /* Image changed */ } } },
        { id: 'noManualInput', name: 'Upload Only', props: { showManualInput: false, onChange: () => { /* Image changed */ } } },
        { id: 'disabled', name: 'Disabled', props: { disabled: true, onChange: () => { /* Image changed */ } } },
      ],
      requirements: ['File validation', 'Manual URL input', 'Progress indicators'],
    },
    {
      id: 'input',
      name: 'Input',
      description: 'Text input field with various types and states',
      component: castComponent(Input),
      defaultProps: inputMockData.default,
      category: 'ui',
      subcategory: 'inputs',
      status: 'stable',
      variations: [
        { id: 'withValue', name: 'With Value', props: inputMockData.withValue },
        { id: 'email', name: 'Email Type', props: inputMockData.email },
        { id: 'password', name: 'Password Type', props: inputMockData.password },
        { id: 'number', name: 'Number Type', props: inputMockData.number },
        { id: 'disabled', name: 'Disabled', props: inputMockData.disabled },
        { id: 'error', name: 'Error State', props: inputMockData.error },
      ],
    },
    {
      id: 'card',
      name: 'Card',
      description: 'Container component for grouping related content',
      component: castComponent(Card),
      defaultProps: cardMockData.default,
      category: 'ui',
      subcategory: 'layout',
      status: 'stable',
      variations: [
        { id: 'withHeader', name: 'With Header', props: cardMockData.withHeader },
        { id: 'withFooter', name: 'With Footer', props: cardMockData.withFooter },
      ],
    },
    {
      id: 'alert',
      name: 'Alert',
      description: 'Displays important messages to users',
      component: castComponent(Alert),
      defaultProps: alertMockData.default,
      category: 'ui',
      subcategory: 'feedback',
      status: 'stable',
      variations: [
        { id: 'info', name: 'Info', props: alertMockData.info },
        { id: 'success', name: 'Success', props: alertMockData.success },
        { id: 'warning', name: 'Warning', props: alertMockData.warning },
        { id: 'error', name: 'Error', props: alertMockData.error },
      ],
    },
    {
      id: 'badge',
      name: 'Badge',
      description: 'Small labeling component for status or metadata',
      component: castComponent(Badge),
      defaultProps: badgeMockData.default,
      category: 'ui',
      subcategory: 'data-display',
      status: 'stable',
      variations: [
        { id: 'secondary', name: 'Secondary', props: badgeMockData.secondary },
        { id: 'outline', name: 'Outline', props: badgeMockData.outline },
        { id: 'destructive', name: 'Destructive', props: badgeMockData.destructive },
        { id: 'success', name: 'Success', props: badgeMockData.success },
        { id: 'warning', name: 'Warning', props: badgeMockData.warning },
      ],
    },
    {
      id: 'dialog',
      name: 'Dialog',
      description: 'Modal dialog for focused user interactions',
      component: castComponent(Dialog),
      defaultProps: dialogMockData.default,
      category: 'ui',
      subcategory: 'overlay',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: dialogMockData.default },
        { id: 'destructive', name: 'Destructive', props: dialogMockData.destructive },
      ],
      requirements: ['Focus trap', 'Escape key handling', 'ARIA compliant'],
    },
    {
      id: 'drawer',
      name: 'Drawer',
      description: 'Slide-out panel for forms and details',
      component: castComponent(Drawer),
      defaultProps: drawerMockData.default,
      category: 'ui',
      subcategory: 'overlay',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: drawerMockData.default },
        { id: 'withForm', name: 'With Form', props: drawerMockData.withForm },
      ],
    },
    {
      id: 'dropdown',
      name: 'Dropdown',
      description: 'Dropdown menu for actions and options',
      component: castComponent(Dropdown),
      defaultProps: dropdownMockData.default,
      category: 'ui',
      subcategory: 'inputs',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: dropdownMockData.default },
        { id: 'withIcons', name: 'With Icons', props: dropdownMockData.withIcons },
      ],
    },
    {
      id: 'tabs',
      name: 'Tabs',
      description: 'Tabbed interface for organizing content',
      component: castComponent(Tabs),
      defaultProps: tabsMockData.default,
      category: 'ui',
      subcategory: 'navigation',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: tabsMockData.default },
        { id: 'withBadges', name: 'With Badges', props: tabsMockData.withBadges },
      ],
    },
    {
      id: 'select',
      name: 'Select',
      description: 'Dropdown selection input',
      component: castComponent(Select),
      defaultProps: selectMockData.default,
      category: 'ui',
      subcategory: 'inputs',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: selectMockData.default },
        { id: 'withGroups', name: 'With Groups', props: selectMockData.withGroups },
      ],
    },
    {
      id: 'checkbox',
      name: 'Checkbox',
      description: 'Checkbox input for boolean values',
      component: castComponent(Checkbox),
      defaultProps: checkboxMockData.default,
      category: 'ui',
      subcategory: 'inputs',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: checkboxMockData.default },
        { id: 'checked', name: 'Checked', props: checkboxMockData.checked },
        { id: 'disabled', name: 'Disabled', props: checkboxMockData.disabled },
      ],
    },
    {
      id: 'switch',
      name: 'Switch',
      description: 'Toggle switch for on/off states',
      component: castComponent(Switch),
      defaultProps: switchMockData.default,
      category: 'ui',
      subcategory: 'inputs',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: switchMockData.default },
        { id: 'checked', name: 'Checked', props: switchMockData.checked },
        { id: 'disabled', name: 'Disabled', props: switchMockData.disabled },
      ],
    },
    {
      id: 'textarea',
      name: 'Textarea',
      description: 'Multi-line text input',
      component: castComponent(Textarea),
      defaultProps: textareaMockData.default,
      category: 'ui',
      subcategory: 'inputs',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: textareaMockData.default },
        { id: 'withValue', name: 'With Value', props: textareaMockData.withValue },
        { id: 'disabled', name: 'Disabled', props: textareaMockData.disabled },
      ],
    },
    {
      id: 'label',
      name: 'Label',
      description: 'Form field label',
      component: castComponent(Label),
      defaultProps: labelMockData.default,
      category: 'ui',
      subcategory: 'inputs',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: labelMockData.default },
        { id: 'required', name: 'Required', props: labelMockData.required },
      ],
    },
    {
      id: 'loading-spinner',
      name: 'LoadingSpinner',
      description: 'Animated loading spinner component',
      component: castComponent(LoadingSpinner),
      defaultProps: {
        size: 'default',
      },
      variations: [
        { id: 'small', name: 'Small', props: { size: 'sm' } },
        { id: 'large', name: 'Large', props: { size: 'lg' } },
        { id: 'with-text', name: 'With text', props: { text: 'Loading...' } },
      ],
      category: 'ui',
      subcategory: 'loading',
      status: 'stable',
    },
    {
      id: 'skeleton',
      name: 'Skeleton',
      description: 'Loading placeholder animation',
      component: castComponent(Skeleton),
      defaultProps: {
        className: 'h-4 w-48',
      },
      variations: [
        { id: 'text', name: 'Text line', props: { className: 'h-4 w-48' } },
        { id: 'title', name: 'Title', props: { className: 'h-8 w-64' } },
        { id: 'avatar', name: 'Avatar', props: { className: 'h-10 w-10 rounded-full' } },
        { id: 'image', name: 'Image', props: { className: 'h-48 w-full' } },
      ],
      category: 'ui',
      subcategory: 'loading',
      status: 'stable',
    },
    {
      id: 'alert-dialog',
      name: 'AlertDialog',
      description: 'Modal dialog for alerts and confirmations',
      component: castComponent(AlertDialog),
      defaultProps: dialogMockData.default,
      category: 'ui',
      subcategory: 'overlays',
      status: 'stable',
    },
    {
      id: 'progress',
      name: 'Progress',
      description: 'Progress bar indicator',
      component: castComponent(Progress),
      defaultProps: { value: 60 },
      variations: [
        { id: 'empty', name: 'Empty', props: { value: 0 } },
        { id: 'half', name: 'Half', props: { value: 50 } },
        { id: 'full', name: 'Full', props: { value: 100 } },
        { id: 'indeterminate', name: 'Indeterminate', props: { indeterminate: true } },
      ],
      category: 'ui',
      subcategory: 'feedback',
      status: 'stable',
    },
    {
      id: 'optimized-image',
      name: 'OptimizedImage',
      description: 'Lazy-loaded optimized image component',
      component: castComponent(OptimizedImage),
      defaultProps: {
        src: 'https://via.placeholder.com/400x300',
        alt: 'Placeholder image',
        className: 'w-full h-auto',
      },
      variations: [
        { id: 'lazy', name: 'Lazy loaded', props: { src: 'https://via.placeholder.com/800x600', alt: 'Lazy image', lazy: true } },
        { id: 'thumbnail', name: 'Thumbnail', props: { src: 'https://via.placeholder.com/150x150', alt: 'Thumbnail', className: 'w-24 h-24 object-cover' } },
      ],
      category: 'ui',
      subcategory: 'media',
      status: 'stable',
    },
    {
      id: 'realtime-stock-badge',
      name: 'RealtimeStockBadge',
      description: 'Badge showing real-time stock status',
      component: castComponent(RealtimeStockBadge),
      defaultProps: {
        quantity: 10,
        productId: 'mock-product-id',
      },
      variations: [
        { id: 'in-stock', name: 'In Stock', props: { quantity: 50 } },
        { id: 'low-stock', name: 'Low Stock', props: { quantity: 3 } },
        { id: 'out-of-stock', name: 'Out of Stock', props: { quantity: 0 } },
      ],
      category: 'ui',
      subcategory: 'ecommerce',
      status: 'beta',
    },
    {
      id: 'theme-toggle',
      name: 'ThemeToggle',
      description: 'Theme switcher component (light/dark/system)',
      component: castComponent(ThemeToggle),
      defaultProps: {},
      category: 'ui',
      subcategory: 'theme',
      status: 'stable',
    },
    {
      id: 'theme-announcement',
      name: 'ThemeAnnouncement',
      description: 'Announces theme changes to screen readers',
      component: castComponent(ThemeAnnouncement),
      defaultProps: {
        theme: 'light',
      },
      variations: [
        { id: 'light', name: 'Light theme', props: { theme: 'light' } },
        { id: 'dark', name: 'Dark theme', props: { theme: 'dark' } },
        { id: 'system', name: 'System theme', props: { theme: 'system' } },
      ],
      category: 'ui',
      subcategory: 'theme',
      status: 'stable',
    },
    {
      id: 'transition-overlay',
      name: 'TransitionOverlay',
      description: 'Overlay for smooth theme transitions',
      component: castComponent(TransitionOverlay),
      defaultProps: {
        isVisible: true,
      },
      category: 'ui',
      subcategory: 'theme',
      status: 'stable',
    },
    {
      id: 'stock-badge',
      name: 'StockBadge',
      description: 'Badge displaying stock status',
      component: castComponent(StockBadge),
      defaultProps: stockBadgeMockData.default,
      variations: [
        { id: 'in-stock', name: 'In Stock', props: { quantity: 50 } },
        { id: 'low-stock', name: 'Low Stock', props: { quantity: 5 } },
        { id: 'out-of-stock', name: 'Out of Stock', props: { quantity: 0 } },
      ],
      category: 'ui',
      subcategory: 'ecommerce',
      status: 'stable',
    },
    {
      id: 'inventory-badge',
      name: 'InventoryBadge',
      description: 'Badge for inventory status display',
      component: castComponent(InventoryBadge),
      defaultProps: {
        quantity: 25,
        threshold: 10,
      },
      variations: [
        { id: 'high', name: 'High inventory', props: { quantity: 100, threshold: 10 } },
        { id: 'low', name: 'Low inventory', props: { quantity: 5, threshold: 10 } },
        { id: 'critical', name: 'Critical', props: { quantity: 1, threshold: 5 } },
      ],
      category: 'ui',
      subcategory: 'ecommerce',
      status: 'stable',
    },
    {
      id: 'featured-badge',
      name: 'FeaturedBadge',
      description: 'Badge to highlight featured items',
      component: castComponent(FeaturedBadge),
      defaultProps: {},
      variations: [
        { id: 'default', name: 'Default', props: {} },
        { id: 'custom', name: 'Custom text', props: { text: 'Hot!' } },
      ],
      category: 'ui',
      subcategory: 'ecommerce',
      status: 'stable',
    },
    {
      id: 'checkout-callout',
      name: 'CheckoutCallout',
      description: 'Callout message for checkout process',
      component: castComponent(CheckoutCallout),
      defaultProps: {
        type: 'info',
        message: 'Free shipping on orders over $50!',
      },
      variations: [
        { id: 'info', name: 'Info', props: { type: 'info', message: 'Information message' } },
        { id: 'warning', name: 'Warning', props: { type: 'warning', message: 'Limited stock available' } },
        { id: 'success', name: 'Success', props: { type: 'success', message: 'Coupon applied!' } },
      ],
      category: 'ui',
      subcategory: 'ecommerce',
      status: 'stable',
    },
  ],
  forms: [
    {
      id: 'login-form',
      name: 'LoginForm',
      description: 'User login form with email and password',
      component: castComponent(LoginForm),
      defaultProps: loginFormMockData.default,
      category: 'forms',
      subcategory: 'auth',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: loginFormMockData.default },
        { id: 'withError', name: 'With Error', props: loginFormMockData.withError },
      ],
      requirements: ['Form validation', 'Error handling', 'Loading states'],
    },
    {
      id: 'signup-form',
      name: 'SignupForm',
      description: 'User registration form',
      component: castComponent(SignupForm),
      defaultProps: signupFormMockData.default,
      category: 'forms',
      subcategory: 'auth',
      status: 'stable',
    },
    {
      id: 'forgot-password-form',
      name: 'ForgotPasswordForm',
      description: 'Password reset request form',
      component: castComponent(ForgotPasswordForm),
      defaultProps: { onSubmit: (_data: { email: string }) => { /* Password reset */ } },
      category: 'forms',
      subcategory: 'auth',
      status: 'stable',
    },
    {
      id: 'reset-password-form',
      name: 'ResetPasswordForm',
      description: 'Form for resetting password with token',
      component: castComponent(ResetPasswordForm),
      defaultProps: { 
        token: 'mock-reset-token',
        onSubmit: (_data: { password: string; confirmPassword: string }) => { /* Password reset */ }, 
      },
      category: 'forms',
      subcategory: 'auth',
      status: 'stable',
    },
    {
      id: 'product-form',
      name: 'ProductForm',
      description: 'Product creation and editing form',
      component: castComponent(ProductForm),
      defaultProps: productFormMockData.default,
      category: 'forms',
      subcategory: 'admin',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Create Product', props: productFormMockData.default },
        { id: 'withProduct', name: 'Edit Product', props: productFormMockData.withProduct },
      ],
      requirements: ['Image upload', 'Rich text editing', 'Variant management'],
    },
    {
      id: 'collection-form',
      name: 'CollectionForm',
      description: 'Collection creation and editing form',
      component: castComponent(CollectionForm),
      defaultProps: { onSubmit: (_data: { name: string; description?: string }) => { /* Collection submitted */ } },
      category: 'forms',
      subcategory: 'admin',
      status: 'stable',
    },
    {
      id: 'discount-form',
      name: 'DiscountForm',
      description: 'Discount/coupon creation form',
      component: castComponent(DiscountForm),
      defaultProps: { onSubmit: (_data: { code: string; percentage: number }) => { /* Discount submitted */ } },
      category: 'forms',
      subcategory: 'admin',
      status: 'stable',
    },
    {
      id: 'variant-editor',
      name: 'VariantEditor',
      description: 'Product variant editing interface',
      component: castComponent(VariantEditor),
      defaultProps: { variants: [], onChange: (_variants: { name: string; price: number }[]) => { /* Variants changed */ } },
      category: 'forms',
      subcategory: 'admin',
      status: 'stable',
    },
    {
      id: 'variant-attributes-editor',
      name: 'VariantAttributesEditor',
      description: 'Advanced variant attributes editor',
      component: castComponent(VariantAttributesEditor),
      defaultProps: { attributes: {}, onChange: (_attrs: Record<string, string[]>) => { /* Attributes changed */ } },
      category: 'forms',
      subcategory: 'admin',
      status: 'beta',
    },
  ],
  products: [
    {
      id: 'product-card',
      name: 'ProductCard',
      description: 'Product display card with image, title, and price',
      component: castComponent(ProductCard),
      defaultProps: productCardMockData.default,
      category: 'products',
      subcategory: 'display',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: productCardMockData.default },
        { id: 'featured', name: 'Featured', props: productCardMockData.featured },
        { id: 'outOfStock', name: 'Out of Stock', props: productCardMockData.outOfStock },
        { id: 'onSale', name: 'On Sale', props: productCardMockData.onSale },
      ],
      requirements: ['Responsive image', 'Price formatting', 'Add to cart action'],
    },
    {
      id: 'products-list',
      name: 'ProductsList',
      description: 'Grid layout for displaying multiple products',
      component: castComponent(ProductsList),
      defaultProps: productsListMockData.default,
      category: 'products',
      subcategory: 'display',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: productsListMockData.default },
        { id: 'empty', name: 'Empty State', props: productsListMockData.empty },
        { id: 'loading', name: 'Loading State', props: productsListMockData.loading },
      ],
    },
    {
      id: 'featured-products',
      name: 'FeaturedProducts',
      description: 'Showcase featured products in a highlighted section',
      component: castComponent(FeaturedProducts),
      defaultProps: { products: productsListMockData.default.products.slice(0, 4) },
      category: 'products',
      subcategory: 'display',
      status: 'stable',
    },
    {
      id: 'product-image-gallery',
      name: 'ProductImageGallery',
      description: 'Image gallery with thumbnails for product pages',
      component: castComponent(ProductImageGallery),
      defaultProps: {
        images: [
          'https://via.placeholder.com/600',
          'https://via.placeholder.com/600/FF0000',
          'https://via.placeholder.com/600/00FF00',
        ],
      },
      category: 'products',
      subcategory: 'media',
      status: 'stable',
    },
    {
      id: 'product-media-carousel',
      name: 'ProductMediaCarousel',
      description: 'Carousel for product images and videos',
      component: castComponent(ProductMediaCarousel),
      defaultProps: {
        media: [
          { id: '1', url: 'https://via.placeholder.com/800', type: 'image' },
          { id: '2', url: 'https://via.placeholder.com/800/0000FF', type: 'image' },
        ],
      },
      category: 'products',
      subcategory: 'media',
      status: 'stable',
    },
    {
      id: 'product-selector',
      name: 'ProductSelector',
      description: 'Dropdown or modal for selecting products',
      component: castComponent(ProductSelector),
      defaultProps: {
        products: productsListMockData.default.products,
        onSelect: (_product: { id: string; name: string; price: number }) => { /* Product selected */ },
      },
      category: 'products',
      subcategory: 'inputs',
      status: 'stable',
    },
    {
      id: 'product-variant-selector',
      name: 'ProductVariantSelector',
      description: 'UI for selecting product variants',
      component: castComponent(ProductVariantSelector),
      defaultProps: {
        variants: [
          { id: '1', name: 'Small', price: 19.99 },
          { id: '2', name: 'Medium', price: 24.99 },
          { id: '3', name: 'Large', price: 29.99 },
        ],
        onSelect: (_variant: { id: string; name: string; attributes: Record<string, string> }) => { /* Variant selected */ },
      },
      category: 'products',
      subcategory: 'inputs',
      status: 'stable',
    },
    {
      id: 'related-products',
      name: 'RelatedProducts',
      description: 'Display related or recommended products',
      component: castComponent(RelatedProducts),
      defaultProps: {
        products: productsListMockData.default.products.slice(0, 4),
        title: 'You May Also Like',
      },
      category: 'products',
      subcategory: 'display',
      status: 'stable',
    },
    {
      id: 'virtualized-product-grid',
      name: 'VirtualizedProductGrid',
      description: 'Performance-optimized grid for large product lists',
      component: castComponent(VirtualizedProductGrid),
      defaultProps: {
        products: Array.from({ length: 100 }, (_, i) => ({
          ...productCardMockData.default.product,
          _id: `product-${i}`,
          name: `Product ${i + 1}`,
        })),
      },
      category: 'products',
      subcategory: 'display',
      status: 'stable',
      requirements: ['Virtual scrolling', 'Lazy loading'],
    },
    {
      id: 'product-card-skeleton',
      name: 'ProductCardSkeleton',
      description: 'Loading skeleton for product cards',
      component: castComponent(ProductCardSkeleton),
      defaultProps: {},
      category: 'products',
      subcategory: 'loading',
      status: 'stable',
    },
    {
      id: 'product-variant-attribute-selector',
      name: 'ProductVariantAttributeSelector',
      description: 'Select product attributes like size, color',
      component: castComponent(ProductVariantAttributeSelector),
      defaultProps: {
        attributes: {
          Size: ['S', 'M', 'L', 'XL'],
          Color: ['Red', 'Blue', 'Green'],
        },
        selected: {},
        onChange: (_selected: Record<string, string>) => { /* Selection changed */ },
      },
      category: 'products',
      subcategory: 'inputs',
      status: 'stable',
    },
    {
      id: 'video-player',
      name: 'VideoPlayer',
      description: 'Video player for product demonstration videos',
      component: castComponent(VideoPlayer),
      defaultProps: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Product Demo',
      },
      variations: [
        { id: 'youtube', name: 'YouTube', props: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } },
        { id: 'vimeo', name: 'Vimeo', props: { url: 'https://vimeo.com/123456789' } },
      ],
      category: 'products',
      subcategory: 'media',
      status: 'stable',
    },
    {
      id: 'product-info',
      name: 'ProductInfo',
      description: 'Product information with add to cart, quantity selector',
      component: castComponent(ProductInfo),
      defaultProps: productInfoMockData.default,
      variations: [
        { id: 'default', name: 'Default', props: productInfoMockData.default },
        { id: 'withSelectedVariant', name: 'With Selected Variant', props: productInfoMockData.withSelectedVariant },
        { id: 'outOfStock', name: 'Out of Stock', props: productInfoMockData.outOfStock },
      ],
      category: 'products',
      subcategory: 'display',
      status: 'stable',
    },
  ],
  cart: [
    {
      id: 'cart-item',
      name: 'CartItem',
      description: 'Individual cart item with quantity controls',
      component: castComponent(CartItem),
      defaultProps: cartItemMockData.default,
      category: 'cart',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: cartItemMockData.default },
        { id: 'multipleQuantity', name: 'Multiple Quantity', props: cartItemMockData.multipleQuantity },
      ],
      requirements: ['Quantity controls', 'Remove action', 'Price calculation'],
    },
    {
      id: 'order-summary',
      name: 'OrderSummary',
      description: 'Cart total breakdown with shipping and tax',
      component: castComponent(OrderSummary),
      defaultProps: orderSummaryMockData.default,
      category: 'cart',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: orderSummaryMockData.default },
        { id: 'withDiscount', name: 'With Discount', props: orderSummaryMockData.withDiscount },
        { id: 'empty', name: 'Empty Cart', props: orderSummaryMockData.empty },
      ],
    },
    {
      id: 'gift-coupon-card',
      name: 'GiftCouponCard',
      description: 'Display gift card or coupon in cart',
      component: castComponent(GiftCouponCard),
      defaultProps: {
        coupon: { code: 'SAVE20', discount: 20, type: 'percentage' },
        onRemove: () => { /* Remove coupon */ },
      },
      category: 'cart',
      status: 'stable',
    },
    {
      id: 'cart-skeleton',
      name: 'CartSkeleton',
      description: 'Loading skeleton for cart items',
      component: castComponent(CartSkeleton),
      defaultProps: {
        count: 3,
      },
      variations: [
        { id: 'single', name: 'Single item', props: { count: 1 } },
        { id: 'multiple', name: 'Multiple items', props: { count: 5 } },
      ],
      category: 'cart',
      subcategory: 'loading',
      status: 'stable',
    },
  ],
  admin: [
    {
      id: 'inventory-management',
      name: 'InventoryManagement',
      description: 'Admin interface for managing product inventory',
      component: castComponent(InventoryManagement),
      defaultProps: inventoryManagementMockData.default,
      category: 'admin',
      status: 'stable',
      requirements: ['Bulk actions', 'Real-time updates', 'Search and filter'],
    },
    {
      id: 'bulk-inventory-update',
      name: 'BulkInventoryUpdate',
      description: 'Bulk update inventory quantities',
      component: castComponent(BulkInventoryUpdate),
      defaultProps: {
        products: inventoryManagementMockData.default.products,
        onUpdate: (_updates: { productId: string; quantity: number }[]) => { /* Bulk update */ },
      },
      category: 'admin',
      status: 'stable',
    },
    {
      id: 'inventory-skeleton',
      name: 'InventorySkeleton',
      description: 'Loading skeleton for inventory tables',
      component: castComponent(InventorySkeleton),
      defaultProps: {
        rows: 5,
      },
      category: 'admin',
      subcategory: 'loading',
      status: 'stable',
    },
    {
      id: 'analytics-skeleton',
      name: 'AnalyticsSkeleton',
      description: 'Loading skeleton for analytics dashboards',
      component: castComponent(AnalyticsStatsSkeleton),
      defaultProps: {},
      category: 'admin',
      subcategory: 'loading',
      status: 'stable',
    },
    {
      id: 'discounts-skeleton',
      name: 'DiscountsSkeleton',
      description: 'Loading skeleton for discount management',
      component: castComponent(DiscountsTableSkeleton),
      defaultProps: {
        count: 3,
      },
      category: 'admin',
      subcategory: 'loading',
      status: 'stable',
    },
    {
      id: 'virtualized-inventory-table',
      name: 'VirtualizedInventoryTable',
      description: 'Performance-optimized inventory table for large datasets',
      component: castComponent(VirtualizedInventoryTable),
      defaultProps: {
        items: inventoryManagementMockData.default.products,
        height: 600,
      },
      category: 'admin',
      subcategory: 'tables',
      status: 'stable',
    },
    {
      id: 'media-gallery-manager',
      name: 'MediaGalleryManager',
      description: 'Manage product images and videos',
      component: castComponent(MediaGalleryManager),
      defaultProps: {
        media: [
          { id: '1', type: 'image', url: 'https://via.placeholder.com/300', name: 'Product 1' },
          { id: '2', type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', name: 'Demo Video' },
        ],
        onUpload: (_file: File) => { /* File uploaded */ },
        onDelete: (_id: string) => { /* Delete item */ },
      },
      category: 'admin',
      subcategory: 'media',
      status: 'stable',
    },
    {
      id: 'media-item-card',
      name: 'MediaItemCard',
      description: 'Card component for displaying media items',
      component: castComponent(MediaItemCard),
      defaultProps: {
        media: { id: '1', type: 'image', url: 'https://via.placeholder.com/300', name: 'Product Image' },
        onDelete: (_id: string) => { /* Delete item */ },
      },
      category: 'admin',
      subcategory: 'media',
      status: 'stable',
    },
    {
      id: 'youtube-add-modal',
      name: 'YouTubeAddModal',
      description: 'Modal for adding YouTube videos',
      component: castComponent(YouTubeAddModal),
      defaultProps: {
        isOpen: true,
        onClose: () => { /* Close modal */ },
        onAdd: (_url: string) => { /* Add video */ },
      },
      category: 'admin',
      subcategory: 'media',
      status: 'stable',
    },
  ],
  layout: [
    {
      id: 'navbar',
      name: 'Navbar',
      description: 'Main navigation bar with branding and user menu',
      component: castComponent(Navbar),
      defaultProps: navbarMockData.default,
      category: 'layout',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Guest User', props: navbarMockData.default },
        { id: 'authenticated', name: 'Authenticated', props: navbarMockData.authenticated },
        { id: 'admin', name: 'Admin User', props: navbarMockData.admin },
      ],
      requirements: ['Responsive design', 'Authentication states'],
    },
    {
      id: 'user-menu',
      name: 'UserMenu',
      description: 'Dropdown menu for user actions',
      component: castComponent(UserMenu),
      defaultProps: { user: navbarMockData.authenticated.user },
      category: 'layout',
      status: 'stable',
    },
    {
      id: 'breadcrumb',
      name: 'Breadcrumb',
      description: 'Navigation breadcrumb trail',
      component: castComponent(Breadcrumb),
      defaultProps: {
        items: [
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: 'Electronics', href: '/products/electronics' },
        ],
      },
      category: 'layout',
      subcategory: 'navigation',
      status: 'stable',
    },
  ],
  auth: [
    {
      id: 'email-verification-banner',
      name: 'EmailVerificationBanner',
      description: 'Banner prompting users to verify their email address',
      component: castComponent(EmailVerificationBanner),
      defaultProps: emailVerificationBannerMockData.default,
      category: 'auth',
      subcategory: 'verification',
      status: 'stable',
      requirements: ['Hooks into auth context', 'Shows for unverified users'],
    },
    {
      id: 'verification-badge',
      name: 'VerificationBadge',
      description: 'Badge showing email verification status',
      component: castComponent(VerificationBadge),
      defaultProps: verificationBadgeMockData.default,
      variations: [
        { id: 'default', name: 'Verified', props: verificationBadgeMockData.default },
        { id: 'unverified', name: 'Unverified', props: verificationBadgeMockData.unverified },
        { id: 'smallNoLabel', name: 'Small without label', props: verificationBadgeMockData.smallNoLabel },
        { id: 'large', name: 'Large with label', props: verificationBadgeMockData.large },
      ],
      category: 'auth',
      subcategory: 'verification',
      status: 'stable',
    },
  ],
  collections: [
    {
      id: 'collections-list',
      name: 'CollectionsList',
      description: 'Display grid of product collections',
      component: castComponent(CollectionsList),
      defaultProps: collectionMockData.default,
      category: 'collections',
      status: 'stable',
      variations: [
        { id: 'default', name: 'Default', props: collectionMockData.default },
        { id: 'empty', name: 'Empty', props: collectionMockData.empty },
      ],
    },
    {
      id: 'collection-card',
      name: 'CollectionCard',
      description: 'Card component for displaying collections',
      component: castComponent(CollectionCard),
      defaultProps: {
        collection: {
          id: '1',
          name: 'Summer Collection',
          description: 'Hot summer styles',
          image: 'https://via.placeholder.com/400x300',
          productCount: 25,
        },
      },
      category: 'collections',
      status: 'stable',
    },
    {
      id: 'collection-preview',
      name: 'CollectionPreview',
      description: 'Preview component for collections',
      component: castComponent(CollectionPreview),
      defaultProps: {
        collection: {
          id: '1',
          name: 'Featured Collection',
          products: productsListMockData.default.products.slice(0, 3),
        },
      },
      category: 'collections',
      status: 'stable',
    },
    {
      id: 'creatable-collection-select',
      name: 'CreatableCollectionSelect',
      description: 'Select with ability to create new collections',
      component: castComponent(CreatableCollectionSelect),
      defaultProps: {
        collections: [
          { value: '1', label: 'Summer Collection' },
          { value: '2', label: 'Winter Collection' },
        ],
        value: null,
        onChange: (_value: { value: string; label: string } | null) => { /* Selection changed */ },
        onCreateCollection: (_name: string) => { /* Create collection */ },
      },
      category: 'collections',
      subcategory: 'inputs',
      status: 'stable',
    },
  ],
  media: [],
  seo: [
    {
      id: 'meta-tags',
      name: 'MetaTags',
      description: 'SEO meta tags component for pages',
      component: castComponent(MetaTagsWrapper),
      defaultProps: {
        title: 'Page Title',
        description: 'Page description for SEO',
        keywords: ['keyword1', 'keyword2'],
        ogImage: 'https://example.com/og-image.jpg',
      },
      variations: [
        { 
          id: 'product', 
          name: 'Product page', 
          props: { 
            title: 'Product Name - Store',
            description: 'Buy this amazing product',
            ogType: 'product',
          }, 
        },
        { 
          id: 'category', 
          name: 'Category page', 
          props: { 
            title: 'Category - Store',
            description: 'Browse our category',
            ogType: 'website',
          }, 
        },
      ],
      category: 'seo',
      status: 'stable',
    },
  ],
  drawers: [
    {
      id: 'collection-edit-drawer',
      name: 'CollectionEditDrawer',
      description: 'Drawer for editing collection details',
      component: castComponent(CollectionEditDrawer),
      defaultProps: {
        isOpen: true,
        onClose: () => { /* Close drawer */ },
        collection: collectionMockData.default.collections[0],
      },
      category: 'drawers',
      status: 'stable',
    },
    {
      id: 'product-edit-drawer',
      name: 'ProductEditDrawer',
      description: 'Drawer for editing product details',
      component: castComponent(ProductEditDrawer),
      defaultProps: {
        isOpen: true,
        onClose: () => { /* Close drawer */ },
        product: productCardMockData.default.product,
      },
      category: 'drawers',
      status: 'stable',
    },
    {
      id: 'discount-edit-drawer',
      name: 'DiscountEditDrawer',
      description: 'Drawer for editing discount/coupon details',
      component: castComponent(DiscountEditDrawer),
      defaultProps: {
        isOpen: true,
        onClose: () => { /* Close drawer */ },
        discount: { code: 'SAVE10', percentage: 10, active: true },
      },
      category: 'drawers',
      status: 'stable',
    },
  ],
  common: [
    {
      id: 'error-boundary',
      name: 'ErrorBoundary',
      description: 'Catches React errors and displays fallback UI',
      component: castComponent(ErrorBoundary),
      defaultProps: {
        children: (
          <div>
            <h3>Child Component</h3>
            <p>This component is wrapped in an ErrorBoundary</p>
          </div>
        ),
      },
      variations: [
        {
          id: 'with-custom-fallback',
          name: 'With custom fallback',
          props: {
            children: <div>Protected content</div>,
            fallback: (error: Error, reset: () => void) => (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="text-red-800">Custom Error: {error.message}</h3>
                <button onClick={reset} className="mt-2 text-blue-600">Reset</button>
              </div>
            ),
          },
        },
      ],
      category: 'common',
      status: 'stable',
    },
    {
      id: 'trpc-error-boundary',
      name: 'TRPCErrorBoundary',
      description: 'Error boundary specifically for tRPC errors',
      component: castComponent(TRPCErrorBoundary),
      defaultProps: {
        children: <div>tRPC Protected Content</div>,
      },
      category: 'common',
      status: 'stable',
    },
    {
      id: 'inventory-error-boundary',
      name: 'InventoryErrorBoundary',
      description: 'Error boundary for inventory-related components',
      component: castComponent(InventoryErrorBoundary),
      defaultProps: {
        children: <div>Inventory Component</div>,
      },
      category: 'common',
      status: 'stable',
    },
    {
      id: 'auth-guard',
      name: 'AuthGuard',
      description: 'Protects routes that require authentication',
      component: castComponent(AuthGuard),
      defaultProps: {
        children: <div>Protected Route Content</div>,
      },
      category: 'common',
      status: 'stable',
    },
    {
      id: 'layout',
      name: 'Layout',
      description: 'Main application layout wrapper',
      component: castComponent(Layout),
      defaultProps: {
        children: <div>Page Content</div>,
      },
      category: 'common',
      status: 'stable',
    },
    {
      id: 'with-inventory-error-boundary',
      name: 'withInventoryErrorBoundary',
      description: 'Higher-order component for wrapping components with inventory error handling',
      component: castComponent(withInventoryErrorBoundary(({ message }: { message: string }) => (
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Wrapped Component</h3>
          <p>{message}</p>
          <button 
            onClick={() => { throw new Error('Inventory error!'); }}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
          >
            Trigger Error
          </button>
        </div>
      ))),
      defaultProps: {
        message: 'This component is wrapped with inventory error boundary HOC',
      },
      category: 'common',
      subcategory: 'hoc',
      status: 'stable',
      requirements: ['HOC pattern', 'Error recovery'],
    },
  ],
};

// Helper functions for registry management
export const addComponent = (component: ComponentRegistryItem) => {
  const category = componentRegistry[component.category];
  if (category) {
    category.push(component);
  }
};

export const getComponent = (id: string): ComponentRegistryItem | undefined => {
  const categories = Object.values(componentRegistry) as ComponentRegistryItem[][];
  for (const category of categories) {
    const component = category.find((c: ComponentRegistryItem) => c.id === id);
    if (component) return component;
  }
  return undefined;
};

export const getComponentsByCategory = (category: ComponentCategory): ComponentRegistryItem[] => {
  return componentRegistry[category] ?? [];
};

export const getAllComponents = (): ComponentRegistryItem[] => {
  return (Object.values(componentRegistry) as ComponentRegistryItem[][]).flat();
};

export const getComponentCount = (): number => {
  return getAllComponents().length;
};

export const getComponentsBySubcategory = (subcategory: string): ComponentRegistryItem[] => {
  return getAllComponents().filter(c => c.subcategory === subcategory);
};

export const searchComponents = (query: string): ComponentRegistryItem[] => {
  const lowerQuery = query.toLowerCase();
  return getAllComponents().filter(c => 
    c.name.toLowerCase().includes(lowerQuery) ||
    (c.description?.toLowerCase().includes(lowerQuery) ?? false) ||
    c.category.toLowerCase().includes(lowerQuery) ||
    c.subcategory?.toLowerCase().includes(lowerQuery),
  );
};
