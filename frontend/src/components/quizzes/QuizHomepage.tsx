"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Filter, BookOpen, Crown, Play, Lock, Clock, Users, Loader2, AlertCircle, TrendingUp, Star, Gift, SortAsc, Calendar, ThumbsUp, Sparkles, ChevronRight, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNavigate } from "react-router-dom"
import { quizAPI, authAPI, userUtils } from "../../services/api"
import { QuizWithDetails, User } from "../../types/types"
import { gsap } from 'gsap'
import ResumeQuizBanner from "./ResumeQuizBanner"

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
  const [filterType, setFilterType] = useState<"all" | "hot" | "premium" | "free">("all")
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "rating" | "difficulty">("popular")

  // GSAP animations
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const tl = gsap.timeline()
      
      // Set initial states
      gsap.set([headerRef.current, '.hero-cards', '.filter-section', '.stats-section', '.quiz-section'], {
        opacity: 0,
        y: 30
      })
      
      // Animate in sequence
      tl.to(headerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      })
      .to('.hero-cards', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "back.out(1.2)"
      }, "-=0.4")
      .to('.filter-section', {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.3")
      .to('.stats-section', {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.2")
      .to('.quiz-section', {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.2")
    }
  }, [isLoading])

  // Animate quiz cards when they change
  useEffect(() => {
    if (!isLoading && filteredQuizzes.length > 0) {
      gsap.fromTo('.quiz-card', 
        { 
          opacity: 0, 
          y: 50,
          scale: 0.9
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.2)",
          delay: 0.2
        }
      )
    }
  }, [filteredQuizzes, isLoading])

  // Filter button animations
  const animateFilterChange = () => {
    gsap.to('.filter-buttons', {
      scale: 0.98,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut"
    })
  }

  // Card hover animations
  const handleCardHover = (element: HTMLElement, isHovering: boolean) => {
    gsap.to(element, {
      y: isHovering ? -8 : 0,
      scale: isHovering ? 1.02 : 1,
      rotationY: isHovering ? 5 : 0,
      duration: 0.3,
      ease: "power2.out"
    })

    // Animate card image
    const image = element.querySelector('.quiz-image')
    if (image) {
      gsap.to(image, {
        scale: isHovering ? 1.1 : 1,
        duration: 0.4,
        ease: "power2.out"
      })
    }
  }

  // Button click animation
  const handleButtonClick = (element: HTMLElement) => {
    gsap.to(element, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
      transformOrigin: "center"
    })
  }

  // Hero card hover animation
  const handleHeroCardHover = (element: HTMLElement, isHovering: boolean) => {
    gsap.to(element, {
      y: isHovering ? -5 : 0,
      scale: isHovering ? 1.03 : 1,
      duration: 0.3,
      ease: "power2.out"
    })
  }

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

    // Filter type
    switch (filterType) {
      case "hot":
        // Hot quizzes - based on total attempts (popularity)
        filtered = filtered.filter(quiz => (quiz.totalAttempts || 0) >= 5)
        break
      case "premium":
        filtered = filtered.filter(quiz => quiz.is_premium)
        break
      case "free":
        filtered = filtered.filter(quiz => !quiz.is_premium)
        break
      case "all":
      default:
        // No additional filtering
        break
    }

    // Sort the filtered results
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => (b.totalAttempts || 0) - (a.totalAttempts || 0))
        break
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
        break
      case "rating":
        // If you have ratings in the backend
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case "difficulty":
        filtered.sort((a, b) => (a.totalQuestions || 0) - (b.totalQuestions || 0))
        break
    }

    console.log('🔍 Filtered quizzes:', filtered.length, 'of', quizzes.length)
    setFilteredQuizzes(filtered)
  }, [searchTerm, filterType, sortBy, quizzes])

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

  const isHotQuiz = (quiz: QuizWithDetails): boolean => {
    return (quiz.totalAttempts || 0) >= 5
  }

  const getQuizBadges = (quiz: QuizWithDetails) => {
    const badges = []
    
    if (isHotQuiz(quiz)) {
      badges.push({
        icon: TrendingUp,
        text: "Hot",
        className: "bg-red-100 text-red-600 border-red-200"
      })
    }
    
    if (quiz.is_premium) {
      badges.push({
        icon: Crown,
        text: "Premium",
        className: "bg-yellow-100 text-yellow-600 border-yellow-200"
      })
    } else {
      badges.push({
        icon: Gift,
        text: "Free",
        className: "bg-green-100 text-green-600 border-green-200"
      })
    }

    return badges
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
    <div ref={containerRef} className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="mb-12">
          <div ref={headerRef} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Khám phá Quiz 
              {user && <span className="text-blue-600">👋 {user.name}</span>}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tham gia hàng nghìn quiz thú vị và nâng cao kiến thức của bạn
            </p>
          </div>

          {/* Featured Action Cards */}
          <div className="hero-cards grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Create Quiz Card */}
            <Card 
              className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 cursor-pointer" 
              onClick={() => userUtils.hasPremiumAccess(user) ? navigate('/create') : navigate('/upgrade')}
              onMouseEnter={(e) => handleHeroCardHover(e.currentTarget, true)}
              onMouseLeave={(e) => handleHeroCardHover(e.currentTarget, false)}
            >
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Tạo Quiz</h3>
                    <p className="text-emerald-100 mb-6">
                      {userUtils.hasPremiumAccess(user) ? "Chơi miễn phí với 300 người tham gia" : "Nâng cấp để tạo quiz của riêng bạn"}
                    </p>
                    <Button 
                      className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleButtonClick(e.currentTarget)
                        setTimeout(() => userUtils.hasPremiumAccess(user) ? navigate('/create') : navigate('/upgrade'), 150)
                      }}
                    >
                      {userUtils.hasPremiumAccess(user) ? (
                        <>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Tạo Quiz
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4 mr-2" />
                          Nâng cấp ngay
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quiz History Card */}
            <Card 
              className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 cursor-pointer" 
              onClick={() => navigate('/history')}
              onMouseEnter={(e) => handleHeroCardHover(e.currentTarget, true)}
              onMouseLeave={(e) => handleHeroCardHover(e.currentTarget, false)}
            >
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Lịch sử</h3>
                    <p className="text-purple-100 mb-6">
                      Xem lại kết quả và theo dõi tiến độ học tập
                    </p>
                    <Button 
                      className="bg-white text-purple-600 hover:bg-purple-50 font-semibold"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleButtonClick(e.currentTarget)
                        setTimeout(() => navigate('/history'), 150)
                      }}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Xem lịch sử
                    </Button>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                      <Clock className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resume Quiz Banner */}
          <ResumeQuizBanner />

          {/* Search and Filters */}
          <div className="filter-section bg-gray-50 rounded-2xl p-6 mb-8">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Tìm kiếm quiz..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg border-0 bg-white shadow-sm rounded-xl transition-all duration-300 focus:scale-105"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Filter Type Buttons */}
              <div className="filter-buttons flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => {
                    setFilterType("all")
                    animateFilterChange()
                  }}
                  className="rounded-full px-6 py-2"
                  onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })}
                  onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Tất cả
                </Button>
                <Button
                  variant={filterType === "hot" ? "default" : "outline"}
                  onClick={() => {
                    setFilterType("hot")
                    animateFilterChange()
                  }}
                  className="rounded-full px-6 py-2 bg-red-500 hover:bg-red-600 text-white border-red-500"
                  onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })}
                  onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Hot
                </Button>
                <Button
                  variant={filterType === "premium" ? "default" : "outline"}
                  onClick={() => {
                    setFilterType("premium")
                    animateFilterChange()
                  }}
                  className="rounded-full px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
                  onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })}
                  onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Premium
                </Button>
                <Button
                  variant={filterType === "free" ? "default" : "outline"}
                  onClick={() => {
                    setFilterType("free")
                    animateFilterChange()
                  }}
                  className="rounded-full px-6 py-2 bg-green-500 hover:bg-green-600 text-white border-green-500"
                  onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })}
                  onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Miễn phí
                </Button>
              </div>

              {/* Sort Select */}
              <div className="flex gap-2 ml-auto">
                <Select value={sortBy} onValueChange={(value) => {
                  setSortBy(value as any)
                  animateFilterChange()
                }}>
                  <SelectTrigger className="w-[150px] rounded-full border-gray-200">
                    <SortAsc className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">
                      <div className="flex items-center">
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Phổ biến
                      </div>
                    </SelectItem>
                    <SelectItem value="newest">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Mới nhất
                      </div>
                    </SelectItem>
                    <SelectItem value="rating">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        Đánh giá
                      </div>
                    </SelectItem>
                    <SelectItem value="difficulty">
                      <div className="flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Độ khó
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="stats-section flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{quizzes.length}</div>
              <div className="text-sm text-gray-600 font-medium">Tổng quiz</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">{quizzes.filter(q => isHotQuiz(q)).length}</div>
              <div className="text-sm text-gray-600 font-medium">Quiz Hot</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{quizzes.filter(q => q.is_premium).length}</div>
              <div className="text-sm text-gray-600 font-medium">Premium</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{filteredQuizzes.length}</div>
              <div className="text-sm text-gray-600 font-medium">Kết quả</div>
            </div>
          </div>
        </div>

        {/* Recently Published Section */}
        <div className="quiz-section mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quiz gần đây</h2>
            <Button 
              variant="ghost" 
              className="text-blue-600 hover:text-blue-700"
              onMouseEnter={(e) => gsap.to(e.currentTarget, { x: 5, duration: 0.2 })}
              onMouseLeave={(e) => gsap.to(e.currentTarget, { x: 0, duration: 0.2 })}
            >
              Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {filteredQuizzes.length === 0 ? (
            <Card className="text-center p-12 bg-gray-50 border-dashed">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Không tìm thấy quiz nào
              </h3>
              <p className="text-gray-600 mb-6">
                Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm("")
                  setFilterType("all")
                  setSortBy("popular")
                  animateFilterChange()
                }}
                className="bg-blue-600 hover:bg-blue-700"
                onMouseEnter={(e) => handleButtonClick(e.currentTarget)}
              >
                Xóa bộ lọc
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredQuizzes.slice(0, 8).map((quiz, index) => (
                <Card 
                  key={quiz._id} 
                  className="quiz-card group cursor-pointer border-0 bg-white shadow-md rounded-2xl overflow-hidden flex flex-col h-full"
                  onClick={() => handleQuizClick(quiz._id)}
                  onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
                  onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
                >
                  {/* Quiz Image */}
                  <div className="quiz-image h-32 relative overflow-hidden">
                    {quiz.image ? (
                      <img 
                        src={quiz.image} 
                        alt={quiz.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to gradient if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling!.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 ${quiz.image ? 'hidden' : ''}`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1">
                      {getQuizBadges(quiz).slice(0, 2).map((badge, badgeIndex) => {
                        const IconComponent = badge.icon
                        return (
                          <Badge
                            key={badgeIndex}
                            className="bg-white/90 text-gray-700 text-xs border-0 shadow-sm"
                            variant="secondary"
                          >
                            <IconComponent className="w-3 h-3 mr-1" />
                            {badge.text}
                          </Badge>
                        )
                      })}
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <Badge 
                        className={`${getDifficultyColor(quiz.totalQuestions || 0)} border-0 shadow-sm`}
                        variant="secondary"
                      >
                        {getDifficultyLabel(quiz.totalQuestions || 0)}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[3rem]">
                      {quiz.title}
                    </h3>
                    
                    {/* Quiz Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4 flex-1">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{quiz.totalQuestions || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(quiz.time_limit)}</span>
                      </div>
                      {quiz.totalAttempts && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{quiz.totalAttempts}</span>
                        </div>
                      )}
                    </div>

                    {/* Button always at bottom */}
                    <Button 
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg mt-auto"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleButtonClick(e.currentTarget)
                        setTimeout(() => handleQuizClick(quiz._id), 150)
                      }}
                    >
                      <Play className="w-3 h-3 mr-2" />
                      Bắt đầu
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Show More Button */}
          {filteredQuizzes.length > 8 && (
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-3 rounded-full border-gray-300 hover:border-blue-500 hover:text-blue-600"
                onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })}
                onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}
              >
                Xem thêm quiz
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}