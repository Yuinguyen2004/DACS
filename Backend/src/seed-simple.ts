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

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const quizModel = app.get<Model<Quiz>>(getModelToken(Quiz.name));
  const questionModel = app.get<Model<Question>>(getModelToken(Question.name));
  const answerModel = app.get<Model<Answer>>(getModelToken(Answer.name));
  const packageModel = app.get<Model<Package>>(getModelToken(Package.name));

  console.log('🌱 Starting simple database seeding...');

  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    console.log('\n📝 Creating test users...');
    await userModel.deleteMany({ email: /@test\.com$/ });

    const admin = await userModel.create({
      name: 'Admin',
      username: 'admin',
      email: 'admin@test.com',
      password_hash: passwordHash,
      role: 'admin',
    });

    const teacher = await userModel.create({
      name: 'Teacher',
      username: 'teacher',
      email: 'teacher@test.com',
      password_hash: passwordHash,
      role: 'teacher',
    });

    const student = await userModel.create({
      name: 'Student',
      username: 'student',
      email: 'student@test.com',
      password_hash: passwordHash,
      role: 'student',
    });

    console.log('✅ Created 3 users');

    console.log('\n📦 Creating packages...');
    const premiumPkg = await packageModel.create({
      name: 'Premium',
      price: 99000,
      Duration: 30,
      Benefit: 'All features',
    });

    const premium = await userModel.create({
      name: 'Premium Student',
      username: 'premium',
      email: 'premium@test.com',
      password_hash: passwordHash,
      role: 'student',
      package_id: premiumPkg._id,
    });

    console.log('✅ Created premium package and user');

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

    console.log('✅ Created 2 quizzes');

    console.log('\n❓ Creating questions...');
    const q1 = await questionModel.create({
      quiz_id: freeQuiz._id,
      content: 'What is typeof null?',
      type: 'mcq',
      question_number: 1,
    });

    await answerModel.create([
      { question_id: q1._id, content: 'null', is_correct: false },
      { question_id: q1._id, content: 'object', is_correct: true },
      { question_id: q1._id, content: 'undefined', is_correct: false },
    ]);

    const q2 = await questionModel.create({
      quiz_id: premiumQuiz._id,
      content: 'What is a discriminated union?',
      type: 'mcq',
      question_number: 1,
    });

    await answerModel.create([
      { question_id: q2._id, content: 'Union with common property', is_correct: true },
      { question_id: q2._id, content: 'Nullable type', is_correct: false },
      { question_id: q2._id, content: 'Generic type', is_correct: false },
    ]);

    console.log('✅ Created questions and answers');

    console.log('\n✨ Seeding complete!\n');
    console.log('🔑 Test credentials:');
    console.log('  admin@test.com / password123');
    console.log('  teacher@test.com / password123');
    console.log('  student@test.com / password123');
    console.log('  premium@test.com / password123 (has premium)\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
