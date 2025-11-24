"use client"

import { useState, useEffect, useRef } from "react"
import { BookOpen, Calendar, Trophy, Eye, Filter, Search, ChevronDown, Loader2, AlertCircle } from "lucide-react"
import { gsap } from 'gsap'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useNavigate } from "react-router-dom"
import { authAPI, testAttemptAPI } from "../../services/api"
import { TestAttempt } from "../../types/types"


export default function QuizHistory() {
  const navigate = useNavigate()
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  
  // GSAP refs
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const filtersRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const categories = ["all", "Lập trình", "Địa lý", "Công nghệ", "Ngôn ngữ"]
  const sortOptions = [
    { value: "date", label: "Ngày (Mới nhất)" },
    { value: "score", label: "Điểm số (Cao nhất)" },
    { value: "name", label: "Tên bài quiz" },
  ]

  // Load user test attempts on component mount
  useEffect(() => {
    const loadTestAttempts = async () => {
      try {
        console.log('[HISTORY] Loading user test attempts...')
        setIsLoading(true)
        
        // Check authentication
        const currentUser = authAPI.getCurrentUser()
        if (!currentUser) {
          console.log('[HISTORY] No authenticated user, redirecting to login')
          navigate('/')
          return
        }
        
        console.log('[HISTORY] User authenticated:', currentUser.name)
        
        // Fetch user's test attempts
        console.log('[HISTORY] Fetching test attempts...')
        const attempts = await testAttemptAPI.getMyAttempts()
        console.log('[HISTORY] Test attempts loaded:', attempts.length)
        setTestAttempts(attempts)
        
      } catch (error: any) {
        console.error('[HISTORY] Failed to load test attempts:', error)
        if (error.response?.status === 401) {
          console.log('[HISTORY] Authentication error, redirecting to login')
          navigate('/')
        } else {
          setError('Không thể tải lịch sử quiz. Vui lòng thử lại sau.')
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTestAttempts()
  }, [navigate])

  // GSAP animations after loading
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const tl = gsap.timeline()
      
      // Set initial states
      gsap.set([headerRef.current, statsRef.current, filtersRef.current, tableRef.current], {
        opacity: 0,
        y: 30
      })
      
      gsap.set('.stats-card', {
        opacity: 0,
        y: 50,
        scale: 0.9
      })
      
      gsap.set('.history-row', {
        opacity: 0,
        x: -20,
        scale: 0.95
      })
      
      gsap.set('.brand-icon', {
        opacity: 0,
        scale: 0,
        rotation: -180
      })
      
      gsap.set('.stats-icon', {
        opacity: 0,
        scale: 0,
        rotation: 180
      })
      
      // Animate in sequence
      tl.to(headerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      })
      .to('.brand-icon', {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.6,
        ease: "back.out(1.5)"
      }, "-=0.5")
      .to(statsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.4")
      .to('.stats-card', {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.15,
        ease: "back.out(1.2)"
      }, "-=0.3")
      .to('.stats-icon', {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "back.out(1.5)"
      }, "-=0.4")
      .to(filtersRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.3")
      .to(tableRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.2")
      .to('.history-row', {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.out"
      }, "-=0.3")
    }
  }, [isLoading])

  // Stats card hover animations
  const handleStatsCardHover = (element: HTMLElement, isHovering: boolean) => {
    gsap.to(element, {
      y: isHovering ? -5 : 0,
      scale: isHovering ? 1.02 : 1,
      boxShadow: isHovering ? "0 15px 35px rgba(0,0,0,0.1)" : "0 4px 12px rgba(0,0,0,0.05)",
      duration: 0.3,
      ease: "power2.out"
    })
  }

  // Row hover animations
  const handleRowHover = (element: HTMLElement, isHovering: boolean) => {
    gsap.to(element, {
      scale: isHovering ? 1.005 : 1,
      backgroundColor: isHovering ? "rgba(249, 250, 251, 0.8)" : "rgba(255, 255, 255, 1)",
      duration: 0.2,
      ease: "power2.out"
    })
  }

  // Button click animations
  const handleButtonClick = (element: HTMLElement) => {
    gsap.to(element, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut"
    })
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return "text-green-600 bg-green-50"
    if (percentage >= 60) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  const getScoreIcon = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return "🏆"
    if (percentage >= 60) return "⭐"
    return "📚"
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getQuizName = (attempt: TestAttempt): string => {
    if (typeof attempt.quiz_id === 'object' && attempt.quiz_id?.title) {
      return attempt.quiz_id.title
    }
    return 'Quiz'
  }

  const formatTimeSpent = (startedAt: string | Date, completedAt?: string | Date): string => {
    if (!completedAt) return 'Chưa hoàn thành'
    
    const start = typeof startedAt === 'string' ? new Date(startedAt) : startedAt
    const end = typeof completedAt === 'string' ? new Date(completedAt) : completedAt
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Invalid Time'
    }
    
    const diffMs = end.getTime() - start.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffSeconds = Math.floor((diffMs % 60000) / 1000)
    
    return `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`
  }

  const getStatusDisplay = (status: string): { text: string; color: string } => {
    switch (status) {
      case 'completed':
        return { text: 'Hoàn thành', color: 'text-green-600 bg-green-50 border-green-200' }
      case 'abandoned':
        return { text: 'Đã hủy', color: 'text-red-600 bg-red-50 border-red-200' }
      case 'late':
        return { text: 'Trễ hạn', color: 'text-orange-600 bg-orange-50 border-orange-200' }
      case 'in_progress':
        return { text: 'Đang thực hiện', color: 'text-blue-600 bg-blue-50 border-blue-200' }
      default:
        return { text: 'Chưa hoàn thành', color: 'text-gray-600 bg-gray-50 border-gray-200' }
    }
  }

  const filteredAndSortedHistory = testAttempts
    .filter((attempt) => {
      const quizName = getQuizName(attempt)
      const matchesSearch = quizName.toLowerCase().includes(searchQuery.toLowerCase())
      // For now, we'll ignore category filtering since we don't have category data in test attempts
      const matchesCategory = selectedCategory === "all"
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        case "score":
          const aPercentage = (a.correct_answers || 0) / (a.total_questions || 1)
          const bPercentage = (b.correct_answers || 0) / (b.total_questions || 1)
          return bPercentage - aPercentage
        case "name":
          return getQuizName(a).localeCompare(getQuizName(b))
        default:
          return 0
      }
    })

  const totalQuizzes = testAttempts.filter(a => a.status === 'completed').length
  const averageScore = totalQuizzes > 0 ? Math.round(
    testAttempts
      .filter(a => a.status === 'completed')
      .reduce((sum, attempt) => {
        const percentage = ((attempt.correct_answers || 0) / (attempt.total_questions || 1)) * 100
        return sum + percentage
      }, 0) / totalQuizzes
  ) : 0

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-6">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải lịch sử quiz...</p>
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
      {/* Header */}
      <header ref={headerRef} className="bg-white border-b border-gray-200 shadow-sm" style={{ opacity: 0 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="brand-icon w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Lịch sử Quiz</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" style={{ opacity: 0 }}>
          <Card 
            className="stats-card"
            onMouseEnter={(e) => handleStatsCardHover(e.currentTarget, true)}
            onMouseLeave={(e) => handleStatsCardHover(e.currentTarget, false)}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="stats-icon w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalQuizzes}</p>
                  <p className="text-sm text-gray-600">Tổng số quiz</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="stats-card"
            onMouseEnter={(e) => handleStatsCardHover(e.currentTarget, true)}
            onMouseLeave={(e) => handleStatsCardHover(e.currentTarget, false)}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="stats-icon w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
                  <p className="text-sm text-gray-600">Điểm trung bình</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="stats-card"
            onMouseEnter={(e) => handleStatsCardHover(e.currentTarget, true)}
            onMouseLeave={(e) => handleStatsCardHover(e.currentTarget, false)}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="stats-icon w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {testAttempts.length > 0 ? formatDate(testAttempts[0].started_at) : "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">Quiz gần đây nhất</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card ref={filtersRef} className="mb-6" style={{ opacity: 0 }}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm bài quiz..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
              <div className="flex gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40 h-10 border-gray-200">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "Tất cả các danh mục" : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 h-10 border-gray-200">
                    <ChevronDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz History Table */}
        <Card ref={tableRef} style={{ opacity: 0 }}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Lịch sử làm Quiz</CardTitle>
            <CardDescription>Theo dõi tiến trình và xem lại kết quả trước đây</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAndSortedHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-gray-900">Tên Quiz</TableHead>
                      <TableHead className="font-semibold text-gray-900">Ngày làm</TableHead>
                      <TableHead className="font-semibold text-gray-900">Điểm số</TableHead>
                      <TableHead className="font-semibold text-gray-900">Thời gian</TableHead>
                      <TableHead className="font-semibold text-gray-900">Trạng thái</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedHistory.map((attempt) => (
                      <TableRow 
                        key={attempt._id} 
                        className="history-row hover:bg-gray-50"
                        onMouseEnter={(e) => handleRowHover(e.currentTarget, true)}
                        onMouseLeave={(e) => handleRowHover(e.currentTarget, false)}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{getScoreIcon(attempt.correct_answers || 0, attempt.total_questions || 1)}</span>
                            <div>
                              <p className="font-medium text-gray-900">{getQuizName(attempt)}</p>
                              <p className="text-sm text-gray-500">
                                {getStatusDisplay(attempt.status).text}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{formatDate(attempt.started_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {attempt.status === 'abandoned' ? (
                            <Badge variant="outline" className="text-gray-500 bg-gray-50 border-gray-200">
                              Không có điểm
                            </Badge>
                          ) : (
                            <Badge className={`${getScoreColor(attempt.correct_answers || 0, attempt.total_questions || 1)} border-0`}>
                              {attempt.correct_answers || 0}/{attempt.total_questions || 1} ({Math.round(((attempt.correct_answers || 0) / (attempt.total_questions || 1)) * 100)}%)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-700 font-mono text-sm">
                            {(attempt.status === 'completed' || attempt.status === 'abandoned' || attempt.status === 'late')
                              ? formatTimeSpent(attempt.started_at, attempt.completed_at)
                              : (typeof attempt.quiz_id === 'object' && attempt.quiz_id?.time_limit 
                                  ? `${attempt.quiz_id.time_limit} phút` 
                                  : 'Không giới hạn')
                            }
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusDisplay(attempt.status).color}>
                            {getStatusDisplay(attempt.status).text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {(attempt.status === 'completed' || attempt.status === 'late') ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-orange-600 border-orange-200 hover:bg-orange-50 bg-transparent"
                              onClick={(e) => {
                                handleButtonClick(e.currentTarget)
                                setTimeout(() => navigate(`/result?attemptId=${attempt._id}`), 150)
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Xem chi tiết
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {attempt.status === 'abandoned' ? 'Đã hủy' : 'Không khả dụng'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy lịch sử quiz nào</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || selectedCategory !== "all"
                    ? "Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."
                    : "Hãy làm quiz đầu tiên để xem lịch sử ở đây."}
                </p>
                <Button 
                  onClick={(e) => {
                    handleButtonClick(e.currentTarget)
                    setTimeout(() => navigate('/homepage'), 150)
                  }}
                  className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Khám phá Quiz
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}