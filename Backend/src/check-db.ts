import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Quiz } from './quizzes/quiz.schema';
import { Question } from './questions/question.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const quizModel = app.get<Model<Quiz>>(getModelToken(Quiz.name));
    const questionModel = app.get<Model<Question>>(getModelToken(Question.name));

    console.log('\n📊 DATABASE CHECK\n');

    // List all quizzes
    const quizzes = await quizModel.find().lean();
    console.log('📚 Quizzes:');
    for (const quiz of quizzes) {
      console.log(`  - ${quiz.title} (${quiz._id})`);
      console.log(`    Premium: ${quiz.is_premium}`);
      
      // Count questions for this quiz
      const questionCount = await questionModel.countDocuments({ quiz_id: quiz._id });
      console.log(`    Questions: ${questionCount}\n`);
    }

    // List all questions
    const questions = await questionModel.find().lean();
    console.log('\n❓ Questions:');
    for (const q of questions) {
      console.log(`  - ${q.content.substring(0, 50)}...`);
      console.log(`    Question ID: ${q._id}`);
      console.log(`    Quiz ID: ${q.quiz_id}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
