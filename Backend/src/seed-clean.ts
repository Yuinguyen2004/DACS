import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Quiz } from './quizzes/quiz.schema';
import { Question } from './questions/question.schema';
import { Answer } from './answers/answer.schema';
import { User } from './users/user.schema';
import { Package } from './packages/package.schema';
import { TestAttempt } from './test-attempts/test-attempt.schema';
import { Leaderboard } from './leaderboards/leaderboard.schema';
import { Notification } from './notifications/notification.schema';
import * as bcrypt from 'bcryptjs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('\n🧹 Cleaning database...');

    const quizModel = app.get<Model<Quiz>>(getModelToken(Quiz.name));
    const questionModel = app.get<Model<Question>>(getModelToken(Question.name));
    const answerModel = app.get<Model<Answer>>(getModelToken(Answer.name));
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const packageModel = app.get<Model<Package>>(getModelToken(Package.name));
    const testAttemptModel = app.get<Model<TestAttempt>>(getModelToken(TestAttempt.name));
    const leaderboardModel = app.get<Model<Leaderboard>>(getModelToken(Leaderboard.name));
    const notificationModel = app.get<Model<Notification>>(getModelToken(Notification.name));

    // Delete all data
    await quizModel.deleteMany({});
    await questionModel.deleteMany({});
    await answerModel.deleteMany({});
    await userModel.deleteMany({});
    await packageModel.deleteMany({});
    await testAttemptModel.deleteMany({});
    await leaderboardModel.deleteMany({});
    await notificationModel.deleteMany({});

    console.log('✅ Database cleaned');

    console.log('\n📦 Creating packages...');
    const freePkg = await packageModel.create({
      name: 'Free',
      price: 0,
      Duration: 0,
      Benefit: 'Basic features',
    });

    const premiumPkg = await packageModel.create({
      name: 'Premium',
      price: 99000,
      Duration: 30,
      Benefit: 'All features',
    });

    console.log('✅ Created packages');

    console.log('\n👥 Creating users...');
    const passwordHash = await bcrypt.hash('password123', 10);

    const admin = await userModel.create({
      name: 'Admin User',
      username: 'admin',
      email: 'admin@test.com',
      password_hash: passwordHash,
      role: 'admin',
      package_id: premiumPkg._id,
    });

    const teacher = await userModel.create({
      name: 'Teacher User',
      username: 'teacher',
      email: 'teacher@test.com',
      password_hash: passwordHash,
      role: 'teacher',
      package_id: freePkg._id,
    });

    const student = await userModel.create({
      name: 'Student User',
      username: 'student',
      email: 'student@test.com',
      password_hash: passwordHash,
      role: 'student',
      package_id: freePkg._id,
    });

    const premium = await userModel.create({
      name: 'Premium Student',
      username: 'premium',
      email: 'premium@test.com',
      password_hash: passwordHash,
      role: 'student',
      package_id: premiumPkg._id,
    });

    console.log('✅ Created users');

    console.log('\n📚 Creating quizzes...');
    const freeQuiz = await quizModel.create({
      title: 'JavaScript Basics',
      description: 'Test your JS knowledge',
      category: 'Programming',
      difficulty: 'easy',
      time_limit: 10,
      is_premium: false,
      user_id: teacher._id,
    });

    const premiumQuiz = await quizModel.create({
      title: 'Advanced TypeScript',
      description: 'Master TypeScript',
      category: 'Programming',
      difficulty: 'hard',
      time_limit: 20,
      is_premium: true,
      user_id: teacher._id,
    });

    console.log('✅ Created quizzes');
    console.log(`   Free Quiz ID: ${freeQuiz._id}`);
    console.log(`   Premium Quiz ID: ${premiumQuiz._id}`);

    console.log('\n❓ Creating questions...');
    
    // Free quiz questions
    const q1 = await questionModel.create({
      quiz_id: freeQuiz._id,
      content: 'What is typeof null in JavaScript?',
      type: 'mcq',
      question_number: 1,
    });

    await answerModel.create([
      { question_id: q1._id, content: 'null', is_correct: false },
      { question_id: q1._id, content: 'object', is_correct: true },
      { question_id: q1._id, content: 'undefined', is_correct: false },
    ]);

    const q2 = await questionModel.create({
      quiz_id: freeQuiz._id,
      content: 'What does "use strict" do?',
      type: 'mcq',
      question_number: 2,
    });

    await answerModel.create([
      { question_id: q2._id, content: 'Enables strict mode', is_correct: true },
      { question_id: q2._id, content: 'Disables warnings', is_correct: false },
      { question_id: q2._id, content: 'Improves performance', is_correct: false },
    ]);

    // Premium quiz questions
    const q3 = await questionModel.create({
      quiz_id: premiumQuiz._id,
      content: 'What is a discriminated union in TypeScript?',
      type: 'mcq',
      question_number: 1,
    });

    await answerModel.create([
      { question_id: q3._id, content: 'Union with common property', is_correct: true },
      { question_id: q3._id, content: 'Nullable type', is_correct: false },
      { question_id: q3._id, content: 'Generic type', is_correct: false },
    ]);

    const q4 = await questionModel.create({
      quiz_id: premiumQuiz._id,
      content: 'What is the purpose of "readonly" modifier?',
      type: 'mcq',
      question_number: 2,
    });

    await answerModel.create([
      { question_id: q4._id, content: 'Prevents modification after initialization', is_correct: true },
      { question_id: q4._id, content: 'Makes property private', is_correct: false },
      { question_id: q4._id, content: 'Optimizes memory usage', is_correct: false },
    ]);

    console.log('✅ Created questions and answers');

    // Verify
    const freeQCount = await questionModel.countDocuments({ quiz_id: freeQuiz._id });
    const premiumQCount = await questionModel.countDocuments({ quiz_id: premiumQuiz._id });

    console.log('\n✨ Seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   Free Quiz (${freeQuiz._id}): ${freeQCount} questions`);
    console.log(`   Premium Quiz (${premiumQuiz._id}): ${premiumQCount} questions`);
    console.log('\n🔑 Test credentials:');
    console.log('   admin@test.com / password123 (admin)');
    console.log('   teacher@test.com / password123 (teacher)');
    console.log('   student@test.com / password123 (free)');
    console.log('   premium@test.com / password123 (premium access)\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
