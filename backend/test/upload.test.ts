import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';


import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('../models/user.model');
vi.mock('uploadthing/express', () => ({
  createUploadthingExpressHandler: vi.fn(() => {
    return (req: any, res: any) => {
      // Simulate successful upload response
      res.json({
        url: 'https://uploadthing.com/f/test-file-key',
        key: 'test-file-key',
        name: 'test-image.jpg',
        size: 1024
      });
    };
  })
}));

// Set up test environment variables
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';

describe('Upload Routes', () => {
  let app: express.Application;
  let adminToken: string;
  let customerToken: string;
  const adminUserId = '507f1f77bcf86cd799439011';
  const customerUserId = '507f1f77bcf86cd799439012';

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/uploadthing', uploadRoutes);

    // Create tokens
    adminToken = jwt.sign({ userId: adminUserId }, process.env.ACCESS_TOKEN_SECRET!);
    customerToken = jwt.sign({ userId: customerUserId }, process.env.ACCESS_TOKEN_SECRET!);

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('POST /api/uploadthing', () => {
    it('should allow admin users to upload files', async () => {
      // Mock admin user
      const mockAdminUser = {
        _id: adminUserId,
        role: 'admin',
        email: 'admin@test.com',
        name: 'Admin User'
      };

      vi.mocked(User.findById).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockAdminUser)
      } as any);

      const response = await request(app)
        .post('/api/uploadthing')
        .set('Cookie', `accessToken=${adminToken}`)
        .send({ files: [{ name: 'test-image.jpg', type: 'image/jpeg' }] });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
      expect(response.body.url).toContain('uploadthing.com');
    });

    it('should reject customer users from uploading files', async () => {
      // Mock customer user
      const mockCustomerUser = {
        _id: customerUserId,
        role: 'customer',
        email: 'customer@test.com',
        name: 'Customer User'
      };

      vi.mocked(User.findById).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockCustomerUser)
      } as any);

      const response = await request(app)
        .post('/api/uploadthing')
        .set('Cookie', `accessToken=${customerToken}`)
        .send({ files: [{ name: 'test-image.jpg', type: 'image/jpeg' }] });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Access denied - Admin only');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/uploadthing')
        .send({ files: [{ name: 'test-image.jpg', type: 'image/jpeg' }] });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Unauthorized');
    });

    it('should accept authentication via Authorization header', async () => {
      // Mock admin user
      const mockAdminUser = {
        _id: adminUserId,
        role: 'admin',
        email: 'admin@test.com',
        name: 'Admin User'
      };

      vi.mocked(User.findById).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockAdminUser)
      } as any);

      const response = await request(app)
        .post('/api/uploadthing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ files: [{ name: 'test-image.jpg', type: 'image/jpeg' }] });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
    });

    it('should handle expired tokens correctly', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: adminUserId },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: '-1h' } // Already expired
      );

      const response = await request(app)
        .post('/api/uploadthing')
        .set('Cookie', `accessToken=${expiredToken}`)
        .send({ files: [{ name: 'test-image.jpg', type: 'image/jpeg' }] });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized - Access token expired');
    });
  });
