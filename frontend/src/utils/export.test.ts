import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { escapeCSVValue, arrayToCSV, downloadFile, formatDateForCSV, formatAddressForCSV } from './export';

describe('Export Utilities', () => {
  describe('escapeCSVValue', () => {
    it('should return empty string for null or undefined', () => {
      expect(escapeCSVValue(null)).toBe('');
      expect(escapeCSVValue(undefined)).toBe('');
    });

    it('should convert numbers to strings', () => {
      expect(escapeCSVValue(123)).toBe('123');
      expect(escapeCSVValue(0)).toBe('0');
      expect(escapeCSVValue(-45.67)).toBe('-45.67');
    });

    it('should return string as-is if no special characters', () => {
      expect(escapeCSVValue('simple text')).toBe('simple text');
      expect(escapeCSVValue('12345')).toBe('12345');
    });

    it('should escape values containing commas', () => {
      expect(escapeCSVValue('Hello, World')).toBe('"Hello, World"');
      expect(escapeCSVValue('A, B, C')).toBe('"A, B, C"');
    });

    it('should escape values containing quotes', () => {
      expect(escapeCSVValue('Say "Hello"')).toBe('"Say ""Hello"""');
      expect(escapeCSVValue('"Quoted"')).toBe('"""Quoted"""');
    });

    it('should escape values containing newlines', () => {
      expect(escapeCSVValue('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    });

    it('should escape values with multiple special characters', () => {
      expect(escapeCSVValue('Say "Hello", friend\nHow are you?')).toBe('"Say ""Hello"", friend\nHow are you?"');
    });
  });

  describe('arrayToCSV', () => {
    it('should return empty string for empty array', () => {
      expect(arrayToCSV([], [])).toBe('');
    });

    it('should generate CSV with headers and data', () => {
      const data = [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Boston' },
      ];
      const columns = [
        { key: 'name' as const, label: 'Name' },
        { key: 'age' as const, label: 'Age' },
        { key: 'city' as const, label: 'City' },
      ];
      
      const expected = 'Name,Age,City\nJohn,30,New York\nJane,25,Boston';
      expect(arrayToCSV(data, columns)).toBe(expected);
    });

    it('should handle special characters in data', () => {
      const data = [
        { name: 'John, Jr.', description: 'Says "Hello"' },
      ];
      const columns = [
        { key: 'name' as const, label: 'Name' },
        { key: 'description' as const, label: 'Description' },
      ];
      
      const expected = 'Name,Description\n"John, Jr.","Says ""Hello"""';
      expect(arrayToCSV(data, columns)).toBe(expected);
    });

    it('should handle null and undefined values', () => {
      const data = [
        { name: 'John', age: null, city: undefined },
      ];
      const columns = [
        { key: 'name' as const, label: 'Name' },
        { key: 'age' as const, label: 'Age' },
        { key: 'city' as const, label: 'City' },
      ];
      
      const expected = 'Name,Age,City\nJohn,,';
      expect(arrayToCSV(data, columns)).toBe(expected);
    });
  });

  describe('downloadFile', () => {
    let clickSpy: ReturnType<typeof vi.fn>;
    let createObjectURLSpy: ReturnType<typeof vi.fn>;
    let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
    let mockAnchor: HTMLAnchorElement;

    beforeEach(() => {
      clickSpy = vi.fn();
      mockAnchor = {
        href: '',
        download: '',
        click: clickSpy,
      } as unknown as HTMLAnchorElement;
      
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          return mockAnchor;
        }
        return document.createElement(tagName);
      });
      vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      vi.spyOn(document.body, 'removeChild').mockImplementation((child) => child);
      createObjectURLSpy = vi.fn().mockReturnValue('blob:mock-url');
      revokeObjectURLSpy = vi.fn();
      global.URL.createObjectURL = createObjectURLSpy;
      global.URL.revokeObjectURL = revokeObjectURLSpy;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create and click download link', () => {
      downloadFile('test content', 'test.csv');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should use custom mime type', () => {
      downloadFile('test content', 'test.json', 'application/json');

      const blobCall = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobCall.type).toBe('application/json');
    });
  });

  describe('formatDateForCSV', () => {
    it('should format date string correctly', () => {
      // Test with a specific date and verify format, not exact time due to timezone
      const result = formatDateForCSV('2024-03-15T14:30:00Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
      expect(result.startsWith('2024-03-15')).toBe(true);
    });

    it('should format Date object correctly', () => {
      const date = new Date('2024-03-15T14:30:00Z');
      expect(formatDateForCSV(date)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('should pad single digit values', () => {
      const result = formatDateForCSV('2024-01-05T09:05:00Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
      expect(result.startsWith('2024-01-05')).toBe(true);
    });
  });

  describe('formatAddressForCSV', () => {
    it('should return empty string for falsy address', () => {
      expect(formatAddressForCSV(null)).toBe('');
      expect(formatAddressForCSV(undefined)).toBe('');
    });

    it('should format complete address', () => {
      const address = {
        line1: '123 Main St',
        line2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
      };
      
      expect(formatAddressForCSV(address)).toBe('123 Main St, Apt 4B, New York, NY, 10001, USA');
    });

    it('should skip null/undefined fields', () => {
      const address = {
        line1: '123 Main St',
        line2: null,
        city: 'New York',
        state: undefined,
        postalCode: '10001',
      };
      
      expect(formatAddressForCSV(address)).toBe('123 Main St, New York, 10001');
    });

    it('should handle empty address object', () => {
      expect(formatAddressForCSV({})).toBe('');
    });
  });
});