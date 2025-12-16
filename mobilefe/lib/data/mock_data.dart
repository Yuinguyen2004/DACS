import 'package:mobilefe/models/activity_model.dart';
import 'package:mobilefe/models/category_model.dart';
import 'package:mobilefe/models/leaderboard_entry.dart';
import 'package:mobilefe/models/quiz_model.dart';
import 'package:mobilefe/models/quiz_question_model.dart';
import 'package:mobilefe/models/user_model.dart';

const userFree = UserModel(
  id: 'user-free',
  name: 'Linh Nguyen',
  email: 'linh.nguyen@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?img=32',
  level: 'Pro Learner',
  points: 3200,
  quizzesTaken: 18,
  averageScore: 78.5,
  isPremium: false,
);

const userPremium = UserModel(
  id: 'user-premium',
  name: 'Khoa Tran',
  email: 'khoa.tran@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?img=28',
  level: 'Elite Scholar',
  points: 6400,
  quizzesTaken: 54,
  averageScore: 90.2,
  isPremium: true,
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
    isPremiumContent: false,
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
    isPremiumContent: true,
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
    isPremiumContent: false,
  ),
  const QuizModel(
    id: 'quiz-4',
    title: 'Creative Writing Studio',
    author: 'Coach Linh',
    category: 'Language Arts',
    difficulty: QuizDifficulty.beginner,
    questionCount: 15,
    durationMinutes: 12,
    thumbnail:
        'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=60',
    description: 'Warm-up prompts to inspire descriptive and narrative writing.',
    isPremiumContent: false,
  ),
  const QuizModel(
    id: 'quiz-5',
    title: 'Data Science Crash Course',
    author: 'Prof. Minh',
    category: 'Technology',
    difficulty: QuizDifficulty.advanced,
    questionCount: 18,
    durationMinutes: 22,
    thumbnail:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=60',
    description:
        'Assess your knowledge on statistics, Python tooling, and ML workflows.',
    isPremiumContent: true,
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

final quizHistory = <ActivityModel>[
  ActivityModel(
    id: 'history-1',
    quizTitle: 'IELTS Vocabulary Sprint',
    score: 84,
    completedOn: DateTime.now().subtract(const Duration(days: 1)),
    status: ActivityStatus.completed,
  ),
  ActivityModel(
    id: 'history-2',
    quizTitle: 'Calculus Fundamentals',
    score: 62,
    completedOn: DateTime.now().subtract(const Duration(days: 2)),
    status: ActivityStatus.completed,
  ),
  ActivityModel(
    id: 'history-3',
    quizTitle: 'Physics Marathon',
    score: 91,
    completedOn: DateTime.now().subtract(const Duration(days: 4)),
    status: ActivityStatus.completed,
  ),
  ActivityModel(
    id: 'history-4',
    quizTitle: 'World History Challenge',
    score: 73,
    completedOn: DateTime.now().subtract(const Duration(days: 7)),
    status: ActivityStatus.completed,
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
      answerIds: const [],
      options:['Careless', 'Thorough', 'Quick', 'Lazy'],
      correctIndex: 1,
    ),
    const QuizQuestion(
      id: 'quiz-1-q2',
      prompt: 'Which phrase best replaces "on cloud nine"?',
      answerIds: const [],
      options:[
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
      answerIds: const [],
      options:['cos(x)', '-cos(x)', 'sin(x)', '-sin(x)'],
      correctIndex: 0,
    ),
    const QuizQuestion(
      id: 'quiz-2-q2',
      prompt: '∫ 2x dx equals?',
      answerIds: const [],
      options:['x^2 + C', '2x + C', 'x + C', 'x^2/2 + C'],
      correctIndex: 0,
    ),
  ],
  'quiz-3': <QuizQuestion>[
    const QuizQuestion(
      id: 'quiz-3-q1',
      prompt: 'Unit of force is?',
      answerIds: const [],
      options:['Joule', 'Newton', 'Pascal', 'Watt'],
      correctIndex: 1,
    ),
    const QuizQuestion(
      id: 'quiz-3-q2',
      prompt: 'Which law explains action-reaction pair?',
      answerIds: const [],
      options:[
        'Newton’s First Law',
        'Newton’s Second Law',
        'Newton’s Third Law',
        'Law of Gravitation',
      ],
      correctIndex: 2,
    ),
  ],
  'quiz-4': <QuizQuestion>[
    const QuizQuestion(
      id: 'quiz-4-q1',
      prompt: 'Which narrative perspective uses "I" when telling the story?',
      answerIds: const [],
      options:['First person', 'Second person', 'Third person', 'Omniscient'],
      correctIndex: 0,
    ),
    const QuizQuestion(
      id: 'quiz-4-q2',
      prompt: 'What is the main purpose of a sensory detail?',
      answerIds: const [],
      options:[
        'Explain plot twists',
        'Appeal to reader senses',
        'Summarize a chapter',
        'Provide dialogue',
      ],
      correctIndex: 1,
    ),
  ],
  'quiz-5': <QuizQuestion>[
    const QuizQuestion(
      id: 'quiz-5-q1',
      prompt: 'Which library is most associated with data manipulation in Python?',
      answerIds: const [],
      options:['NumPy', 'Pandas', 'Matplotlib', 'Seaborn'],
      correctIndex: 1,
    ),
    const QuizQuestion(
      id: 'quiz-5-q2',
      prompt: 'Cross-validation helps primarily with what?',
      answerIds: const [],
      options:[
        'Speeding up training',
        'Estimating model performance',
        'Improving visualization',
        'Reducing dataset size',
      ],
      correctIndex: 1,
    ),
  ],
};
