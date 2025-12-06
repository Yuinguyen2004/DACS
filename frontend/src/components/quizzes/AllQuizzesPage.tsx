"use client"

import { useState, useEffect } from "react"
import { Search, Filter, BookOpen, Crown, Play, Clock, Users, Loader2, AlertCircle, TrendingUp, Gift, SortAsc, Calendar, ThumbsUp, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNavigate } from "react-router-dom"
import { quizAPI } from "../../services/api"
import { QuizWithDetails } from "../../types/types"

export default function AllQuizzesPage() {
  const navigate = useNavigate()

  // State
  const [quizzes, setQuizzes] = useState<QuizWithDetails[]>([])
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "hot" | "premium" | "free">("all")
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "rating" | "difficulty">("popular")

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const quizzesData = await quizAPI.getAllQuizzes()
        setQuizzes(quizzesData)
        setFilteredQuizzes(quizzesData)
      } catch (error: any) {
        console.error('Failed to load quizzes:', error)
        if (error.response?.status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang.")
        } else {
          setError("Không thể tải danh sách quiz. Vui lòng thử lại sau.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

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
        break
    }

    // Sort
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => (b.totalAttempts || 0) - (a.totalAttempts || 0))
        break
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
        break
      case "rating":
        filtered.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
        break
      case "difficulty":
        filtered.sort((a, b) => (a.totalQuestions || 0) - (b.totalQuestions || 0))
        break
    }

    setFilteredQuizzes(filtered)
  }, [searchTerm, filterType, sortBy, quizzes])

  const handleQuizClick = (quizId: string) => {
    navigate(`/test?quizId=${quizId}`)
  }

  const formatDuration = (timeLimit?: number): string => {
    if (!timeLimit) return "Không giới hạn"
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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/homepage')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tất cả Quiz</h1>
          <p className="text-gray-600">Khám phá {quizzes.length} quiz có sẵn</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm quiz..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg border-0 bg-white shadow-sm rounded-xl"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                className="rounded-full px-6 py-2"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Tất cả
              </Button>
              <Button
                variant={filterType === "hot" ? "default" : "outline"}
                onClick={() => setFilterType("hot")}
                className="rounded-full px-6 py-2 bg-red-500 hover:bg-red-600 text-white border-red-500"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Hot
              </Button>
              <Button
                variant={filterType === "premium" ? "default" : "outline"}
                onClick={() => setFilterType("premium")}
                className="rounded-full px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
              >
                <Crown className="w-4 h-4 mr-2" />
                Premium
              </Button>
              <Button
                variant={filterType === "free" ? "default" : "outline"}
                onClick={() => setFilterType("free")}
                className="rounded-full px-6 py-2 bg-green-500 hover:bg-green-600 text-white border-green-500"
              >
                <Gift className="w-4 h-4 mr-2" />
                Miễn phí
              </Button>
            </div>

            <div className="flex gap-2 ml-auto">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
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
                      <TrendingUp className="w-4 h-4 mr-2" />
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

        {/* Results count */}
        <div className="mb-4 text-gray-600">
          Hiển thị {filteredQuizzes.length} / {quizzes.length} quiz
        </div>

        {/* Quiz Grid */}
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
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Xóa bộ lọc
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredQuizzes.map((quiz) => (
              <Card
                key={quiz._id}
                className="group cursor-pointer border-0 bg-white shadow-md rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow"
                onClick={() => handleQuizClick(quiz._id)}
              >
                {/* Quiz Image */}
                <div className="h-32 relative overflow-hidden">
                  {quiz.image ? (
                    <img
                      src={quiz.image}
                      alt={quiz.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
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

                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg mt-auto"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleQuizClick(quiz._id)
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
      </div>
    </div>
  )
}
