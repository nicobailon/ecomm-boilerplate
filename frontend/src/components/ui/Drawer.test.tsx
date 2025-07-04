import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Drawer } from './Drawer';
import { vi } from 'vitest';

describe('Drawer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Drawer',
    description: 'Test description',
    children: <div>Test content</div>,
  };

  it('renders when open', () => {
    render(<Drawer {...defaultProps} />);
    
    void expect(screen.getByText('Test Drawer')).toBeInTheDocument();
    void expect(screen.getByText('Test description')).toBeInTheDocument();
    void expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<Drawer {...defaultProps} isOpen={false} />);
    
    void expect(screen.queryByText('Test Drawer')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    
    render(<Drawer {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);
    
    void expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    
    render(<Drawer {...defaultProps} onClose={onClose} />);
    
    await user.keyboard('{Escape}');
    
    void expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports left side positioning', () => {
    render(<Drawer {...defaultProps} side="left" />);
    
    const content = screen.getByRole('dialog');
    void expect(content).toHaveClass('left-0');
    void expect(content).not.toHaveClass('right-0');
  });

  it('renders without title and description', () => {
    render(
      <Drawer isOpen={true} onClose={vi.fn()}>
        <div>Content only</div>
      </Drawer>,
    );
    
    void expect(screen.getByText('Content only')).toBeInTheDocument();
  });
});