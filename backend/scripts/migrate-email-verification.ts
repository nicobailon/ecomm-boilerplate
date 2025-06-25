import dotenv from 'dotenv';
import { connectDB } from '../lib/db.js';
import { User } from '../models/user.model.js';

dotenv.config();

async function migrateEmailVerification(): Promise<void> {
  try {
    console.error('Starting email verification migration...');
    
    await connectDB();
    
    // Update all existing users to have emailVerified = true
    const result = await User.updateMany(
      { emailVerified: { $exists: false } },
      { 
        $set: { 
          emailVerified: true,
          emailVerificationToken: undefined,
          emailVerificationExpires: undefined,
        }, 
      },
    );
    
    console.error('✅ Migration completed successfully!');
    console.error(`   Updated ${result.modifiedCount} users`);
    console.error(`   Matched ${result.matchedCount} users`);
    
    // Verify the update
    const unverifiedCount = await User.countDocuments({ emailVerified: false });
    console.error(`   Unverified users remaining: ${unverifiedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
void migrateEmailVerification();