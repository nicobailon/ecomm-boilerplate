import type { Meta, StoryObj } from '@storybook/react-vite';
import { YouTubeAddModal } from './YouTubeAddModal';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { Toaster } from 'sonner';

const meta = {
  title: 'Admin/YouTubeAddModal',
  component: YouTubeAddModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster position="top-right" />
      </>
    ),
  ],
  args: {
    isOpen: false,
    onClose: fn(),
    onAdd: fn(async () => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
    }) as any,
  },
} satisfies Meta<typeof YouTubeAddModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: false,
    onClose: fn(),
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Open YouTube Modal
        </button>
        <YouTubeAddModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  },
};

export const Open: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
};

export const WithValidURL: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for modal to render
    await waitFor(() => {
      void expect(canvas.getByLabelText('YouTube URL')).toBeInTheDocument();
    });
    
    // Fill in YouTube URL
    const urlInput = canvas.getByLabelText('YouTube URL');
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Fill in title
    const titleInput = canvas.getByLabelText('Video Title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Never Gonna Give You Up');
    
    // Verify submit button is enabled
    const submitButton = canvas.getByRole('button', { name: 'Add Video' });
    void expect(submitButton).toBeEnabled();
  },
};

export const WithShortURL: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByLabelText('YouTube URL')).toBeInTheDocument();
    });
    
    const urlInput = canvas.getByLabelText('YouTube URL');
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, 'https://youtu.be/dQw4w9WgXcQ');
    
    const titleInput = canvas.getByLabelText('Video Title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Short URL Test');
  },
};

export const WithEmbedURL: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByLabelText('YouTube URL')).toBeInTheDocument();
    });
    
    const urlInput = canvas.getByLabelText('YouTube URL');
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, 'https://www.youtube.com/embed/dQw4w9WgXcQ');
    
    const titleInput = canvas.getByLabelText('Video Title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Embed URL Test');
  },
};

export const InvalidURL: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByLabelText('YouTube URL')).toBeInTheDocument();
    });
    
    const urlInput = canvas.getByLabelText('YouTube URL');
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, 'https://vimeo.com/123456789');
    
    // Tab away to trigger validation
    await userEvent.tab();
    
    // Wait for error message
    await waitFor(() => {
      void expect(canvas.getByText('Please enter a valid YouTube URL')).toBeInTheDocument();
    });
  },
};

export const EmptyFields: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByText('Add Video')).toBeInTheDocument();
    });
    
    // Try to submit without filling fields
    const submitButton = canvas.getByRole('button', { name: 'Add Video' });
    await userEvent.click(submitButton);
    
    // Wait for error messages
    await waitFor(() => {
      void expect(canvas.getByText('Please enter a valid URL')).toBeInTheDocument();
      void expect(canvas.getByText('Title is required')).toBeInTheDocument();
    });
  },
};

export const LoadingState: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
    onAdd: fn(async () => {
      // Simulate long operation
      await new Promise(resolve => setTimeout(resolve, 3000));
    }) as any,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByLabelText('YouTube URL')).toBeInTheDocument();
    });
    
    // Fill in valid data
    const urlInput = canvas.getByLabelText('YouTube URL');
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    const titleInput = canvas.getByLabelText('Video Title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Test Video');
    
    // Submit form
    const submitButton = canvas.getByRole('button', { name: 'Add Video' });
    await userEvent.click(submitButton);
    
    // Check for loading state
    await waitFor(() => {
      void expect(canvas.getByText('Adding...')).toBeInTheDocument();
    });
    
    // Verify buttons are disabled during loading
    void expect(submitButton).toBeDisabled();
    const cancelButton = canvas.getByRole('button', { name: 'Cancel' });
    void expect(cancelButton).toBeDisabled();
  },
};

export const SuccessFlow: Story = {
  args: {
    isOpen: false,
    onClose: fn(),
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    const [message, setMessage] = useState('');
    
    const handleAdd = async (url: string, title: string) => {
      if (args.onAdd) {
        await args.onAdd(url, title);
      }
      setMessage(`Added video: ${title}`);
      setIsOpen(false);
    };
    
    return (
      <>
        <button
          onClick={() => {
            setIsOpen(true);
            setMessage('');
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Add YouTube Video
        </button>
        {message && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
            {message}
          </div>
        )}
        <YouTubeAddModal
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onAdd={handleAdd}
        />
      </>
    );
  },
};

export const PreviewDisplay: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByLabelText('YouTube URL')).toBeInTheDocument();
    });
    
    // Type URL slowly to see preview update
    const urlInput = canvas.getByLabelText('YouTube URL');
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      delay: 100,
    });
    
    // Wait for preview to appear
    await waitFor(() => {
      void expect(canvas.getByAltText('Video preview')).toBeInTheDocument();
    });
  },
};

export const LongTitle: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByLabelText('YouTube URL')).toBeInTheDocument();
    });
    
    const urlInput = canvas.getByLabelText('YouTube URL');
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    const titleInput = canvas.getByLabelText('Video Title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'This is a very long video title that demonstrates how the modal handles lengthy text input and whether it wraps or truncates appropriately within the form field constraints');
  },
};

export const MobileView: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const ErrorState: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
    onAdd: fn(async () => {
      throw new Error('Failed to add video');
    }) as any,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByLabelText('YouTube URL')).toBeInTheDocument();
    });
    
    // Fill in valid data
    const urlInput = canvas.getByLabelText('YouTube URL');
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    const titleInput = canvas.getByLabelText('Video Title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Test Video');
    
    // Submit form
    const submitButton = canvas.getByRole('button', { name: 'Add Video' });
    await userEvent.click(submitButton);
  },
};

export const CompleteWorkflow: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
    onAdd: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    // Wait for modal to open
    await waitFor(() => {
      void expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Check initial state
    const urlInput = canvas.getByLabelText('YouTube URL');
    const titleInput = canvas.getByLabelText('Video Title');
    const submitButton = canvas.getByRole('button', { name: 'Add Video' });
    
    void expect(urlInput).toHaveValue('');
    void expect(titleInput).toHaveValue('');
    void expect(submitButton).toBeDisabled();
    
    // Enter YouTube URL
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Verify preview appears
    await waitFor(() => {
      const preview = canvas.getByAltText('Video preview');
      void expect(preview).toBeInTheDocument();
      void expect(preview).toHaveAttribute('src', expect.stringContaining('dQw4w9WgXcQ'));
    });
    
    // Enter title
    await userEvent.type(titleInput, 'Rick Astley - Never Gonna Give You Up');
    
    // Button should now be enabled
    void expect(submitButton).toBeEnabled();
    
    // Submit
    await userEvent.click(submitButton);
    
    // Verify onAdd was called with correct params
    await waitFor(() => {
      void expect(args.onAdd).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'Rick Astley - Never Gonna Give You Up',
      );
    });
  },
};

export const KeyboardNavigation: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Focus should be on first input
    const urlInput = canvas.getByLabelText('YouTube URL');
    void expect(document.activeElement).toBe(urlInput);
    
    // Tab to title input
    await userEvent.tab();
    const titleInput = canvas.getByLabelText('Video Title');
    void expect(document.activeElement).toBe(titleInput);
    
    // Tab to cancel button
    await userEvent.tab();
    const cancelButton = canvas.getByRole('button', { name: 'Cancel' });
    void expect(document.activeElement).toBe(cancelButton);
    
    // Tab to add button
    await userEvent.tab();
    const addButton = canvas.getByRole('button', { name: 'Add Video' });
    void expect(document.activeElement).toBe(addButton);
    
    // Escape to close
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      void expect(args.onClose).toHaveBeenCalled();
    });
  },
};

export const URLValidation: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByLabelText('YouTube URL')).toBeInTheDocument();
    });
    
    const urlInput = canvas.getByLabelText('YouTube URL');
    
    // Test various URL formats
    const testCases = [
      {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        valid: true,
        description: 'Standard YouTube URL',
      },
      {
        url: 'https://youtu.be/dQw4w9WgXcQ',
        valid: true,
        description: 'Short YouTube URL',
      },
      {
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        valid: true,
        description: 'Embed URL',
      },
      {
        url: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        valid: true,
        description: 'Mobile YouTube URL',
      },
      {
        url: 'https://vimeo.com/123456789',
        valid: false,
        description: 'Non-YouTube URL',
      },
      {
        url: 'not-a-url',
        valid: false,
        description: 'Invalid URL',
      },
    ];
    
    for (const testCase of testCases) {
      await userEvent.clear(urlInput);
      await userEvent.type(urlInput, testCase.url);
      await userEvent.tab();
      
      if (!testCase.valid) {
        await waitFor(() => {
          void expect(canvas.getByText('Please enter a valid YouTube URL')).toBeInTheDocument();
        });
      } else {
        void expect(canvas.queryByText('Please enter a valid YouTube URL')).not.toBeInTheDocument();
      }
    }
  },
};

export const AccessibilityFeatures: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Check dialog has proper attributes
    const dialog = canvas.getByRole('dialog');
    void expect(dialog).toHaveAttribute('aria-modal', 'true');
    void expect(dialog).toHaveAttribute('aria-labelledby');
    
    // Check form inputs have labels
    const urlInput = canvas.getByLabelText('YouTube URL');
    const titleInput = canvas.getByLabelText('Video Title');
    
    void expect(urlInput).toHaveAttribute('aria-required', 'true');
    void expect(titleInput).toHaveAttribute('aria-required', 'true');
    
    // Check error announcements
    const submitButton = canvas.getByRole('button', { name: 'Add Video' });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      const errors = canvas.getAllByRole('alert');
      void expect(errors.length).toBeGreaterThan(0);
    });
  },
};

export const FocusManagement: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Focus should be trapped within modal
    const focusableElements = canvas.getAllByRole('textbox');
    const buttons = canvas.getAllByRole('button');
    const allFocusable = [...focusableElements, ...buttons];
    
    void expect(allFocusable.length).toBeGreaterThan(0);
    
    // Check initial focus
    const firstInput = canvas.getByLabelText('YouTube URL');
    void expect(document.activeElement).toBe(firstInput);
    
    // Tab through all elements
    for (let i = 0; i < allFocusable.length; i++) {
      await userEvent.tab();
    }
    
    // Should cycle back to first element
    await userEvent.tab();
    void expect(document.activeElement).toBe(firstInput);
  },
};

export const ClipboardPaste: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByLabelText('YouTube URL')).toBeInTheDocument();
    });
    
    const urlInput = canvas.getByLabelText('YouTube URL');
    
    // Simulate paste event
    const pasteText = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    await userEvent.click(urlInput);
    await userEvent.paste(pasteText);
    
    // Verify URL was pasted
    void expect(urlInput).toHaveValue(pasteText);
    
    // Verify preview appears after paste
    await waitFor(() => {
      void expect(canvas.getByAltText('Video preview')).toBeInTheDocument();
    });
  },
};

export const HighContrastMode: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  decorators: [
    (Story) => (
      <div className="high-contrast-mode" style={{ filter: 'contrast(2)', background: '#000' }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Check all interactive elements are visible
    const urlInput = canvas.getByLabelText('YouTube URL');
    const titleInput = canvas.getByLabelText('Video Title');
    const buttons = canvas.getAllByRole('button');
    
    void expect(urlInput).toBeVisible();
    void expect(titleInput).toBeVisible();
    buttons.forEach(button => {
      void expect(button).toBeVisible();
    });
  },
};

export const RTLSupport: Story = {
  args: {
    isOpen: true,
    onClose: fn(),
  },
  decorators: [
    (Story) => (
      <div dir="rtl">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Check layout still works in RTL
    const dialog = canvas.getByRole('dialog');
    void expect(dialog).toHaveAttribute('dir', 'rtl');
    
    // Verify inputs still function
    const urlInput = canvas.getByLabelText('YouTube URL');
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=test');
    void expect(urlInput).toHaveValue('https://www.youtube.com/watch?v=test');
  },
};