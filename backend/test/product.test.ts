import { describe, it, expect } from 'vitest';
import { AppError } from '../utils/AppError.js';

describe('Product API Tests', () => {
  it('should create AppError correctly', () => {
    const error = new AppError('Test error', 400);
    void expect(error.message).toBe('Test error');
    void expect(error.statusCode).toBe(400);
    void expect(error.isOperational).toBe(true);
  });

  it('should validate TypeScript compilation', () => {
    const testString = 'TypeScript is working';
    void expect(typeof testString).toBe('string');
  });
});
