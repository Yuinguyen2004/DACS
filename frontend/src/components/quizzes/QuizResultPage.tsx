"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
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
import { authAPI, testAttemptAPI, userUtils } from "../../services/api"
import { TestAttempt, User } from "../../types/types"

interface QuizResultData {
  quizTitle: string;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: string;
  score: number;
}

interface QuizResultsProps {
  isPremium?: boolean
}

export default function QuizResults({ isPremium }: QuizResultsProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null)
  const [quizData, setQuizData] = useState<QuizResultData | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  const attemptId = new URLSearchParams(location.search).get('attemptId')

  useEffect(() => {
    const loadQuizResult = async () => {
      try {
        console.log('[RESULT] Loading quiz result for attempt:', attemptId)
        
        // Check authentication
        const currentUser = authAPI.getCurrentUser()
        if (!currentUser) {
          console.log('[RESULT] No authenticated user, redirecting to login')
          navigate('/')
          return
        }
        setUser(currentUser)

        if (!attemptId) {
          setError('Không tìm thấy ID kết quả quiz')
          return
        }

        // Get test attempt details
        const attempt = await testAttemptAPI.getAttemptById(attemptId)
        console.log('[RESULT] Loaded test attempt:', attempt)
        setTestAttempt(attempt)

        // Calculate completion time
        let timeSpent = "N/A"
        if (attempt.started_at && attempt.completed_at) {
          const start = new Date(attempt.started_at)
          const end = new Date(attempt.completed_at)
          const diffMs = end.getTime() - start.getTime()
          const diffMinutes = Math.floor(diffMs / 60000)
          const diffSeconds = Math.floor((diffMs % 60000) / 1000)
          timeSpent = `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`
        }

        // Get quiz title
        let quizTitle = "Quiz"
        if (typeof attempt.quiz_id === 'object' && attempt.quiz_id?.title) {
          quizTitle = attempt.quiz_id.title
        }

        setQuizData({
          quizTitle,
          totalQuestions: attempt.total_questions || 0,
          correctAnswers: attempt.correct_answers || 0,
          timeSpent,
          score: attempt.score || 0
        })

      } catch (error: any) {
        console.error('[RESULT] Error loading quiz result:', error)
        if (error.response?.status === 401) {
          navigate('/')
        } else {
          setError('Không thể tải kết quả quiz. Vui lòng thử lại sau.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadQuizResult()
  }, [attemptId, navigate])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải kết quả quiz...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !quizData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-4">{error || 'Không thể tải kết quả quiz'}</p>
          <Button onClick={() => navigate('/homepage')} variant="outline">
            Về trang chủ
          </Button>
        </div>
      </div>
    )
  }

  const scorePercentage = (quizData.correctAnswers / quizData.totalQuestions) * 100
  const incorrectAnswers = quizData.totalQuestions - quizData.correctAnswers
  const isPremiumUser = userUtils.hasPremiumAccess(user)

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
            {isPremiumUser && (
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
              You completed "{quizData.quizTitle}"
            </CardDescription>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {quizData.correctAnswers}/{quizData.totalQuestions}
                </div>
                <div>Điểm tổng</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{Math.round(scorePercentage)}%</div>
                <div>Độ chính xác</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{quizData.timeSpent}</div>
                <div>Thời gian làm bài</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={scorePercentage} className="h-3 mb-6" />
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                onClick={() => navigate("/homepage")}
                variant="outline"
                className="flex items-center justify-center space-x-2 h-12 px-6 border-gray-300 bg-white hover:bg-gray-50"
              >
                <Home className="w-4 h-4" />
                <span>Về trang chủ</span>
              </Button>
              <Button 
                onClick={() => {
                  if (testAttempt && typeof testAttempt.quiz_id === 'object' && testAttempt.quiz_id?._id) {
                    navigate(`/test?quizId=${testAttempt.quiz_id._id}`)
                  } else if (testAttempt && typeof testAttempt.quiz_id === 'string') {
                    navigate(`/test?quizId=${testAttempt.quiz_id}`)
                  } else {
                    navigate('/homepage')
                  }
                }}
                className="flex items-center justify-center space-x-2 h-12 px-6 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thử lại bài kiểm tra</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Premium Content - Detailed Question Review */}
        {isPremiumUser ? (
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
            <CardContent className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Detailed Review Coming Soon!</h3>
              <p className="text-gray-600">
                Question-by-question analysis and explanations will be available soon for Premium users.
              </p>
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
