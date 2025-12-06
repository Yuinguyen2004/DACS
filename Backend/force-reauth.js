const { connect, connection } = require('mongoose');
require('dotenv').config();

async function forceReauth() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-app';
    
    console.log('🔄 Connecting to MongoDB...');
    await connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = connection.db;
    const usersCollection = db.collection('users');

    console.log('\n🔄 Forcing all users to re-authenticate...');
    console.log('   (This will set all users to offline status)');
    
    const result = await usersCollection.updateMany(
      {},
      { 
        $set: { 
          isOnline: false,
          lastSeen: new Date()
        } 
      }
    );

    console.log('\n✅ Users will need to re-login!');
    console.log(`   - Updated: ${result.modifiedCount} users`);
    console.log('\n📌 What users need to do:');
    console.log('   1. Refresh their browser (F5)');
    console.log('   2. They will see "session expired" error');
    console.log('   3. Clear localStorage and login again');
    console.log('   OR just logout and login again');

    await connection.close();
    console.log('\n�� Done! Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

forceReauth();
