import express from 'express';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';

const router = express.Router();

// GET /api/unsubscribe?token=xxx&type=all|marketing|orderUpdates|stockNotifications
router.get('/', (req, res) => {
  void (async () => {
  try {
    const { token, type = 'all' } = req.query;

    if (!token || typeof token !== 'string') {
      throw new AppError('Invalid unsubscribe token', 400);
    }

    // Find user by unsubscribe token
    const user = await User.findOne({ unsubscribeToken: token });

    if (!user) {
      throw new AppError('Invalid or expired unsubscribe link', 400);
    }

    // Update email preferences based on type
    user.emailPreferences ??= {
      marketing: true,
      orderUpdates: true,
      stockNotifications: true,
    };

    switch (type) {
      case 'all':
        user.emailPreferences.marketing = false;
        user.emailPreferences.orderUpdates = false;
        user.emailPreferences.stockNotifications = false;
        break;
      case 'marketing':
        user.emailPreferences.marketing = false;
        break;
      case 'orderUpdates':
        user.emailPreferences.orderUpdates = false;
        break;
      case 'stockNotifications':
        user.emailPreferences.stockNotifications = false;
        break;
      default:
        throw new AppError('Invalid unsubscribe type', 400);
    }

    await user.save();

    // Redirect to unsubscribe confirmation page
    const confirmationUrl = `${process.env.CLIENT_URL}/unsubscribe-success?type=${type}`;
    res.redirect(confirmationUrl);
  } catch {
    // Redirect to error page on failure
    const errorUrl = `${process.env.CLIENT_URL}/unsubscribe-error`;
    res.redirect(errorUrl);
  }
  })();
});

// POST /api/unsubscribe - Update email preferences (authenticated)
router.post('/', (req, res) => {
  void (async () => {
  try {
    const { userId, preferences } = req.body as { userId?: string; preferences?: { marketing?: boolean; orderUpdates?: boolean; stockNotifications?: boolean } };

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update email preferences
    if (preferences) {
      user.emailPreferences = {
        marketing: preferences?.marketing ?? true,
        orderUpdates: preferences?.orderUpdates ?? true,
        stockNotifications: preferences?.stockNotifications ?? true,
      };
      await user.save();
    }

    return res.json({
      success: true,
      emailPreferences: user.emailPreferences,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update email preferences',
    });
  }
  })();
});

export default router;