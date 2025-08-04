"use client"

import { useState } from "react"
import { BookOpen, Calendar, Trophy, Eye, Filter, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock quiz history data
const quizHistory = [
  {
    id: 1,
    quizName: "Những kiến thức cơ bản về JavaScript",
    date: "2024-01-15",
    score: 8,
    totalQuestions: 10,
    timeSpent: "18:45",
    category: "Lập trình",
    difficulty: "Người mới bắt đầu",
  },
  {
    id: 2,
    quizName: "Các mẫu nâng cao trong React",
    date: "2024-01-14",
    score: 7,
    totalQuestions: 12,
    timeSpent: "25:30",
    category: "Lập trình",
    difficulty: "Nâng cao",
  },
  {
    id: 3,
    quizName: "Thế giới Địa lý",
    date: "2024-01-12",
    score: 15,
    totalQuestions: 20,
    timeSpent: "22:15",
    category: "Địa lý",
    difficulty: "Trung cấp",
  },
  {
    id: 4,
    quizName: "Những kiến thức cơ bản về JavaScript",
    date: "2024-01-10",
    score: 6,
    totalQuestions: 10,
    timeSpent: "21:30",
    category: "Lập trình",
    difficulty: "Người mới bắt đầu",
  },
  {
    id: 5,
    quizName: "Ngữ pháp tiếng Anh",
    date: "2024-01-08",
    score: 12,
    totalQuestions: 15,
    timeSpent: "16:45",
    category: "Ngôn ngữ",
    difficulty: "Người mới bắt đầu",
  },
  {
    id: 6,
    quizName: "Kiến thức cơ bản về Machine Learning",
    date: "2024-01-05",
    score: 9,
    totalQuestions: 14,
    timeSpent: "28:20",
    category: "Công nghệ",
    difficulty: "Trung cấp",
  },
  {
    id: 7,
    quizName: "Cấu trúc dữ liệu & Thuật toán",
    date: "2024-01-03",
    score: 11,
    totalQuestions: 18,
    timeSpent: "35:10",
    category: "Lập trình",
    difficulty: "Nâng cao",
  },
  {
    id: 8,
    quizName: "Thế giới Địa lý",
    date: "2024-01-01",
    score: 13,
    totalQuestions: 20,
    timeSpent: "19:45",
    category: "Địa lý",
    difficulty: "Trung cấp",
  },
]


export default function QuizHistory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  const categories = ["all", "Lập trình", "Địa lý", "Công nghệ", "Ngôn ngữ"]
  const sortOptions = [
    { value: "date", label: "Ngày (Mới nhất)" },
    { value: "score", label: "Điểm số (Cao nhất)" },
    { value: "name", label: "Tên bài quiz" },
  ]

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filteredAndSortedHistory = quizHistory
    .filter((quiz) => {
      const matchesSearch = quiz.quizName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || quiz.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "score":
          return b.score / b.totalQuestions - a.score / a.totalQuestions
        case "name":
          return a.quizName.localeCompare(b.quizName)
        default:
          return 0
      }
    })

  const totalQuizzes = quizHistory.length
  const averageScore = Math.round(
    quizHistory.reduce((sum, quiz) => sum + (quiz.score / quiz.totalQuestions) * 100, 0) / totalQuizzes,
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Quiz History</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalQuizzes}</p>
                  <p className="text-sm text-gray-600">Total Quizzes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {quizHistory.length > 0 ? formatDate(quizHistory[0].date) : "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">Last Quiz</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Your Quiz Attempts</CardTitle>
            <CardDescription>Track your progress and review past performance</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAndSortedHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-gray-900">Quiz Name</TableHead>
                      <TableHead className="font-semibold text-gray-900">Date</TableHead>
                      <TableHead className="font-semibold text-gray-900">Score</TableHead>
                      <TableHead className="font-semibold text-gray-900">Time</TableHead>
                      <TableHead className="font-semibold text-gray-900">Category</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedHistory.map((quiz) => (
                      <TableRow key={`${quiz.id}-${quiz.date}`} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{getScoreIcon(quiz.score, quiz.totalQuestions)}</span>
                            <div>
                              <p className="font-medium text-gray-900">{quiz.quizName}</p>
                              <p className="text-sm text-gray-500">{quiz.difficulty}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{formatDate(quiz.date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getScoreColor(quiz.score, quiz.totalQuestions)} border-0`}>
                            {quiz.score}/{quiz.totalQuestions} ({Math.round((quiz.score / quiz.totalQuestions) * 100)}%)
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-700 font-mono text-sm">{quiz.timeSpent}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-gray-600">
                            {quiz.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-orange-600 border-orange-200 hover:bg-orange-50 bg-transparent"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Xem chi tiết
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quiz history found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || selectedCategory !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Take your first quiz to see your history here."}
                </p>
                <Button className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Quizzes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
