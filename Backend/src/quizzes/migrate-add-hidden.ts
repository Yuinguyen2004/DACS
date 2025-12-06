import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration script to add is_hidden field to all existing quizzes
 * Run this once after deploying the schema change
 * 
 * Usage: npx ts-node src/quizzes/migrate-add-hidden.ts
 */
async function migrateQuizzes() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-app';
    
    console.log('🔄 Connecting to MongoDB...');
    await connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const quizzesCollection = db.collection('quizzes');

    console.log('🔄 Checking existing quizzes...');
    const totalQuizzes = await quizzesCollection.countDocuments();
    console.log(`📊 Found ${totalQuizzes} quizzes`);

    console.log('🔄 Adding is_hidden field to quizzes without it...');
    const result = await quizzesCollection.updateMany(
      { is_hidden: { $exists: false } }, // Only update documents missing the field
      { $set: { is_hidden: false } }     // Set default value to false
    );

    console.log('✅ Migration completed!');
    console.log(`   - Matched: ${result.matchedCount} quizzes`);
    console.log(`   - Modified: ${result.modifiedCount} quizzes`);

    // Verify the migration
    const quizzesWithHidden = await quizzesCollection.countDocuments({ 
      is_hidden: { $exists: true } 
    });
    console.log(`✅ Verification: ${quizzesWithHidden}/${totalQuizzes} quizzes now have is_hidden field`);

    await connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateQuizzes();
