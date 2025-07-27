"use client"
import {
  Trophy,
  Home,
  RotateCcw,
  CheckCircle,
  XCircle,
  Crown,
  Star,
  BookOpen,
  Target,
  TrendingUp,
  Lock,
  Eye,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

// Mock quiz results data
const quizResults = {
  quizTitle: "JavaScript Fundamentals",
  totalQuestions: 10,
  correctAnswers: 8,
  timeSpent: "18:45",
  questions: [
    {
      id: 1,
      question: "What is the correct way to declare a variable in JavaScript?",
      options: ["var myVariable = 5;", "variable myVariable = 5;", "v myVariable = 5;", "declare myVariable = 5;"],
      userAnswer: "var myVariable = 5;",
      correctAnswer: "var myVariable = 5;",
      isCorrect: true,
      explanation:
        "The 'var' keyword is the traditional way to declare variables in JavaScript, though 'let' and 'const' are now preferred in modern JavaScript.",
    },
    {
      id: 2,
      question: "Which of the following is NOT a JavaScript data type?",
      options: ["String", "Boolean", "Float", "Number"],
      userAnswer: "Boolean",
      correctAnswer: "Float",
      isCorrect: false,
      explanation:
        "JavaScript doesn't have a specific 'Float' data type. All numbers in JavaScript are of type 'Number', which can represent both integers and floating-point numbers.",
    },
    {
      id: 3,
      question: "What does the '===' operator do in JavaScript?",
      options: [
        "Assigns a value to a variable",
        "Compares values only",
        "Compares both value and type",
        "Performs mathematical addition",
      ],
      userAnswer: "Compares both value and type",
      correctAnswer: "Compares both value and type",
      isCorrect: true,
      explanation:
        "The '===' operator performs strict equality comparison, checking both the value and the data type of the operands.",
    },
    {
      id: 4,
      question: "How do you create a function in JavaScript?",
      options: [
        "function myFunction() {}",
        "create myFunction() {}",
        "def myFunction() {}",
        "function = myFunction() {}",
      ],
      userAnswer: "create myFunction() {}",
      correctAnswer: "function myFunction() {}",
      isCorrect: false,
      explanation:
        "Functions in JavaScript are declared using the 'function' keyword followed by the function name and parentheses.",
    },
    {
      id: 5,
      question: "What is the correct way to write a JavaScript array?",
      options: [
        "var colors = 'red', 'green', 'blue'",
        "var colors = (1:'red', 2:'green', 3:'blue')",
        "var colors = ['red', 'green', 'blue']",
        "var colors = 1 = ('red'), 2 = ('green'), 3 = ('blue')",
      ],
      userAnswer: "var colors = ['red', 'green', 'blue']",
      correctAnswer: "var colors = ['red', 'green', 'blue']",
      isCorrect: true,
      explanation: "JavaScript arrays are created using square brackets [] with elements separated by commas.",
    },
  ],
}

interface QuizResultsProps {
  isPremium?: boolean
}

export default function QuizResults({ isPremium = false }: QuizResultsProps) {
  const scorePercentage = (quizResults.correctAnswers / quizResults.totalQuestions) * 100
  const incorrectAnswers = quizResults.totalQuestions - quizResults.correctAnswers

  const getScoreMessage = () => {
    if (scorePercentage >= 90) return { message: "Rất tuyệt vời!", icon: Trophy, color: "text-yellow-600" }
    if (scorePercentage >= 80) return { message: "Rất tốt!", icon: Star, color: "text-green-600" }
    if (scorePercentage >= 70) return { message: "Cố gắng tốt!", icon: Target, color: "text-blue-600" }
    return { message: "Tiếp tục luyện tập!", icon: TrendingUp, color: "text-orange-600" }
  }

  const scoreMessage = getScoreMessage()
  const ScoreIcon = scoreMessage.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Quiz Results</h1>
            </div>
            {isPremium && (
              <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Summary */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-br from-orange-50 to-pink-50">
          <CardHeader className="text-center pb-6">
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                scorePercentage >= 80 ? "bg-green-100" : scorePercentage >= 60 ? "bg-yellow-100" : "bg-orange-100"
              }`}
            >
              <ScoreIcon className={`w-8 h-8 ${scoreMessage.color}`} />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">{scoreMessage.message}</CardTitle>
            <CardDescription className="text-lg text-gray-600 mb-4">
              You completed "{quizResults.quizTitle}"
            </CardDescription>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {quizResults.correctAnswers}/{quizResults.totalQuestions}
                </div>
                <div>Điểm tổng</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{Math.round(scorePercentage)}%</div>
                <div>Độ chính xác</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{quizResults.timeSpent}</div>
                <div>Thời gian làm bài</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={scorePercentage} className="h-3 mb-6" />
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="flex items-center justify-center space-x-2 h-12 px-6 border-gray-300 bg-white hover:bg-gray-50"
              >
                <Home className="w-4 h-4" />
                <span>Về trang chủ</span>
              </Button>
              <Button className="flex items-center justify-center space-x-2 h-12 px-6 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white">
                <RotateCcw className="w-4 h-4" />
                <span>Thử lại bài kiểm tra</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Premium Content - Detailed Question Review */}
        {isPremium ? (
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Detailed Question Review</CardTitle>
                  <CardDescription>Review your answers and learn from detailed explanations</CardDescription>
                </div>
                <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium Feature
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {quizResults.questions.map((question, index) => (
                <div key={question.id} className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        question.isCorrect ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {question.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-3">
                        {index + 1}. {question.question}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            Your Answer
                          </Badge>
                          <span
                            className={`text-sm font-medium ${question.isCorrect ? "text-green-700" : "text-red-700"}`}
                          >
                            {question.userAnswer}
                          </span>
                        </div>

                        {!question.isCorrect && (
                          <div className="flex items-center space-x-2">
                            <Badge className="text-xs bg-green-100 text-green-800">Correct Answer</Badge>
                            <span className="text-sm font-medium text-green-700">{question.correctAnswer}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                            <p className="text-sm text-blue-800">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {index < quizResults.questions.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          /* Free User Content - Limited View */
          <>
            {/* Limited Results Message */}
            <Card className="mb-6 border-2 border-dashed border-gray-300 bg-gray-50">
              <CardContent className="text-center py-12">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Chi tiết kết quả đã bị khóa</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Bạn có thể xem điểm tổng của mình ở trên, nhưng phân tích chi tiết từng câu hỏi và giải thích chỉ có sẵn
                  với gói Premium.
                </p>
                <Badge variant="outline" className="text-gray-600">
                  Free Plan
                </Badge>
              </CardContent>
            </Card>

            {/* Premium Upgrade CTA */}
            <Card className="border-2 border-gradient-to-r from-orange-200 to-pink-200 bg-gradient-to-br from-orange-50 to-pink-50">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Khám phá tiềm năng của bạn</CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Nâng cấp lên Premium để nhận phân tích chi tiết cho từng câu hỏi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Zap className="w-5 h-5 text-orange-500 mr-2" />
                      Bạn sẽ nhận được:
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Giải thích chi tiết đáp án cho mọi câu hỏi</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Xem chính xác câu nào sai và lý do vì sao</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Mẹo học tập và các phương pháp tốt nhất</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Star className="w-5 h-5 text-orange-500 mr-2" />
                      Quyền lợi Premium:
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Làm bài kiểm tra không giới hạn</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Theo dõi tiến trình nâng cao</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Hỗ trợ khách hàng ưu tiên</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button className="w-full sm:w-auto h-14 px-8 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-semibold text-lg">
                    <Crown className="w-5 h-5 mr-2" />
                    Nâng cấp lên Premium - $9.99/tháng
                  </Button>
                  <p className="text-xs text-gray-500 mt-3">Hủy bất cứ lúc nào • Dùng thử miễn phí 7 ngày</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
