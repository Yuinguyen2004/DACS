import 'package:mobilefe/models/activity_model.dart';
import 'package:mobilefe/models/category_model.dart';
import 'package:mobilefe/models/leaderboard_entry.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/models/quiz_question_model.dart';
import 'package:mobilefe/models/user_model.dart';

const mockUser = UserModel(
  id: 'user-1',
  name: 'Linh Nguyen',
  email: 'linh.nguyen@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?img=32',
  level: 'Pro Learner',
  points: 4820,
  quizzesTaken: 37,
  averageScore: 86.5,
  isPremium: false,
);

final mockQuizzes = <QuizModel>[
  const QuizModel(
    id: 'quiz-1',
    title: 'IELTS Vocabulary Sprint',
    author: 'Ms. Hannah',
    category: 'English',
    difficulty: QuizDifficulty.intermediate,
    questionCount: 20,
    durationMinutes: 15,
    thumbnail:
        'https://images.unsplash.com/photo-1484820543000-5e4e1de22c75?auto=format&fit=crop&w=600&q=60',
    description: 'Boost your IELTS vocab with curated flash questions.',
  ),
  const QuizModel(
    id: 'quiz-2',
    title: 'Calculus Fundamentals',
    author: 'Thay Tuan',
    category: 'Mathematics',
    difficulty: QuizDifficulty.advanced,
    questionCount: 30,
    durationMinutes: 25,
    thumbnail:
        'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=600&q=60',
    description: 'Master derivatives & integrals with bite-sized problems.',
  ),
  const QuizModel(
    id: 'quiz-3',
    title: 'Physics Marathon',
    author: 'Dr. Tran',
    category: 'Physics',
    difficulty: QuizDifficulty.intermediate,
    questionCount: 25,
    durationMinutes: 20,
    thumbnail:
        'https://images.unsplash.com/photo-1462332420958-a05d1e002413?auto=format&fit=crop&w=600&q=60',
    description: 'Motion, waves, and energy concepts for Grade 12.',
  ),
];

final recentActivities = <ActivityModel>[
  ActivityModel(
    id: 'activity-1',
    quizTitle: 'US History Quick Check',
    score: 92,
    completedOn: DateTime.now().subtract(const Duration(hours: 3)),
    status: ActivityStatus.completed,
  ),
  ActivityModel(
    id: 'activity-2',
    quizTitle: 'TOEIC Listening Set',
    score: 78,
    completedOn: DateTime.now().subtract(const Duration(days: 1, hours: 2)),
    status: ActivityStatus.completed,
  ),
  ActivityModel(
    id: 'activity-3',
    quizTitle: 'Chemistry Lab Safety',
    score: 65,
    completedOn: DateTime.now().subtract(const Duration(days: 2, hours: 5)),
    status: ActivityStatus.inProgress,
  ),
];

final categories = <CategoryModel>[
  const CategoryModel(id: 'math', name: 'Math', icon: 'calculator'),
  const CategoryModel(id: 'physics', name: 'Physics', icon: 'atom'),
  const CategoryModel(id: 'english', name: 'English', icon: 'book-open-text'),
  const CategoryModel(id: 'code', name: 'Coding', icon: 'laptop'),
  const CategoryModel(id: 'history', name: 'History', icon: 'library'),
  const CategoryModel(id: 'biology', name: 'Biology', icon: 'dna'),
];

final leaderboardEntries = <LeaderboardEntry>[
  const LeaderboardEntry(
    rank: 1,
    name: 'Huy Tran',
    avatarUrl: 'https://i.pravatar.cc/150?img=15',
    score: 980,
  ),
  const LeaderboardEntry(
    rank: 2,
    name: 'My Dinh',
    avatarUrl: 'https://i.pravatar.cc/150?img=25',
    score: 920,
  ),
  const LeaderboardEntry(
    rank: 3,
    name: 'Bao An',
    avatarUrl: 'https://i.pravatar.cc/150?img=38',
    score: 905,
  ),
  const LeaderboardEntry(
    rank: 4,
    name: 'Ngoc Anh',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    score: 890,
  ),
  const LeaderboardEntry(
    rank: 5,
    name: 'Quang Minh',
    avatarUrl: 'https://i.pravatar.cc/150?img=48',
    score: 860,
  ),
];

final mockQuizQuestions = <String, List<QuizQuestion>>{
  'quiz-1': <QuizQuestion>[
    const QuizQuestion(
      id: 'quiz-1-q1',
      prompt: 'Choose the closest synonym for "meticulous".',
      options: <String>['Careless', 'Thorough', 'Quick', 'Lazy'],
      correctIndex: 1,
    ),
    const QuizQuestion(
      id: 'quiz-1-q2',
      prompt: 'Which phrase best replaces "on cloud nine"?',
      options: <String>[
        'Extremely happy',
        'Very angry',
        'Totally confused',
        'Utterly bored',
      ],
      correctIndex: 0,
    ),
  ],
  'quiz-2': <QuizQuestion>[
    const QuizQuestion(
      id: 'quiz-2-q1',
      prompt: 'What is the derivative of sin(x)?',
      options: <String>['cos(x)', '-cos(x)', 'sin(x)', '-sin(x)'],
      correctIndex: 0,
    ),
    const QuizQuestion(
      id: 'quiz-2-q2',
      prompt: '∫ 2x dx equals?',
      options: <String>['x^2 + C', '2x + C', 'x + C', 'x^2/2 + C'],
      correctIndex: 0,
    ),
  ],
  'quiz-3': <QuizQuestion>[
    const QuizQuestion(
      id: 'quiz-3-q1',
      prompt: 'Unit of force is?',
      options: <String>['Joule', 'Newton', 'Pascal', 'Watt'],
      correctIndex: 1,
    ),
    const QuizQuestion(
      id: 'quiz-3-q2',
      prompt: 'Which law explains action-reaction pair?',
      options: <String>[
        'Newton’s First Law',
        'Newton’s Second Law',
        'Newton’s Third Law',
        'Law of Gravitation',
      ],
      correctIndex: 2,
    ),
  ],
};
