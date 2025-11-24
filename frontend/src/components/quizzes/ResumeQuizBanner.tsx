import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, PlayCircle, AlertCircle, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { testAttemptAPI } from '../../services/api'
import { TestAttempt } from '../../types/types'

export default function ResumeQuizBanner() {
  const navigate = useNavigate()
  const [inProgressAttempts, setInProgressAttempts] = useState<TestAttempt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    loadInProgressAttempts()
  }, [])

  const loadInProgressAttempts = async () => {
    try {
      setIsLoading(true)
      const attempts = await testAttemptAPI.getInProgressAttempts()
      console.log('📋 In-progress attempts:', attempts)
      setInProgressAttempts(attempts)
    } catch (error) {
      console.error('❌ Failed to load in-progress attempts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResume = (quizId: string) => {
    navigate(`/quizzes/taking?quizId=${quizId}`)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  // Don't show if loading, dismissed, or no in-progress attempts
  if (isLoading || isDismissed || inProgressAttempts.length === 0) {
    return null
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 shadow-md mb-8 animate-in slide-in-from-top duration-500">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Bài quiz chưa hoàn thành
              </h3>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                {inProgressAttempts.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {inProgressAttempts.map((attempt) => {
                const quiz = attempt.quiz_id
                const quizTitle = typeof quiz === 'object' ? quiz.title : 'Unknown Quiz'
                const quizId = typeof quiz === 'object' ? quiz._id : quiz
                const answeredCount = attempt.draft_answers?.length || 0
                const totalQuestions = attempt.total_questions || 0
                const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

                return (
                  <div 
                    key={attempt._id} 
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {quizTitle}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {attempt.started_at 
                              ? new Date(attempt.started_at).toLocaleString('vi-VN', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {answeredCount}/{totalQuestions}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleResume(quizId)}
                      className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-2"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Tiếp tục
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="shrink-0 -mt-1 -mr-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
