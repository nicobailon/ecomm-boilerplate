export const sanitizeText = (text: string): string => {
  return text.replace(/[<>'"]/g, '').slice(0, 20);
};

export const placeholderImages = {
  product: (text = 'Product') => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%236b7280' font-family='system-ui' font-size='20'%3E${encodeURIComponent(sanitizeText(text))}%3C/text%3E%3C/svg%3E`,
  avatar: (text = 'User') => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%236b7280' font-family='system-ui' font-size='14'%3E${encodeURIComponent(sanitizeText(text))}%3C/text%3E%3C/svg%3E`,
  banner: (text = 'Banner') => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='400' viewBox='0 0 1200 400'%3E%3Crect width='1200' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%236b7280' font-family='system-ui' font-size='24'%3E${encodeURIComponent(sanitizeText(text))}%3C/text%3E%3C/svg%3E`,
};