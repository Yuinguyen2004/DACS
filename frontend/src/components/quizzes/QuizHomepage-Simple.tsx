"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Filter, BookOpen, Crown, Play, Lock, Clock, Users, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNavigate } from "react-router-dom"
import { quizAPI, authAPI, userUtils } from "../../services/api"
import { QuizWithDetails, User } from "../../types/types"
import { gsap } from 'gsap'

export default function QuizHomepage() {
  const navigate = useNavigate()
  
  // Simple refs
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  
  // State
  const [quizzes, setQuizzes] = useState<QuizWithDetails[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [user, setUser] = useState<User | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [showPremiumOnly, setShowPremiumOnly] = useState(false)

  // Simple GSAP animation on mount
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      // Simple fade in animation
      gsap.fromTo(containerRef.current.children, 
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          stagger: 0.1,
          ease: "power2.out"
        }
      )
    }
  }, [isLoading])

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🏠 Loading homepage data...')
        setIsLoading(true)

        // Get current user from localStorage (App.tsx handles auth validation)
        const currentUser = authAPI.getCurrentUser()
        if (currentUser) {
          console.log('✅ User found:', currentUser.name)
          setUser(currentUser)
        } else {
          console.log('⚠️ No user found, but App.tsx should handle auth')
        }

        // Fetch all quizzes
        console.log('📚 Fetching all quizzes...')
        const quizzesData = await quizAPI.getAllQuizzes()
        console.log('✅ Quizzes loaded:', quizzesData.length)
        setQuizzes(quizzesData)
        setFilteredQuizzes(quizzesData)

      } catch (error: any) {
        console.error('❌ Failed to load homepage data:', error)
        if (error.response?.status === 401) {
          console.log('❌ 401 error loading homepage data, but App.tsx should handle auth')
          setError("Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang.")
        } else {
          setError("Không thể tải danh sách quiz. Vui lòng thử lại sau.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [navigate])

  // Filter quizzes based on search and filters
  useEffect(() => {
    let filtered = [...quizzes]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(quiz => 
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Premium filter
    if (showPremiumOnly) {
      filtered = filtered.filter(quiz => quiz.is_premium)
    }

    console.log('🔍 Filtered quizzes:', filtered.length, 'of', quizzes.length)
    setFilteredQuizzes(filtered)
  }, [searchTerm, selectedCategory, selectedDifficulty, showPremiumOnly, quizzes])

  const handleQuizClick = (quizId: string) => {
    console.log('🎯 Starting quiz:', quizId)
    navigate(`/test?quizId=${quizId}`)
  }

  const formatDuration = (timeLimit?: number): string => {
    if (!timeLimit) return "Không giới hạn"
    // timeLimit is already in minutes from the database
    return `${timeLimit} phút`
  }

  const getDifficultyColor = (questionCount: number): string => {
    if (questionCount <= 10) return "bg-green-100 text-green-800"
    if (questionCount <= 25) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getDifficultyLabel = (questionCount: number): string => {
    if (questionCount <= 10) return "Dễ"
    if (questionCount <= 25) return "Trung bình"
    return "Khó"
  }

  // Loading state 
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-6">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải danh sách quiz...</p>
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
          <Button onClick={() => window.location.reload()} variant="outline">
            Thử lại
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div ref={headerRef} className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Khám phá Quiz 
                {user && <span className="text-blue-600 ml-2">👋 {user.name}</span>}
              </h1>
              <p className="text-gray-600 mt-2">
                Tham gia hàng nghìn quiz thú vị và nâng cao kiến thức của bạn
              </p>
            </div>
            {userUtils.hasPremiumAccess(user) ? (
              <Button 
                onClick={() => navigate('/create')} 
                className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-105"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Tạo Quiz
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/upgrade')} 
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white transition-all duration-300 hover:scale-105"
              >
                <Crown className="w-4 h-4 mr-2" />
                Nâng cấp để tạo Quiz
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm quiz..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 transition-all duration-300 focus:scale-105"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={showPremiumOnly ? "default" : "outline"}
                onClick={() => setShowPremiumOnly(!showPremiumOnly)}
                className="flex items-center gap-2 transition-all duration-300 hover:scale-105"
              >
                <Crown className="w-4 h-4" />
                Premium
              </Button>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px] transition-all duration-300 hover:scale-105">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="programming">Lập trình</SelectItem>
                  <SelectItem value="math">Toán học</SelectItem>
                  <SelectItem value="science">Khoa học</SelectItem>
                  <SelectItem value="history">Lịch sử</SelectItem>
                  <SelectItem value="geography">Địa lý</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="hover:scale-105 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{quizzes.length}</p>
                    <p className="text-sm text-gray-600">Quiz có sẵn</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:scale-105 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {quizzes.filter(q => q.is_premium).length}
                    </p>
                    <p className="text-sm text-gray-600">Quiz Premium</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:scale-105 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {filteredQuizzes.length}
                    </p>
                    <p className="text-sm text-gray-600">Kết quả hiện tại</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quiz Grid */}
        {filteredQuizzes.length === 0 ? (
          <Card className="text-center p-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Không tìm thấy quiz nào
            </h3>
            <p className="text-gray-600 mb-4">
              Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
            <Button 
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
                setShowPremiumOnly(false)
              }}
              variant="outline"
              className="transition-all duration-300 hover:scale-105"
            >
              Xóa bộ lọc
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz, index) => (
              <Card 
                key={quiz._id} 
                className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={() => handleQuizClick(quiz._id)}
                style={{
                  transform: 'translateY(20px)',
                  opacity: 0,
                  animation: `slideUp 0.6s ease-out forwards ${index * 0.1}s`
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg line-clamp-2">
                      {quiz.title}
                    </CardTitle>
                    {quiz.is_premium && (
                      <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0 animate-pulse" />
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {quiz.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Quiz Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{quiz.totalQuestions || 0} câu hỏi</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(quiz.time_limit)}</span>
                      </div>
                    </div>

                    {/* Difficulty Badge */}
                    <div className="flex items-center justify-between">
                      <Badge 
                        className={`${getDifficultyColor(quiz.totalQuestions || 0)} transition-all duration-300`}
                        variant="secondary"
                      >
                        {getDifficultyLabel(quiz.totalQuestions || 0)}
                      </Badge>
                      
                      {quiz.totalAttempts && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Users className="w-4 h-4" />
                          <span>{quiz.totalAttempts} lượt thử</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button 
                      className="w-full transition-all duration-300 hover:scale-105 active:scale-95"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuizClick(quiz._id)
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Bắt đầu Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Add custom CSS animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}