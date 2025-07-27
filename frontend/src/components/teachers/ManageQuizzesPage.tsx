"use client"

import { useState } from "react"
import { BookOpen, PlusCircle, Edit, Trash2, Crown, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock quiz data for management
const mockQuizzes = [
  {
    id: "quiz1",
    name: "JavaScript Fundamentals",
    questions: 10,
    isPremium: false,
    category: "Programming",
    lastUpdated: "2024-01-15",
  },
  {
    id: "quiz2",
    name: "Advanced React Patterns",
    questions: 12,
    isPremium: true,
    category: "Programming",
    lastUpdated: "2024-01-14",
  },
  {
    id: "quiz3",
    name: "World Geography Basics",
    questions: 20,
    isPremium: false,
    category: "Geography",
    lastUpdated: "2024-01-12",
  },
  {
    id: "quiz4",
    name: "Machine Learning Intro",
    questions: 14,
    isPremium: true,
    category: "Technology",
    lastUpdated: "2024-01-05",
  },
  {
    id: "quiz5",
    name: "English Grammar Essentials",
    questions: 15,
    isPremium: false,
    category: "Language",
    lastUpdated: "2024-01-08",
  },
]

export default function ManageQuizzesPage() {
  const [quizzes, setQuizzes] = useState(mockQuizzes)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPremium, setFilterPremium] = useState("all") // 'all', 'premium', 'free'

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPremiumFilter =
      filterPremium === "all" ||
      (filterPremium === "premium" && quiz.isPremium) ||
      (filterPremium === "free" && !quiz.isPremium)
    return matchesSearch && matchesPremiumFilter
  })

  const handleEdit = (quizId: string) => {
    console.log(`Editing quiz with ID: ${quizId}`)
    // In a real app, you would navigate to the create-quiz page with quiz data
    alert(`Navigating to edit quiz: ${quizId}`)
  }

  const handleDelete = (quizId: string) => {
    if (confirm("Are you sure you want to delete this quiz?")) {
      setQuizzes((prevQuizzes) => prevQuizzes.filter((quiz) => quiz.id !== quizId))
      console.log(`Deleted quiz with ID: ${quizId}`)
    }
  }

  const handleCreateNewQuiz = () => {
    console.log("Navigating to create new quiz page")
    // In a real app, you would navigate to the create-quiz page
    alert("Navigating to create new quiz.")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm mb-8 rounded-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Quản lý bài kiểm tra</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {/* Top Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
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
              onClick={handleCreateNewQuiz}
              className="h-10 px-4 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-medium flex-shrink-0"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Tạo bài kiểm tra mới
            </Button>
          </div>
        </div>

        {/* Quizzes List/Table */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
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
                      <TableRow key={quiz.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-800">{quiz.name}</TableCell>
                        <TableCell className="text-gray-700">{quiz.questions}</TableCell>
                        <TableCell>
                          {quiz.isPremium ? (
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
                        <TableCell className="text-gray-700 text-sm">{quiz.lastUpdated}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(quiz.id)}
                            className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(quiz.id)}
                            className="h-8 px-3 text-red-500 border-red-200 hover:bg-red-50 bg-transparent"
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || filterPremium !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Start by creating your first quiz!"}
                </p>
                <Button
                  onClick={handleCreateNewQuiz}
                  className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create New Quiz
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
