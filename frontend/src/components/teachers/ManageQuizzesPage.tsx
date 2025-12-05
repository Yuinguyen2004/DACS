"use client"

import { useState, useEffect, useRef } from "react"
import { BookOpen, PlusCircle, Edit, Trash2, Crown, Search, Filter, Loader2, AlertCircle } from "lucide-react"
import { gsap } from 'gsap'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNavigate } from "react-router-dom"
import { authAPI, userUtils, quizAPI } from "../../services/api"
import { User, QuizWithDetails } from "../../types/types"

export default function ManageQuizzesPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [quizzes, setQuizzes] = useState<QuizWithDetails[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPremium, setFilterPremium] = useState("all") // 'all', 'premium', 'free'
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  
  // GSAP refs
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  // Load user data and quizzes on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[MANAGE_QUIZ] Loading user data and quizzes...')
        setIsLoading(true)
        
        // Check authentication
        const currentUser = authAPI.getCurrentUser()
        if (!currentUser) {
          console.log('[MANAGE_QUIZ] No authenticated user, redirecting to login')
          navigate('/')
          return
        }
        
        console.log('[MANAGE_QUIZ] User authenticated:', currentUser.name)
        setUser(currentUser)
        
        // Fetch user's quizzes
        console.log('[MANAGE_QUIZ] Fetching user quizzes...')
        const userQuizzes = await quizAPI.getMyQuizzes()
        console.log('[MANAGE_QUIZ] User quizzes loaded:', userQuizzes.length)
        setQuizzes(userQuizzes)
        
      } catch (error: any) {
        console.error('[MANAGE_QUIZ] Failed to load data:', error)
        if (error.response?.status === 401) {
          console.log('[MANAGE_QUIZ] Authentication error, redirecting to login')
          navigate('/')
        } else {
          setError('Không thể tải danh sách quiz. Vui lòng thử lại sau.')
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [navigate])

  // GSAP animations after loading
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const tl = gsap.timeline()
      
      // Set initial states
      gsap.set([headerRef.current, actionsRef.current, tableRef.current], {
        opacity: 0,
        y: 30
      })
      
      gsap.set('.quiz-row', {
        opacity: 0,
        x: -20,
        scale: 0.95
      })
      
      gsap.set('.action-button', {
        opacity: 0,
        scale: 0.8
      })
      
      gsap.set('.brand-icon', {
        opacity: 0,
        scale: 0,
        rotation: -180
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
      .to(actionsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.4")
      .to(tableRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.3")
      .to('.quiz-row', {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(1.2)"
      }, "-=0.3")
      .to('.action-button', {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: "back.out(1.5)"
      }, "-=0.2")
    }
  }, [isLoading])

  // Row hover animations
  const handleRowHover = (element: HTMLElement, isHovering: boolean) => {
    gsap.to(element, {
      scale: isHovering ? 1.01 : 1,
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

  // Delete animation
  const animateDelete = (element: HTMLElement) => {
    gsap.to(element, {
      opacity: 0,
      x: -100,
      scale: 0.8,
      duration: 0.4,
      ease: "power2.in"
    })
  }

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPremiumFilter =
      filterPremium === "all" ||
      (filterPremium === "premium" && quiz.is_premium) ||
      (filterPremium === "free" && !quiz.is_premium)
    return matchesSearch && matchesPremiumFilter
  })

  const handleEdit = (quizId: string) => {
    console.log(`[MANAGE_QUIZ] Editing quiz with ID: ${quizId}`)
    navigate(`/create?editId=${quizId}`)
  }

  const handleDelete = async (quizId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa quiz này?")) {
      try {
        console.log(`[MANAGE_QUIZ] Deleting quiz with ID: ${quizId}`)
        
        // Animate the row being deleted
        const rowElement = document.querySelector(`[data-quiz-id="${quizId}"]`) as HTMLElement
        if (rowElement) {
          animateDelete(rowElement)
          await new Promise(resolve => setTimeout(resolve, 400))
        }
        
        await quizAPI.deleteQuiz(quizId)
        console.log(`[MANAGE_QUIZ] Quiz deleted successfully`)
        
        // Remove from local state
        setQuizzes((prevQuizzes) => prevQuizzes.filter((quiz) => quiz._id !== quizId))
        
      } catch (error: any) {
        console.error('[MANAGE_QUIZ] Failed to delete quiz:', error)
        alert('Không thể xóa quiz. Vui lòng thử lại sau.')
      }
    }
  }

  const handleCreateNewQuiz = () => {
    if (!user) {
      navigate('/')
      return
    }
    
    if (userUtils.hasPremiumAccess(user)) {
      console.log('[MANAGE_QUIZ] Premium user, navigating to create quiz')
      navigate('/create')
    } else {
      console.log('[MANAGE_QUIZ] User needs premium access, redirecting to upgrade')
      navigate('/upgrade')
    }
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
    <div ref={containerRef} className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header ref={headerRef} className="bg-white border-b border-gray-200 shadow-sm mb-8 rounded-lg" style={{ opacity: 0 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="brand-icon w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Quản lý bài kiểm tra</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {/* Top Actions */}
        <div ref={actionsRef} className="flex flex-col sm:flex-row justify-between items-center gap-4" style={{ opacity: 0 }}>
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm bài kiểm tra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-gray-200 focus:border-orange-400 focus:ring-orange-400 w-full"
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Select value={filterPremium} onValueChange={setFilterPremium}>
              <SelectTrigger className="w-full sm:w-40 h-10 border-gray-200">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả bài kiểm tra</SelectItem>
                <SelectItem value="premium">Premium Quizzes</SelectItem>
                <SelectItem value="free">Free Quizzes</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={(e) => {
                handleButtonClick(e.currentTarget)
                setTimeout(() => handleCreateNewQuiz(), 150)
              }}
              className={`h-10 px-4 text-white font-medium flex-shrink-0 ${
                user && userUtils.hasPremiumAccess(user) 
                  ? "bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500" 
                  : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600"
              }`}
            >
              {user && userUtils.hasPremiumAccess(user) ? (
                <>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Tạo bài kiểm tra mới
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Nâng cấp để tạo Quiz
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quizzes List/Table */}
        <Card ref={tableRef} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm" style={{ opacity: 0 }}>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Bài kiểm tra của bạn</CardTitle>
            <CardDescription className="text-gray-600">Xem, chỉnh sửa hoặc xóa các bài kiểm tra đã tạo.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredQuizzes.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-900">Tên bài kiểm tra</TableHead>
                      <TableHead className="font-semibold text-gray-900">Số câu hỏi</TableHead>
                      <TableHead className="font-semibold text-gray-900">Trạng thái</TableHead>
                      <TableHead className="font-semibold text-gray-900">Cập nhật lần cuối</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuizzes.map((quiz) => (
                      <TableRow 
                        key={quiz._id} 
                        data-quiz-id={quiz._id}
                        className="quiz-row hover:bg-gray-50"
                        onMouseEnter={(e) => handleRowHover(e.currentTarget, true)}
                        onMouseLeave={(e) => handleRowHover(e.currentTarget, false)}
                      >
                        <TableCell className="font-medium text-gray-800">{quiz.title}</TableCell>
                        <TableCell className="text-gray-700">{quiz.totalQuestions || 0}</TableCell>
                        <TableCell>
                          {quiz.is_premium ? (
                            <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Free
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-700 text-sm">
                          {(() => {
                            const dateValue = quiz.updatedAt || quiz.createdAt;
                            if (!dateValue) return 'N/A';
                            
                            try {
                              const date = new Date(dateValue);
                              if (isNaN(date.getTime())) return 'N/A';
                              return date.toLocaleDateString('vi-VN');
                            } catch (error) {
                              return 'N/A';
                            }
                          })()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              handleButtonClick(e.currentTarget)
                              setTimeout(() => handleEdit(quiz._id), 150)
                            }}
                            className="action-button h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              handleButtonClick(e.currentTarget)
                              setTimeout(() => handleDelete(quiz._id), 150)
                            }}
                            className="action-button h-8 px-3 text-red-500 border-red-200 hover:bg-red-50 bg-transparent"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Xóa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy quiz nào</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || filterPremium !== "all"
                    ? "Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."
                    : "Bắt đầu bằng cách tạo quiz đầu tiên của bạn!"}
                </p>
                <Button
                  onClick={(e) => {
                    handleButtonClick(e.currentTarget)
                    setTimeout(() => handleCreateNewQuiz(), 150)
                  }}
                  className={`text-white ${
                    user && userUtils.hasPremiumAccess(user)
                      ? "bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500"
                      : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600"
                  }`}
                >
                  {user && userUtils.hasPremiumAccess(user) ? (
                    <>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Tạo Quiz Mới
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Nâng Cấp Để Tạo Quiz
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}