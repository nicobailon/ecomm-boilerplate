import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

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
  comparePassword(password: string): Promise<boolean>;
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
  },
  {
    timestamps: true,
  },
);

userSchema.index({ role: 1 });
userSchema.index({ 'cartItems.product': 1, 'cartItems.variantId': 1 });

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

export const User = mongoose.model<IUserDocument>('User', userSchema);