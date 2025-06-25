import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'admin';
  cartItems: {
    product: mongoose.Types.ObjectId;
    quantity: number;
    variantId?: string;
    variantDetails?: {
      label?: string;
      size?: string;
      color?: string;
      price: number;
      sku?: string;
    };
  }[];
  appliedCoupon: {
    code: string;
    discountPercentage: number;
  } | null;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  unsubscribeToken?: string;
  emailPreferences?: {
    marketing: boolean;
    orderUpdates: boolean;
    stockNotifications: boolean;
  };
  comparePassword(password: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateUnsubscribeToken(): string;
  generateEmailVerificationToken(): string;
  isEmailVerificationTokenValid(): boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    cartItems: [
      {
        quantity: {
          type: Number,
          default: 1,
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        variantId: {
          type: String,
          required: false,
        },
        variantDetails: {
          type: {
            label: {
              type: String,
              required: false,
            },
            size: {
              type: String,
              required: false,
            },
            color: {
              type: String,
              required: false,
            },
            price: {
              type: Number,
              required: true,
            },
            sku: {
              type: String,
              required: false,
            },
          },
          required: false,
        },
      },
    ],
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    appliedCoupon: {
      type: {
        code: {
          type: String,
          required: true,
        },
        discountPercentage: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
      },
      default: null,
    },
    resetPasswordToken: {
      type: String,
      required: false,
    },
    resetPasswordExpires: {
      type: Date,
      required: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      required: false,
    },
    emailVerificationExpires: {
      type: Date,
      required: false,
    },
    unsubscribeToken: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    emailPreferences: {
      type: {
        marketing: {
          type: Boolean,
          default: true,
        },
        orderUpdates: {
          type: Boolean,
          default: true,
        },
        stockNotifications: {
          type: Boolean,
          default: true,
        },
      },
      default: {
        marketing: true,
        orderUpdates: true,
        stockNotifications: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ role: 1 });
userSchema.index({ 'cartItems.product': 1, 'cartItems.variantId': 1 });
// Note: unsubscribeToken index is automatically created by unique: true in the schema
userSchema.index({ emailVerificationToken: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (this: IUserDocument, password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generatePasswordResetToken = function (this: IUserDocument): string {
  // Generate a secure random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token and save it to the database
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set token expiration to 1 hour from now
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  
  // Return the unhashed token (to be sent via email)
  return resetToken;
};

userSchema.methods.generateUnsubscribeToken = function (this: IUserDocument): string {
  // Generate a unique unsubscribe token
  const unsubscribeToken = crypto.randomBytes(32).toString('hex');
  
  // Save the token to the database (no hashing needed for unsubscribe tokens)
  this.unsubscribeToken = unsubscribeToken;
  
  return unsubscribeToken;
};

userSchema.methods.generateEmailVerificationToken = function (this: IUserDocument): string {
  // Generate a secure random token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token and save it to the database
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Set token expiration to 24 hours from now
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  // Return the unhashed token (to be sent via email)
  return verificationToken;
};

userSchema.methods.isEmailVerificationTokenValid = function (this: IUserDocument): boolean {
  if (!this.emailVerificationToken || !this.emailVerificationExpires) {
    return false;
  }
  
  return this.emailVerificationExpires.getTime() > Date.now();
};

// Generate unsubscribe token on user creation
userSchema.pre('save', function (next) {
  if (this.isNew && !this.unsubscribeToken) {
    this.unsubscribeToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

export const User = mongoose.model<IUserDocument>('User', userSchema);