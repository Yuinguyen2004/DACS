"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Clock, BookOpen, Check, Loader2, AlertCircle, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"  // ✅ Thêm useSearchParams
import { quizAPI, testAttemptAPI } from "../../services/api"
import type { QuizWithDetails, QuestionWithAnswers, TestAttempt, TestAttemptAnswer } from "../../types/types"

// Interface cho quiz question hỗ trợ hình ảnh
interface QuizQuestion {
  _id: string
  content: string
  image?: string
  answers: {
    _id: string
    content: string
    is_correct: boolean
  }[]
}

interface QuizData {
  _id: string
  title: string
  type: "basic" | "image"
  time_limit?: number
  questions: QuizQuestion[]
}

// Mock data - chỉ load khi có type param hoặc dev mode
const getMockQuiz = (quizType: "basic" | "image"): QuizData => {
  console.log("🧪 Creating mock quiz for type:", quizType)
  
  const basicQuestions: QuizQuestion[] = [
    {
      _id: "q1",
      content: "Thủ đô của Pháp là gì?",
      answers: [
        { _id: "a1", content: "Paris", is_correct: true },
        { _id: "a2", content: "London", is_correct: false },
        { _id: "a3", content: "Berlin", is_correct: false },
        { _id: "a4", content: "Madrid", is_correct: false },
      ],
    },
    {
      _id: "q2", 
      content: "Lập trình ngôn ngữ nào phổ biến nhất hiện nay?",
      answers: [
        { _id: "a5", content: "Python", is_correct: true },
        { _id: "a6", content: "Java", is_correct: false },
        { _id: "a7", content: "C++", is_correct: false },
        { _id: "a8", content: "Ruby", is_correct: false },
      ],
    }
  ]

  const imageQuestions: QuizQuestion[] = [
    {
      _id: "q1",
      content: "Thủ đô của Pháp là gì?",
      answers: [
        { _id: "a1", content: "Paris", is_correct: true },
        { _id: "a2", content: "London", is_correct: false },
        { _id: "a3", content: "Berlin", is_correct: false },
        { _id: "a4", content: "Madrid", is_correct: false },
      ],
    },
    {
      _id: "q2",
      content: "Nhìn vào hình ảnh và trả lời: Đây là loài chim gì?",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=300&fit=crop",
      answers: [
        { _id: "a5", content: "Chim bồ câu", is_correct: true },
        { _id: "a6", content: "Chim quạ", is_correct: false },
        { _id: "a7", content: "Chim chích", is_correct: false },
        { _id: "a8", content: "Chim én", is_correct: false },
      ],
    },
    {
      _id: "q3",
      content: "Xác định địa danh nổi tiếng từ hình ảnh:",
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&h=300&fit=crop",
      answers: [
        { _id: "a9", content: "Big Ben, London", is_correct: true },
        { _id: "a10", content: "Eiffel Tower, Paris", is_correct: false },
        { _id: "a11", content: "Colosseum, Rome", is_correct: false },
        { _id: "a12", content: "Sagrada Familia, Barcelona", is_correct: false },
      ],
    }
  ]

  return {
    _id: `mock-${quizType}-${Date.now()}`,
    title: quizType === "image" ? "Quiz Hình Ảnh - Test Mock Data" : "Quiz Cơ Bản - Test Mock Data", 
    type: quizType,
    time_limit: 10, // 10 phút
    questions: quizType === "image" ? imageQuestions : basicQuestions,
  }
}

export default function QuizTakingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()  // ✅ Cách đúng để đọc query params
  
  // ✅ Đọc params từ useSearchParams
  const quizId = searchParams.get("quizId")
  const quizType = (searchParams.get("type") as "basic" | "image") || "basic"
  
  // Debug logs chi tiết
  console.log("🔍 === QUIZ TAKING PAGE DEBUG ===")
  console.log("📍 Full URL:", window.location.href)
  console.log("📋 SearchParams object:", Object.fromEntries(searchParams))
  console.log("🎯 Quiz ID:", quizId)
  console.log("📱 Quiz Type:", quizType)
  console.log("🔧 Location search (raw):", location.search)
  console.log("💻 Dev mode:", import.meta.env.DEV)
  console.log("🚀 Will use mock:", !quizId || searchParams.has("type"))
  console.log("===============================")

  // State
  const [quiz, setQuiz] = useState<QuizWithDetails | null>(null)
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: string }>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const hasStartedAttemptRef = useRef(false)

  // Navigation blocking
  useEffect(() => {
    if (!testAttempt || isCompleted) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "Bạn có chắc muốn rời khỏi trang? Bài kiểm tra sẽ bị hủy."
      return e.returnValue
    }

    const handlePopState = () => {
      if (testAttempt?._id) {
        testAttemptAPI.abandonAttempt(testAttempt._id).catch(console.error)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
      if (testAttempt?._id && !isCompleted) {
        testAttemptAPI.abandonAttempt(testAttempt._id).catch(console.error)
      }
    }
  }, [testAttempt, isCompleted])

  // Initialize quiz - LOGIC MỚI với useSearchParams
  useEffect(() => {
    const initializeQuiz = async () => {
      console.log("🚀 Starting quiz initialization...")
      
      // ✅ Điều kiện mock data: có type param HOẶC dev mode VÀ không có quizId
      const hasTypeParam = searchParams.has("type")
      const isDevMode = import.meta.env.DEV
      const useMockData = hasTypeParam || (isDevMode && !quizId)
      
      console.log("📊 Init conditions:")
      console.log("   - Has type param:", hasTypeParam)
      console.log("   - Dev mode:", isDevMode)
      console.log("   - Has quizId:", !!quizId)
      console.log("   - Use mock data:", useMockData)

      // ✅ MOCK DATA MODE - ưu tiên nhất
      if (useMockData && !hasStartedAttemptRef.current) {
        console.log("🎉 === MOCK MODE ACTIVATED ===")
        console.log("📱 Using quiz type:", quizType)
        
        hasStartedAttemptRef.current = true
        setIsLoading(true)

        try {
          const mockQuiz = getMockQuiz(quizType)
          console.log("✅ Mock quiz created:", mockQuiz.questions.length, "questions")
          
          setQuiz(mockQuiz as unknown as QuizWithDetails)
          setQuestions(mockQuiz.questions as unknown as QuestionWithAnswers[])

          if (mockQuiz.time_limit) {
            const seconds = mockQuiz.time_limit * 60
            setTimeLeft(seconds)
            console.log("⏱️ Mock timer set:", seconds, "seconds")
          }

          setIsLoading(false)
          console.log("🎉 Mock quiz loaded successfully!")
          return
        } catch (error) {
          console.error("❌ Mock data failed:", error)
          setError("Không thể tạo dữ liệu mock. Kiểm tra console.")
          setIsLoading(false)
          return
        }
      }

      // ❌ NO QUIZ ID VÀ KHÔNG MOCK MODE
      if (!quizId && !useMockData) {
        console.log("❌ No quiz ID and no mock mode")
        setError(
          `Quiz ID không được cung cấp.\n\n` +
          `💡 Để test mock data, dùng URL:\n` +
          `• Basic: /quizzes/taking?type=basic\n` +
          `• Image: /quizzes/taking?type=image\n\n` +
          `📍 URL hiện tại: ${window.location.pathname}${window.location.search}`
        )
        setIsLoading(false)
        return
      }

      // 🔄 REAL API MODE - chỉ khi có quizId và không mock
      console.log("🌐 Loading real quiz from API...")
      if (hasStartedAttemptRef.current) {
        console.log("⏸️ Already initialized, skipping")
        return
      }

      hasStartedAttemptRef.current = true
      setIsLoading(true)

      try {
        const quizData = await quizAPI.getQuizById(quizId!)
        console.log("📚 Real quiz loaded:", quizData.title)
        setQuiz(quizData)

        const startResponse = await testAttemptAPI.startTestAttempt({
          quiz_id: quizId!,
          total_questions: 0,
        })

        console.log("🏁 Real test attempt started:", startResponse.attempt_id)

        if (startResponse.questions) {
          setQuestions(startResponse.questions)
        }

        const testAttempt: TestAttempt = {
          _id: startResponse.attempt_id,
          quiz_id: quizId!,
          user_id: "",
          started_at: startResponse.started_at,
          status: "in_progress",
          total_questions: startResponse.total_questions,
          answers: [],
          score: 0,
          completed_at: null,
          time_taken: null,
        }

        setTestAttempt(testAttempt)

        if (startResponse.quiz?.time_limit) {
          const timeInSeconds = startResponse.quiz.time_limit * 60
          setTimeLeft(timeInSeconds)
        }

        setIsLoading(false)
      } catch (error: any) {
        console.error("❌ API error:", error)
        hasStartedAttemptRef.current = false
        
        if (error.response?.status === 404) {
          setError("Quiz không tồn tại")
        } else if (error.response?.status === 401) {
          setError("Bạn cần đăng nhập")
          navigate("/")
        } else {
          setError(`Lỗi tải quiz: ${error.message}\n💡 Thử test mock: /quizzes/taking?type=image`)
        }
        setIsLoading(false)
      }
    }

    initializeQuiz()
  }, [quizId, quizType, navigate, searchParams])  // ✅ Thêm searchParams vào dependency

  // Timer logic (giữ nguyên)
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitting) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeLeft, isSubmitting])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerChange = (answerId: string) => {
    const currentQuestion = questions[currentQuestionIndex]
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: answerId,
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true)
    
    // // Mock submission cho dev/testing
    // if (import.meta.env.DEV || searchParams.has("type")) {
    //   const mockScore = Math.floor(Math.random() * (questions.length * 10)) + 1
    //   console.log("🎉 Mock submission - Score:", mockScore, "/", questions.length * 10)
      
    //   setTimeout(() => {
    //     navigate(`/result?attemptId=mock-${Date.now()}&score=${mockScore}&total=${questions.length * 10}`)
    //     setIsCompleted(true)
    //     setIsSubmitting(false)
    //   }, 1500)
    //   return
    // }

    // Real API submission (giữ nguyên logic cũ)
    try {
      if (!testAttempt) throw new Error("No test attempt")
      
      const answers: TestAttemptAnswer[] = Object.entries(selectedAnswers).map(([questionId, answerId]) => {
        const question = questions.find(q => q._id === questionId)
        const answer = question?.answers.find(a => a._id === answerId)
        return {
          question_id: questionId,
          selected_answer_id: answerId,
          is_correct: answer?.is_correct || false,
        }
      })

      const result = await testAttemptAPI.submitTestAttempt(testAttempt._id, { answers })
      setIsCompleted(true)
      navigate(`/result?attemptId=${result.attempt_id}`)
    } catch (error) {
      console.error("Submission failed:", error)
      setError("Không thể nộp bài")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAnsweredCount = () => Object.keys(selectedAnswers).length
  const getProgressPercentage = () => 
    questions.length > 0 ? (getAnsweredCount() / questions.length) * 100 : 0

  // Loading state với debug info
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-lg font-semibold mb-2">Đang tải quiz...</h2>
          <p className="text-gray-600 mb-4">Kiểm tra console để xem debug info</p>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded mb-4">
            <p><strong>Current params:</strong></p>
            <p>Quiz ID: {quizId || "none"}</p>
            <p>Type: {quizType}</p>
            <p>Mock mode: {(!quizId || searchParams.has("type")) ? "YES" : "NO"}</p>
          </div>
        </Card>
      </div>
    )
  }

  // Error state với hướng dẫn chi tiết
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 text-center">Lỗi tải quiz</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="bg-red-50 p-4 rounded text-sm overflow-auto">
              {error}
            </pre>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Test Mock Data:</h3>
                <Button 
                  onClick={() => navigate("/quizzes/taking?type=basic")} 
                  variant="outline" 
                  className="w-full mb-2"
                >
                  📝 Basic Quiz
                </Button>
                <Button 
                  onClick={() => navigate("/quizzes/taking?type=image")} 
                  className="w-full"
                >
                  📸 Image Quiz
                </Button>
              </div>
              <div className="text-sm text-gray-600">
                <h3 className="font-medium mb-2">Debug Info:</h3>
                <p>Current URL: <code>{window.location.href}</code></p>
                <p>Quiz ID: <code>{quizId || "missing"}</code></p>
                <p>Type param: <code>{searchParams.get("type") || "missing"}</code></p>
                <p>Dev mode: <code>{import.meta.env.DEV ? "yes" : "no"}</code></p>
              </div>
            </div>
            <Button onClick={() => navigate("/homepage")} className="w-full">
              Về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No data state
  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Không có dữ liệu quiz</h2>
          <p className="text-gray-600 mb-4">Thử test với mock data</p>
          <div className="space-y-2">
            <Button onClick={() => navigate("/quizzes/taking?type=basic")}>
              Test Basic Quiz
            </Button>
            <Button onClick={() => navigate("/quizzes/taking?type=image")}>
              Test Image Quiz
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex] as unknown as QuizQuestion

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                quizType === "image" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
              }`}>
                {quizType === "image" ? "📸 Hình ảnh" : "📝 Cơ bản"}
              </span>
              {searchParams.has("type") && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                  MOCK MODE
                </span>
              )}
            </div>
            {timeLeft > 0 && (
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-lg font-mono font-semibold">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                {getAnsweredCount()}/{questions.length} câu trả lời
              </span>
              <span className="text-sm text-gray-500">{Math.round(getProgressPercentage())}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Câu {currentQuestionIndex + 1}/{questions.length}
              </CardTitle>
              {selectedAnswers[currentQuestion?._id] && <Check className="w-5 h-5 text-green-500" />}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Image nếu có */}
            {currentQuestion.image && (
              <div className="text-center">
                <img
                  src={currentQuestion.image}
                  alt="Câu hỏi hình ảnh"
                  className="max-w-full h-auto rounded-lg object-cover max-h-64 mx-auto shadow-md"
                  onError={(e) => {
                    console.error("Image failed:", currentQuestion.image)
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
            )}

            {/* Nội dung câu hỏi */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {currentQuestion.content}
              </h3>
            </div>

            {/* Đáp án */}
            <RadioGroup
              value={selectedAnswers[currentQuestion?._id] || ""}
              onValueChange={handleAnswerChange}
              className="space-y-3"
            >
              {currentQuestion.answers.map((answer, index) => (
                <div
                  key={answer._id}
                  className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    selectedAnswers[currentQuestion._id] === answer._id
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <RadioGroupItem value={answer._id} id={answer._id} className="mt-1" />
                  <Label htmlFor={answer._id} className="flex-1 cursor-pointer">
                    <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                    {answer.content}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Câu trước
          </Button>

          <div className="flex space-x-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? "bg-blue-600 text-white"
                    : selectedAnswers[questions[index]._id]
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting || getAnsweredCount() === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Nộp bài...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Nộp bài ({getAnsweredCount()}/{questions.length})
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} variant="outline">
              Câu tiếp
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Nộp sớm nếu chưa hết */}
        {getAnsweredCount() > 0 && currentQuestionIndex !== questions.length - 1 && (
          <div className="text-center">
            <Button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              variant="outline"
              className="text-green-600 border-green-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Nộp ngay ({getAnsweredCount()}/{questions.length})
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
