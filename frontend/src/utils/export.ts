/**
 * Escapes CSV values to handle commas, quotes, and newlines according to RFC 4180
 * @param value - The value to escape (string, number, null, or undefined)
 * @returns The escaped CSV value as a string
 * @example
 * escapeCSVValue('Hello, World') // returns '"Hello, World"'
 * escapeCSVValue('Say "Hello"') // returns '"Say ""Hello"""'
 * escapeCSVValue(null) // returns ''
 */
export function escapeCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  // Check if value needs escaping (contains comma, quote, or newline)
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Escape quotes by doubling them
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return stringValue;
}

/**
 * Converts an array of objects to CSV string with proper formatting
 * @param data - Array of objects to convert to CSV
 * @param columns - Column definitions with keys mapping to object properties and display labels
 * @returns CSV formatted string with headers and data rows
 * @example
 * const data = [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }];
 * const columns = [
 *   { key: 'name', label: 'Name' },
 *   { key: 'age', label: 'Age' }
 * ];
 * arrayToCSV(data, columns) // returns 'Name,Age\nJohn,30\nJane,25'
 */
export function arrayToCSV<T>(
  data: T[],
  columns: { key: keyof T; label: string }[],
): string {
  if (!data.length) return '';
  
  // Create header row
  const headers = columns.map(col => escapeCSVValue(col.label)).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return columns
      .map(col => escapeCSVValue(item[col.key] as string | number))
      .join(',');
  });
  
  return [headers, ...rows].join('\n');
}

/**
 * Downloads a string as a file by creating a blob and triggering a download
 * @param content - The string content to download
 * @param filename - The name of the file to download
 * @param mimeType - The MIME type of the file (defaults to 'text/csv')
 * @example
 * downloadFile('Name,Age\nJohn,30', 'users.csv', 'text/csv');
 * downloadFile(JSON.stringify(data), 'data.json', 'application/json');
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats a date for CSV export in YYYY-MM-DD HH:mm format
 * @param date - The date to format (as Date object or ISO string)
 * @returns Formatted date string in local timezone
 * @example
 * formatDateForCSV(new Date()) // returns '2024-03-15 14:30'
 * formatDateForCSV('2024-03-15T14:30:00Z') // returns '2024-03-15 14:30'
 */
export function formatDateForCSV(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Formats an address object into a single line string for CSV export
 * @param address - Address object with optional fields
 * @returns Comma-separated address string, omitting empty fields
 * @example
 * formatAddressForCSV({
 *   line1: '123 Main St',
 *   city: 'New York',
 *   state: 'NY',
 *   postalCode: '10001'
 * }) // returns '123 Main St, New York, NY, 10001'
 */
export function formatAddressForCSV(address: {
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
} | null | undefined): string {
  if (!address) return '';
  
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);
  
  return parts.join(', ');
}