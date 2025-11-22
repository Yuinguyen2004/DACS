import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Model } from 'mongoose';
import { User } from './users/user.schema';
import { Quiz } from './quizzes/quiz.schema';
import { Question } from './questions/question.schema';
import { Answer } from './answers/answer.schema';
import { Package } from './packages/package.schema';
import * as bcrypt from 'bcryptjs';
import { getModelToken } from '@nestjs/mongoose';

/**
 * Database Seeder Script for Testing
 * Creates test users, quizzes, questions, and premium packages
 * 
 * Usage: npm run seed
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const quizModel = app.get<Model<Quiz>>(getModelToken(Quiz.name));
  const questionModel = app.get<Model<Question>>(getModelToken(Question.name));
  const answerModel = app.get<Model<Answer>>(getModelToken(Answer.name));
  const packageModel = app.get<Model<Package>>(getModelToken(Package.name));

  console.log('🌱 Starting database seeding...');

  try {
    // ============================================
    // 1. CREATE TEST USERS
    // ============================================
    console.log('\n📝 Creating test users...');
    
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Clear existing test users (optional - comment out if you want to keep existing data)
    await userModel.deleteMany({ 
      email: { 
        $in: [
          'admin@test.com', 
          'teacher@test.com', 
          'student@test.com',
          'premium@test.com'
        ] 
      } 
    });

    const adminUser = await userModel.create({
      name: 'Admin User',
      username: 'admin',
      email: 'admin@test.com',
      password_hash: passwordHash,
      role: 'admin',
      firebaseUid: 'test-admin-uid',
    });
    console.log('✅ Created admin user: admin@test.com / password123');

    const teacherUser = await userModel.create({
      name: 'Teacher User',
      username: 'teacher',
      email: 'teacher@test.com',
      password_hash: passwordHash,
      role: 'teacher',
      firebaseUid: 'test-teacher-uid',
    });
    console.log('✅ Created teacher user: teacher@test.com / password123');

    const studentUser = await userModel.create({
      name: 'Student User',
      username: 'student',
      email: 'student@test.com',
      password_hash: passwordHash,
      role: 'student',
      firebaseUid: 'test-student-uid',
    });
    console.log('✅ Created student user: student@test.com / password123');

    // ============================================
    // 2. CREATE PACKAGES
    // ============================================
    console.log('\n📦 Creating subscription packages...');
    
    const freePackage = await packageModel.create({
      name: 'Free Package',
      price: 0,
      Duration: 0,
      Benefit: 'Access to free quizzes, Basic analytics',
    });
    console.log('✅ Created Free Package');

    const premiumPackage = await packageModel.create({
      name: 'Premium Monthly',
      price: 99000,
      Duration: 30,
      Benefit: 'Access to all premium quizzes, Advanced analytics, Quiz creation with AI import, Priority support',
    });
    console.log('✅ Created Premium Package (99,000 VND/month)');

    // Create premium user with subscription
    const premiumUser = await userModel.create({
      name: 'Premium Student',
      username: 'premium',
      email: 'premium@test.com',
      password_hash: passwordHash,
      role: 'student',
      firebaseUid: 'test-premium-uid',
      package_id: premiumPackage._id,
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });
    console.log('✅ Created premium student: premium@test.com / password123');

    // ============================================
    // 3. CREATE FREE QUIZZES
    // ============================================
    console.log('\n📚 Creating free quizzes...');

    const freeQuiz1 = await quizModel.create({
      title: 'JavaScript Basics',
      description: 'Test your knowledge of JavaScript fundamentals',
      category: 'Programming',
      difficulty: 'easy',
      time_limit: 10,
      is_premium: false,
      user_id: teacherUser._id,
    });
    console.log('✅ Created free quiz: JavaScript Basics');

    // Add questions for JavaScript Basics
    const jsq1 = await questionModel.create({
      quiz_id: freeQuiz1._id,
      question_text: 'What is the output of: console.log(typeof null)?',
      order: 1,
    });

    await answerModel.create([
      { question_id: jsq1._id, answer_text: 'null', is_correct: false },
      { question_id: jsq1._id, answer_text: 'object', is_correct: true },
      { question_id: jsq1._id, answer_text: 'undefined', is_correct: false },
      { question_id: jsq1._id, answer_text: 'number', is_correct: false },
    ]);

    const jsq2 = await questionModel.create({
      quiz_id: freeQuiz1._id,
      question_text: 'Which method adds an element to the end of an array?',
      order: 2,
    });

    await answerModel.create([
      { question_id: jsq2._id, answer_text: 'push()', is_correct: true },
      { question_id: jsq2._id, answer_text: 'pop()', is_correct: false },
      { question_id: jsq2._id, answer_text: 'shift()', is_correct: false },
      { question_id: jsq2._id, answer_text: 'unshift()', is_correct: false },
    ]);

    const jsq3 = await questionModel.create({
      quiz_id: freeQuiz1._id,
      question_text: 'What does "let" keyword do in JavaScript?',
      order: 3,
    });

    await answerModel.create([
      { question_id: jsq3._id, answer_text: 'Declares a constant', is_correct: false },
      { question_id: jsq3._id, answer_text: 'Declares a block-scoped variable', is_correct: true },
      { question_id: jsq3._id, answer_text: 'Declares a global variable', is_correct: false },
      { question_id: jsq3._id, answer_text: 'Creates a function', is_correct: false },
    ]);

    console.log('  ✅ Added 3 questions to JavaScript Basics');

    // ============================================
    // 4. CREATE PREMIUM QUIZZES
    // ============================================
    console.log('\n💎 Creating premium quizzes...');

    const premiumQuiz1 = await quizModel.create({
      title: 'Advanced TypeScript Patterns',
      description: 'Master advanced TypeScript concepts and design patterns',
      category: 'Programming',
      difficulty: 'hard',
      time_limit: 20,
      is_premium: true,
      user_id: teacherUser._id,
    });
    console.log('✅ Created premium quiz: Advanced TypeScript Patterns');

    // Add questions for Advanced TypeScript
    const tsq1 = await questionModel.create({
      quiz_id: premiumQuiz1._id,
      question_text: 'What is a "discriminated union" in TypeScript?',
      order: 1,
    });

    await answerModel.create([
      { question_id: tsq1._id, answer_text: 'A union type with a common property', is_correct: true },
      { question_id: tsq1._id, answer_text: 'A type that can be null or undefined', is_correct: false },
      { question_id: tsq1._id, answer_text: 'A generic type parameter', is_correct: false },
      { question_id: tsq1._id, answer_text: 'An interface extension', is_correct: false },
    ]);

    const tsq2 = await questionModel.create({
      quiz_id: premiumQuiz1._id,
      question_text: 'What does the "satisfies" keyword do in TypeScript?',
      order: 2,
    });

    await answerModel.create([
      { question_id: tsq2._id, answer_text: 'Validates type without widening', is_correct: true },
      { question_id: tsq2._id, answer_text: 'Checks runtime values', is_correct: false },
      { question_id: tsq2._id, answer_text: 'Creates a new type alias', is_correct: false },
      { question_id: tsq2._id, answer_text: 'Implements an interface', is_correct: false },
    ]);

    const tsq3 = await questionModel.create({
      quiz_id: premiumQuiz1._id,
      question_text: 'What is "conditional type" in TypeScript?',
      order: 3,
    });

    await answerModel.create([
      { question_id: tsq3._id, answer_text: 'A type that depends on a condition (T extends U ? X : Y)', is_correct: true },
      { question_id: tsq3._id, answer_text: 'A type that can be null', is_correct: false },
      { question_id: tsq3._id, answer_text: 'An optional property type', is_correct: false },
      { question_id: tsq3._id, answer_text: 'A type guard function', is_correct: false },
    ]);

    console.log('  ✅ Added 3 questions to Advanced TypeScript Patterns');

    const premiumQuiz2 = await quizModel.create({
      title: 'React Hooks Deep Dive',
      description: 'Master React Hooks and their advanced usage patterns',
      category: 'Frontend',
      difficulty: 'medium',
      time_limit: 15,
      is_premium: true,
      user_id: teacherUser._id,
    });
    console.log('✅ Created premium quiz: React Hooks Deep Dive');

    // Add questions for React Hooks
    const rq1 = await questionModel.create({
      quiz_id: premiumQuiz2._id,
      question_text: 'What is the purpose of useEffect dependency array?',
      order: 1,
    });

    await answerModel.create([
      { question_id: rq1._id, answer_text: 'To control when effect runs', is_correct: true },
      { question_id: rq1._id, answer_text: 'To store state values', is_correct: false },
      { question_id: rq1._id, answer_text: 'To define props', is_correct: false },
      { question_id: rq1._id, answer_text: 'To manage context', is_correct: false },
    ]);

    const rq2 = await questionModel.create({
      quiz_id: premiumQuiz2._id,
      question_text: 'When should you use useMemo?',
      order: 2,
    });

    await answerModel.create([
      { question_id: rq2._id, answer_text: 'For expensive calculations', is_correct: true },
      { question_id: rq2._id, answer_text: 'For all computed values', is_correct: false },
      { question_id: rq2._id, answer_text: 'For API calls', is_correct: false },
      { question_id: rq2._id, answer_text: 'For event handlers', is_correct: false },
    ]);

    console.log('  ✅ Added 2 questions to React Hooks Deep Dive');

    // ============================================
    // 5. CREATE MORE FREE QUIZZES
    // ============================================
    const freeQuiz2 = await quizModel.create({
      title: 'HTML & CSS Fundamentals',
      description: 'Test your web development basics',
      category: 'Web Development',
      difficulty: 'easy',
      time_limit: 10,
      is_premium: false,
      user_id: teacherUser._id,
    });
    console.log('✅ Created free quiz: HTML & CSS Fundamentals');

    const hq1 = await questionModel.create({
      quiz_id: freeQuiz2._id,
      question_text: 'What does CSS stand for?',
      order: 1,
    });

    await answerModel.create([
      { question_id: hq1._id, answer_text: 'Computer Style Sheets', is_correct: false },
      { question_id: hq1._id, answer_text: 'Cascading Style Sheets', is_correct: true },
      { question_id: hq1._id, answer_text: 'Creative Style System', is_correct: false },
      { question_id: hq1._id, answer_text: 'Colorful Style Sheets', is_correct: false },
    ]);

    const hq2 = await questionModel.create({
      quiz_id: freeQuiz2._id,
      question_text: 'Which HTML tag is used for the largest heading?',
      order: 2,
    });

    await answerModel.create([
      { question_id: hq2._id, answer_text: '<h1>', is_correct: true },
      { question_id: hq2._id, answer_text: '<h6>', is_correct: false },
      { question_id: hq2._id, answer_text: '<heading>', is_correct: false },
      { question_id: hq2._id, answer_text: '<head>', is_correct: false },
    ]);

    console.log('  ✅ Added 2 questions to HTML & CSS Fundamentals');

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n✨ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  - Users: 4 (1 admin, 1 teacher, 1 student, 1 premium student)');
    console.log('  - Packages: 2 (Free, Premium)');
    console.log('  - Free Quizzes: 2');
    console.log('  - Premium Quizzes: 2');
    console.log('  - Total Questions: 10');
    console.log('  - Total Answers: 36\n');
    
    console.log('🔑 Test Credentials:');
    console.log('  Admin:    admin@test.com / password123');
    console.log('  Teacher:  teacher@test.com / password123');
    console.log('  Student:  student@test.com / password123');
    console.log('  Premium:  premium@test.com / password123 (has active subscription)\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
