"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Clock, BookOpen, Check, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useNavigate, useLocation } from "react-router-dom"
import { quizAPI, testAttemptAPI } from "../../services/api"
import { QuizWithDetails, QuestionWithAnswers, TestAttempt, TestAttemptAnswer } from "../../types/types"

export default function QuizTakingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const quizId = new URLSearchParams(location.search).get('quizId')
  
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
  
  // Resume quiz feature state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [clientSeqMap, setClientSeqMap] = useState<Record<string, number>>({})
  const [pendingAnswers, setPendingAnswers] = useState<Set<string>>(new Set())
  const [resumedFromStorage, setResumedFromStorage] = useState(false)
  
  // Refs for timers
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Heartbeat effect - sync time and status every 15 seconds
  useEffect(() => {
    if (!testAttempt?._id || isCompleted || isSubmitting) return
    
    const heartbeat = async () => {
      try {
        const response = await testAttemptAPI.heartbeat(testAttempt._id)
        
        // Sync time from server (server is authoritative)
        if (response.remainingSeconds !== null) {
          setTimeLeft(response.remainingSeconds)
        }
        
        // Check if attempt was completed elsewhere
        if (response.status !== 'in_progress') {
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current)
          }
        }
      } catch (error) {
        console.error('❌ Heartbeat failed:', error)
      }
    }
    
    // Run heartbeat every 15 seconds
    heartbeatIntervalRef.current = setInterval(heartbeat, 15000)
    
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [testAttempt, isCompleted, isSubmitting])

  // Alternative navigation blocking using beforeunload and popstate events
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (testAttempt && !isSubmitting && !isCompleted) {
        // Flush pending saves
        if (pendingAnswers.size > 0) {
          flushPendingAnswers()
        }
        
        // Don't abandon - now with resume feature, they can come back
        // Just show warning
        e.preventDefault()
        e.returnValue = 'Bài kiểm tra của bạn sẽ được lưu tự động. Bạn có thể quay lại sau.'
        return 'Bài kiểm tra của bạn sẽ được lưu tự động. Bạn có thể quay lại sau.'
      }
    }

    const handlePopState = () => {
      if (testAttempt && !isSubmitting && !isCompleted && pendingAnswers.size > 0) {
        // Flush pending saves
        flushPendingAnswers()
      }
    }

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
      
      // Flush any pending saves on unmount
      if (testAttempt && !isSubmitting && !isCompleted && pendingAnswers.size > 0) {
        flushPendingAnswers()
      }
    }
  }, [testAttempt, isSubmitting, isCompleted, pendingAnswers])

  // Flush pending answers before unmount or navigation
  const flushPendingAnswers = async () => {
    if (pendingAnswers.size === 0 || !testAttempt) return
    
    setSaveStatus('saving')
    
    try {
      const answersToSave = Array.from(pendingAnswers).map(questionId => ({
        question_id: questionId,
        selected_answer_id: selectedAnswers[questionId],
        client_seq: clientSeqMap[questionId] || 1
      }))
      
      await testAttemptAPI.saveAnswers(testAttempt._id, answersToSave)
      
      setPendingAnswers(new Set())
      setSaveStatus('saved')
      
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('❌ Failed to save answers:', error)
      setSaveStatus('error')
    }
  }

  // Try to resume existing attempt
  const attemptToResume = async (): Promise<boolean> => {
    if (!quizId) return false
    
    const storedAttempt = localStorage.getItem(`quiz_attempt_${quizId}`)
    
    if (storedAttempt) {
      try {
        const { attemptId, resumeToken: token } = JSON.parse(storedAttempt)
        console.log('🔄 Found stored attempt, trying to resume:', attemptId)
        
        let resumeData
        try {
          resumeData = await testAttemptAPI.getActiveAttempt(quizId)
          console.log('✅ Resumed via getActiveAttempt')
        } catch {
          resumeData = await testAttemptAPI.resume(token)
          console.log('✅ Resumed via resume token')
        }
        
        // Restore state
        setTestAttempt({
          _id: resumeData.attempt_id,
          quiz_id: quizId,
          user_id: '',
          started_at: resumeData.started_at,
          status: 'in_progress',
          total_questions: resumeData.total_questions,
          answers: [],
          score: 0,
          completed_at: undefined,
          time_taken: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        } as TestAttempt)
        
        setQuiz(resumeData.quiz)
        setQuestions(resumeData.questions)
        // Restore answers from draft_answers
        const restoredAnswers: Record<string, string> = {}
        const restoredSeq: Record<string, number> = {}
        
        resumeData.draft_answers?.forEach((draft: any) => {
          restoredAnswers[draft.question_id] = draft.selected_answer_id
          restoredSeq[draft.question_id] = draft.client_seq
        })
        
        setSelectedAnswers(restoredAnswers)
        setClientSeqMap(restoredSeq)
        
        // Set time from server (server-authoritative)
        if (resumeData.remainingSeconds !== null) {
          setTimeLeft(resumeData.remainingSeconds)
          console.log('⏱️ Time remaining from server:', resumeData.remainingSeconds, 'seconds')
        }

        setIsLoading(false)
        setResumedFromStorage(true)
        return true
      } catch (error) {
        console.error('❌ Failed to resume:', error)
        localStorage.removeItem(`quiz_attempt_${quizId}`)
      }
    }
    
    return false
  }

  // Initialize quiz and start test attempt (or resume)
  useEffect(() => {
    const initializeQuiz = async () => {
      if (!quizId) {
        console.log('❌ No quiz ID provided')
        setError("Quiz ID không được cung cấp")
        setIsLoading(false)
        return
      }

      // Prevent duplicate initialization
      if (hasStartedAttemptRef.current) {
        console.log('⏸️ Quiz already initialized, skipping')
        return
      }

      // Set flag immediately to prevent race condition
      hasStartedAttemptRef.current = true

      try {
        console.log('🚀 Initializing quiz:', quizId)
        setIsLoading(true)
        setResumedFromStorage(false)

        // Try to resume first
        const resumed = await attemptToResume()
        if (resumed) {
          console.log('✅ Successfully resumed existing attempt')
          return
        }

        // Start new attempt
        console.log('📚 Fetching quiz details...')
        const quizData = await quizAPI.getQuizById(quizId)
        console.log('✅ Quiz loaded:', quizData.title)
        setQuiz(quizData)

        console.log('🏁 Starting new test attempt...')
        const startResponse: any = await testAttemptAPI.startTestAttempt({
          quiz_id: quizId,
          total_questions: 0
        })
        console.log('✅ Test attempt started:', startResponse.attempt_id)
        
        // Update quiz and questions from start response
        if (startResponse.quiz) {
          setQuiz({
            ...quizData,
            time_limit: startResponse.quiz.time_limit
          } as QuizWithDetails)
        }
        
        if (startResponse.questions) {
          console.log('✅ Questions from start response:', startResponse.questions.length, 'questions')
          setQuestions(startResponse.questions)
        }
        
        // Create test attempt object for state
        const testAttempt = {
          _id: startResponse.attempt_id,
          quiz_id: quizId,
          user_id: '',
          started_at: startResponse.started_at,
          status: 'in_progress',
          total_questions: startResponse.total_questions,
          answers: [],
          score: 0,
          completed_at: undefined,
          time_taken: undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        } as TestAttempt

        setTestAttempt(testAttempt)
        // Persist to localStorage
        localStorage.setItem(`quiz_attempt_${quizId}`, JSON.stringify({
          attemptId: startResponse.attempt_id,
          resumeToken: startResponse.resume_token,
          quizId: quizId,
          startedAt: startResponse.started_at
        }))
        console.log('💾 Attempt persisted to localStorage')

        // Set timer from server (server-authoritative)
        if (startResponse.remainingSeconds !== null) {
          setTimeLeft(startResponse.remainingSeconds)
          console.log('⏱️ Timer set from server:', startResponse.remainingSeconds, 'seconds')
        } else if (startResponse.quiz?.time_limit) {
          const timeInSeconds = startResponse.quiz.time_limit * 60
          console.log('⏱️ Setting timer to', startResponse.quiz.time_limit, 'minutes')
          setTimeLeft(timeInSeconds)
        }

      } catch (error: any) {
        console.error('❌ Failed to initialize quiz:', error)
        hasStartedAttemptRef.current = false
        if (error.response?.status === 404) {
          setError("Quiz không tồn tại")
        } else if (error.response?.status === 401) {
          setError("Bạn cần đăng nhập để làm quiz")
          navigate('/')
        } else {
          setError("Không thể tải quiz. Vui lòng thử lại sau.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    initializeQuiz()
  }, [quizId, navigate])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitting) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            console.log('⏰ Time up! Auto-submitting quiz')
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
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (answerId: string) => {
    const currentQuestion = questions[currentQuestionIndex]
    console.log('📝 Answer selected:', { questionId: currentQuestion._id, answerId })
    
    // Update local state
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion._id]: answerId
    }))
    
    // Track pending save
    setPendingAnswers(prev => new Set(prev).add(currentQuestion._id))
    
    // Increment client sequence
    setClientSeqMap(prev => ({
      ...prev,
      [currentQuestion._id]: (prev[currentQuestion._id] || 0) + 1
    }))
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Schedule save after 500ms of inactivity (debounce)
    saveTimeoutRef.current = setTimeout(() => {
      flushPendingAnswers()
    }, 500)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      console.log('➡️ Moved to question:', currentQuestionIndex + 2)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      console.log('⬅️ Moved to question:', currentQuestionIndex)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!testAttempt) {
      console.log('❌ No test attempt found')
      return
    }

    try {
      console.log('📤 Submitting quiz answers...')
      setIsSubmitting(true)

      // Flush any pending saves before submitting
      if (pendingAnswers.size > 0) {
        console.log('💾 Flushing pending answers before submit...')
        await flushPendingAnswers()
      }

      // Prepare answers in the correct format
      const answers: TestAttemptAnswer[] = Object.entries(selectedAnswers).map(([questionId, answerId]) => {
        const question = questions.find(q => q._id === questionId)
        const selectedAnswer = question?.answers.find(a => a._id === answerId)
        
        return {
          question_id: questionId,
          selected_answer_id: answerId,
          is_correct: selectedAnswer?.is_correct || false
        }
      })

      console.log('📊 Submitting', answers.length, 'answers')
      const result: any = await testAttemptAPI.submitTestAttempt(testAttempt._id, { answers })
      console.log('✅ Quiz submitted successfully. Score:', result.score)

      // Mark as completed to prevent abandonment logic
      setIsCompleted(true)

      // Clear localStorage
      if (quizId) {
        localStorage.removeItem(`quiz_attempt_${quizId}`)
        console.log('🗑️ Cleared localStorage')
      }

      // Clear intervals
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Navigate to results page
      navigate(`/result?attemptId=${result.attempt_id || testAttempt._id}`)

    } catch (error: any) {
      console.error('❌ Failed to submit quiz:', error)
      setError("Không thể nộp bài. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length
  }

  const getProgressPercentage = () => {
    return questions.length > 0 ? (getAnsweredCount() / questions.length) * 100 : 0
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-6">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải quiz...</p>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-6">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Quay lại
          </Button>
        </Card>
      </div>
    )
  }

  // No quiz or questions
  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-6">
          <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Quiz không có câu hỏi</h2>
          <Button onClick={() => navigate('/homepage')} variant="outline">
            Về trang chủ
          </Button>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {resumedFromStorage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-900">Quiz Resumption Successful</p>
              <p className="text-sm text-green-700">
                Tiến trình của bạn đã được khôi phục. Bạn đang tiếp tục từ câu hỏi {Math.min(currentQuestionIndex + 1, questions.length)} trong tổng số {questions.length} câu.
              </p>
            </div>
          </div>
        )}
        {/* Quiz Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">{quiz.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Save Status Indicator */}
              {saveStatus !== 'idle' && (
                <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                  {saveStatus === 'saving' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600">Đang lưu...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Đã lưu</span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-600">Lỗi lưu</span>
                    </>
                  )}
                </div>
              )}
              {/* Timer */}
              {timeLeft > 0 && (
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="text-lg font-mono font-semibold text-gray-800">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Tiến độ: {getAnsweredCount()}/{questions.length} câu hỏi
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(getProgressPercentage())}% hoàn thành
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Câu hỏi {currentQuestionIndex + 1}/{questions.length}
              </CardTitle>
              {selectedAnswers[currentQuestion._id] && (
                <Check className="w-5 h-5 text-green-500" />
              )}
            </div>
            <p className="text-gray-600 text-base leading-relaxed">
              {currentQuestion.content}
            </p>
          </CardHeader>

          <CardContent>
            <RadioGroup
              value={selectedAnswers[currentQuestion._id] || ""}
              onValueChange={handleAnswerChange}
              className="space-y-3"
            >
              {currentQuestion.answers.map((answer, index) => (
                <div
                  key={answer._id}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <RadioGroupItem value={answer._id} id={answer._id} className="mt-1" />
                  <Label
                    htmlFor={answer._id}
                    className="flex-1 text-sm leading-relaxed cursor-pointer"
                  >
                    <span className="font-medium text-gray-700 mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {answer.content}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Câu trước</span>
          </Button>

        <div className="flex-1 mx-4 overflow-x-auto">
          <div className="flex items-center space-x-2 min-w-max">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? "bg-blue-600 text-white"
                    : selectedAnswers[questions[index]._id]
                    ? "bg-green-100 text-green-600 border border-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang nộp bài...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Nộp bài</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <span>Câu tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Submit All Button (always visible for quick submission) */}
        {getAnsweredCount() > 0 && currentQuestionIndex !== questions.length - 1 && (
          <div className="mt-4 text-center">
            <Button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang nộp bài...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Nộp bài ngay ({getAnsweredCount()}/{questions.length} câu)
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
