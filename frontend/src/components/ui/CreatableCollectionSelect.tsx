import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useClickOutside } from '@/hooks/useClickOutside';
import { toast } from 'sonner';

interface Collection {
  _id: string;
  name: string;
  slug: string;
}

interface CreatableCollectionSelectProps {
  value?: string;
  onChange: (value: string) => void;
  onCreateCollection?: (name: string) => Promise<string>;
  collections: Collection[];
  isLoading?: boolean;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  inModal?: boolean;
}

const CreatableCollectionSelectComponent: React.FC<CreatableCollectionSelectProps> = ({
  value,
  onChange,
  onCreateCollection,
  collections,
  isLoading,
  placeholder = 'Select collection...',
  label,
  error,
  disabled,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [optimisticCollections, setOptimisticCollections] = useState<Collection[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [localError, setLocalError] = useState<Error | null>(null);
  const [previousFocusElement, setPreviousFocusElement] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMountedRef = useRef(true);
  
  const MAX_RETRIES = 3;
  const id = useMemo(() => `collection-select-${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Use click outside hook
  const containerRef = useClickOutside<HTMLDivElement>(() => {
    if (isOpen) {
      closeDropdown();
    }
  }, isOpen);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const allCollections = useMemo(() => {
    return [...collections, ...optimisticCollections];
  }, [collections, optimisticCollections]);
  
  const filteredCollections = useMemo(() => {
    if (!searchValue.trim()) return allCollections;
    
    const search = searchValue.toLowerCase().trim();
    return allCollections.filter(
      (c) => c.name.toLowerCase().includes(search),
    );
  }, [allCollections, searchValue]);
  
  const showCreateOption = false; // Disabled create functionality
  
  const selectedCollection = allCollections.find((c) => c._id === value);
  
  const openDropdown = useCallback(() => {
    setPreviousFocusElement(document.activeElement as HTMLElement);
    setIsOpen(true);
  }, []);
  
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(0);
    setSearchValue('');
    setLocalError(null);
    
    // Return focus to trigger element
    if (previousFocusElement) {
      previousFocusElement.focus();
      setPreviousFocusElement(null);
    } else {
      buttonRef.current?.focus();
    }
  }, [previousFocusElement]);
  
  // Simple focus when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure portal is rendered
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);
  
  // Trap focus within dropdown
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        
        if (e.shiftKey) {
          // Shift+Tab: Move focus backwards
          if (document.activeElement === inputRef.current) {
            buttonRef.current?.focus();
          } else {
            inputRef.current?.focus();
          }
        } else {
          // Tab: Move focus forwards
          if (document.activeElement === buttonRef.current) {
            inputRef.current?.focus();
          } else {
            buttonRef.current?.focus();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  const handleCreateWithRetry = useCallback(async (name: string): Promise<string> => {
    if (!onCreateCollection) {
      throw new Error('onCreateCollection is not provided');
    }
    
    let lastError: Error | null = null;
    
    for (let i = 0; i <= MAX_RETRIES; i++) {
      try {
        const result = await onCreateCollection(name);
        setRetryCount(0);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (i < MAX_RETRIES) {
          await new Promise((resolve) => 
            setTimeout(resolve, Math.pow(2, i) * 1000),
          );
          setRetryCount(i + 1);
        }
      }
    }
    
    throw lastError ?? new Error('Failed to create collection after retries');
  }, [onCreateCollection]);
  
  const handleCreate = useCallback(async () => {
    if (!onCreateCollection || !searchValue.trim()) return;
    
    setIsCreating(true);
    
    const tempId = `temp-${Date.now()}`;
    const optimisticCollection = {
      _id: tempId,
      name: searchValue.trim(),
      slug: searchValue.toLowerCase().replace(/\s+/g, '-'),
    };
    
    // Check if component is still mounted
    if (!isMountedRef.current) return;
    
    setOptimisticCollections((prev) => [...prev, optimisticCollection]);
    onChange(tempId);
    
    try {
      const newId = await handleCreateWithRetry(searchValue.trim());
      
      // Check if component is still mounted
      if (!isMountedRef.current) return;
      
      onChange(newId);
      setOptimisticCollections((prev) => 
        prev.filter((c) => c._id !== tempId),
      );
      
      closeDropdown();
    } catch (error) {
      // Only update state if mounted
      if (isMountedRef.current) {
        setOptimisticCollections((prev) => 
          prev.filter((c) => c._id !== tempId),
        );
        onChange('');
        setLocalError(error as Error);
        // Also show toast error
        if (error instanceof Error) {
          toast.error(error.message ?? 'Failed to create collection');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsCreating(false);
      }
    }
  }, [searchValue, onCreateCollection, onChange, handleCreateWithRetry, closeDropdown]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }
    
    const totalItems = filteredCollections.length + (showCreateOption ? 1 : 0);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < totalItems - 1 ? prev + 1 : 0,
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : totalItems - 1,
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (showCreateOption && highlightedIndex === filteredCollections.length) {
          void handleCreate();
        } else if (filteredCollections[highlightedIndex]) {
          onChange(filteredCollections[highlightedIndex]._id);
          closeDropdown();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
    }
  }, [isOpen, filteredCollections, showCreateOption, highlightedIndex, onChange, handleCreate, openDropdown, closeDropdown]);
  
  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label 
          id={`${id}-label`}
          htmlFor={`${id}-button`}
          className="text-sm font-medium text-foreground mb-1 block"
        >
          {label}
        </label>
      )}
      
      {/* Live region for announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {isCreating && `Creating collection ${searchValue}`}
        {localError && `Error: ${localError.message}`}
        {retryCount > 0 && `Retry attempt ${retryCount} of 3`}
      </div>
      
      <div className="relative">
        <Button
          ref={buttonRef}
          id={`${id}-button`}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${id}-listbox`}
          aria-labelledby={`${id}-label`}
          aria-describedby={(error || localError) ? `${id}-error` : undefined}
          aria-activedescendant={highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined}
          disabled={disabled}
          className={cn(
            'w-full justify-between',
            error && 'border-destructive focus-visible:ring-destructive',
          )}
          onClick={() => isOpen ? closeDropdown() : openDropdown()}
          onKeyDown={handleKeyDown}
        >
          <span className={cn('truncate', !selectedCollection && 'text-muted-foreground')}>
            {selectedCollection?.name ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1">
            <div className="rounded-md border bg-popover text-popover-foreground shadow-lg backdrop-blur-sm">
          <div
            id={`${id}-listbox`}
            role="listbox"
            aria-labelledby={`${id}-label`}
          >
            <div className="p-2">
              <Input
                ref={inputRef}
                type="text"
                role="searchbox"
                aria-label="Search collections"
                aria-controls={`${id}-listbox`}
                aria-autocomplete="list"
                placeholder="Search collections..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8"
                autoFocus
              />
            </div>
            
            <div
              ref={listRef}
              className="max-h-60 overflow-auto p-1 scrollbar-dropdown"
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <>
                  {filteredCollections.map((collection, index) => (
                    <div
                      key={collection._id}
                      id={`${id}-option-${index}`}
                      role="option"
                      aria-selected={value === collection._id}
                      className={cn(
                        'flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm',
                        'hover:bg-accent hover:text-accent-foreground',
                        value === collection._id && 'bg-accent',
                        highlightedIndex === index && 'bg-accent',
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onChange(collection._id);
                        closeDropdown();
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === collection._id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {collection.name}
                    </div>
                  ))}
                  
                  {showCreateOption && (
                    <div
                      id={`${id}-option-create`}
                      role="option"
                      aria-selected={highlightedIndex === filteredCollections.length}
                      className={cn(
                        'flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm',
                        'hover:bg-accent hover:text-accent-foreground',
                        'border-t',
                        highlightedIndex === filteredCollections.length && 'bg-accent',
                        isCreating && 'opacity-50 cursor-wait',
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void handleCreate();
                      }}
                    >
                      {isCreating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      <span aria-label={`Create new collection named ${searchValue}`}>
                        Create &ldquo;{searchValue}&rdquo;
                        {retryCount > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (Retry {retryCount}/{MAX_RETRIES})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {filteredCollections.length === 0 && !showCreateOption && (
                    <div className="py-2 text-center text-sm text-muted-foreground">
                      No collections found
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
            </div>
          </div>
        )}
      </div>
      
      {(error ?? localError) && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-destructive">
          {error ?? localError?.message}
        </p>
      )}
    </div>
  );
};

export const CreatableCollectionSelect = React.memo(CreatableCollectionSelectComponent, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.value === nextProps.value &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.collections.length === nextProps.collections.length &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.label === nextProps.label
  );
});

CreatableCollectionSelect.displayName = 'CreatableCollectionSelect';

export const CreatableCollectionSelectSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
    </div>
  );
};