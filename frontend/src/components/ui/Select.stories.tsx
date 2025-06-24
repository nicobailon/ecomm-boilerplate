import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from '@storybook/test';
import { useState } from 'react';
import { Select } from './Select';

const meta = {
  title: 'UI/Primitives/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A form control for selecting a value from a list of options. Provides native select behavior with custom styling and proper accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    error: {
      control: 'text',
    },
    label: {
      control: 'text',
    },
    placeholder: {
      control: 'text',
    },
  },
  args: {
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Select an option',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Choose an option',
    placeholder: 'Select an option',
  },
};

export const WithError: Story = {
  args: {
    label: 'Choose an option',
    placeholder: 'Select an option',
    error: 'Please select a valid option',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Choose an option',
    placeholder: 'Select an option',
    disabled: true,
  },
};

export const WithDefaultValue: Story = {
  args: {
    label: 'Choose an option',
    defaultValue: 'option2',
  },
};

// Country selector example
export const CountrySelector: Story = {
  args: {
    label: 'Country',
    placeholder: 'Select your country',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'uk', label: 'United Kingdom' },
      { value: 'ca', label: 'Canada' },
      { value: 'au', label: 'Australia' },
      { value: 'de', label: 'Germany' },
      { value: 'fr', label: 'France' },
      { value: 'jp', label: 'Japan' },
      { value: 'cn', label: 'China' },
    ],
  },
};

// Controlled select with state
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    
    const options = [
      { value: 'small', label: 'Small (S)' },
      { value: 'medium', label: 'Medium (M)' },
      { value: 'large', label: 'Large (L)' },
      { value: 'xlarge', label: 'Extra Large (XL)' },
    ];

    return (
      <div className="w-64 space-y-4">
        <Select
          label="Size"
          placeholder="Select a size"
          options={options}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {value && (
          <p className="text-sm text-muted-foreground">
            Selected size: {options.find(opt => opt.value === value)?.label}
          </p>
        )}
      </div>
    );
  },
};

// Form with multiple selects
export const InForm: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      title: '',
      department: '',
      location: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitted(true);
    };

    return (
      <form onSubmit={handleSubmit} className="w-80 space-y-4">
        <Select
          label="Title"
          placeholder="Select your title"
          options={[
            { value: 'mr', label: 'Mr.' },
            { value: 'mrs', label: 'Mrs.' },
            { value: 'ms', label: 'Ms.' },
            { value: 'dr', label: 'Dr.' },
          ]}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <Select
          label="Department"
          placeholder="Select department"
          options={[
            { value: 'engineering', label: 'Engineering' },
            { value: 'design', label: 'Design' },
            { value: 'marketing', label: 'Marketing' },
            { value: 'sales', label: 'Sales' },
            { value: 'hr', label: 'Human Resources' },
          ]}
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          required
        />
        <Select
          label="Office Location"
          placeholder="Select location"
          options={[
            { value: 'ny', label: 'New York' },
            { value: 'sf', label: 'San Francisco' },
            { value: 'london', label: 'London' },
            { value: 'tokyo', label: 'Tokyo' },
          ]}
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
        />
        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Submit
        </button>
        {submitted && (
          <div className="text-sm space-y-1">
            <p className="text-green-600">Form submitted!</p>
            <p className="text-muted-foreground">Title: {formData.title}</p>
            <p className="text-muted-foreground">Department: {formData.department}</p>
            <p className="text-muted-foreground">Location: {formData.location}</p>
          </div>
        )}
      </form>
    );
  },
};

// Select with interaction test
export const InteractionTest: Story = {
  args: {
    label: 'Test Select',
    placeholder: 'Choose an option',
    options: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'orange', label: 'Orange' },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Get select element
    const select = canvas.getByRole('combobox');
    
    // Initially should show placeholder
    await expect(select).toHaveValue('');
    
    // Select an option
    await userEvent.selectOptions(select, 'banana');
    expect(select).toHaveValue('banana');
    
    // Change selection
    await userEvent.selectOptions(select, 'orange');
    expect(select).toHaveValue('orange');
  },
};

// Dynamic options example
export const DynamicOptions: Story = {
  render: () => {
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');

    const subcategoryOptions: Record<string, { value: string; label: string }[]> = {
      electronics: [
        { value: 'phones', label: 'Phones' },
        { value: 'laptops', label: 'Laptops' },
        { value: 'tablets', label: 'Tablets' },
      ],
      clothing: [
        { value: 'mens', label: 'Men\'s Clothing' },
        { value: 'womens', label: 'Women\'s Clothing' },
        { value: 'kids', label: 'Kids\' Clothing' },
      ],
      books: [
        { value: 'fiction', label: 'Fiction' },
        { value: 'nonfiction', label: 'Non-Fiction' },
        { value: 'textbooks', label: 'Textbooks' },
      ],
    };

    return (
      <div className="w-64 space-y-4">
        <Select
          label="Category"
          placeholder="Select a category"
          options={[
            { value: 'electronics', label: 'Electronics' },
            { value: 'clothing', label: 'Clothing' },
            { value: 'books', label: 'Books' },
          ]}
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setSubcategory(''); // Reset subcategory
          }}
        />
        {category && (
          <Select
            label="Subcategory"
            placeholder="Select a subcategory"
            options={subcategoryOptions[category] || []}
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
          />
        )}
        {subcategory && (
          <p className="text-sm text-muted-foreground">
            Selected: {category} → {subcategory}
          </p>
        )}
      </div>
    );
  },
};

// Validation example
export const WithValidation: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      
      // Clear error when user selects something
      if (newValue) {
        setError('');
      }
    };

    const handleValidate = () => {
      if (!value) {
        setError('This field is required');
      } else {
        setError('');
      }
    };

    return (
      <div className="w-64 space-y-4">
        <Select
          label="Required Field"
          placeholder="Select an option"
          options={[
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
            { value: 'option3', label: 'Option 3' },
          ]}
          value={value}
          onChange={handleChange}
          onBlur={handleValidate}
          error={error}
          aria-invalid={!!error}
          aria-describedby={error ? 'select-error' : undefined}
        />
        {error && (
          <p id="select-error" className="sr-only">
            {error}
          </p>
        )}
        <button
          onClick={handleValidate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        >
          Validate
        </button>
      </div>
    );
  },
};

// Accessibility focused example
export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="w-64 space-y-6">
      <Select
        label="Language Preference"
        placeholder="Select language"
        options={[
          { value: 'en', label: 'English' },
          { value: 'es', label: 'Spanish' },
          { value: 'fr', label: 'French' },
          { value: 'de', label: 'German' },
        ]}
        aria-label="Select your preferred language"
        aria-required="true"
      />
      <Select
        label="Accessibility Settings"
        placeholder="Choose setting"
        options={[
          { value: 'highcontrast', label: 'High Contrast Mode' },
          { value: 'largefont', label: 'Large Font Size' },
          { value: 'reducemotion', label: 'Reduce Motion' },
        ]}
        aria-describedby="accessibility-help"
      />
      <p id="accessibility-help" className="text-xs text-muted-foreground">
        These settings will improve your browsing experience
      </p>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'select-name', enabled: true },
          { id: 'label', enabled: true },
        ],
      },
    },
  },
};

// Grouped options (visual representation)
export const GroupedOptions: Story = {
  render: () => (
    <div className="w-64">
      <Select
        label="Product Categories"
        placeholder="Select a category"
        options={[
          { value: 'electronics-phones', label: '📱 Electronics → Phones' },
          { value: 'electronics-laptops', label: '💻 Electronics → Laptops' },
          { value: 'electronics-tablets', label: '📱 Electronics → Tablets' },
          { value: 'clothing-mens', label: '👔 Clothing → Men\'s' },
          { value: 'clothing-womens', label: '👗 Clothing → Women\'s' },
          { value: 'clothing-kids', label: '👶 Clothing → Kids' },
          { value: 'home-furniture', label: '🛋️ Home → Furniture' },
          { value: 'home-decor', label: '🖼️ Home → Decor' },
          { value: 'home-kitchen', label: '🍳 Home → Kitchen' },
        ]}
      />
    </div>
  ),
};