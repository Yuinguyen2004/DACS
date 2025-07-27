"use client"

import { useState } from "react"
import { Search, Filter, BookOpen, Crown, Play, Lock, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock quiz data
const quizzes = [
  {
    id: 1,
    title: "Cơ bản về JavaScript",
    description: "Nắm vững những kiến thức cơ bản về lập trình JavaScript",
    questions: 25,
    duration: "30 phút",
    difficulty: "Người mới bắt đầu",
    category: "Lập trình",
    isPremium: false,
    participants: 1234,
    rating: 4.8,
  },
  {
    id: 2,
    title: "Các mẫu nâng cao trong React",
    description: "Khám phá sâu về hooks, context và tối ưu hiệu suất trong React",
    questions: 40,
    duration: "45 phút",
    difficulty: "Nâng cao",
    category: "Lập trình",
    isPremium: true,
    participants: 567,
    rating: 4.9,
  },
  {
    id: 3,
    title: "Thế giới Địa lý",
    description: "Kiểm tra kiến thức của bạn về các quốc gia, thủ đô và địa danh",
    questions: 50,
    duration: "35 phút",
    difficulty: "Trung cấp",
    category: "Địa lý",
    isPremium: false,
    participants: 2341,
    rating: 4.6,
  },
  {
    id: 4,
    title: "Kiến thức cơ bản về Machine Learning",
    description: "Giới thiệu các thuật toán và khái niệm cơ bản về học máy",
    questions: 30,
    duration: "40 phút",
    difficulty: "Trung cấp",
    category: "Công nghệ",
    isPremium: true,
    participants: 789,
    rating: 4.7,
  },
  {
    id: 5,
    title: "Ngữ pháp tiếng Anh",
    description: "Hoàn thiện kỹ năng ngữ pháp và ngôn ngữ của bạn",
    questions: 35,
    duration: "25 phút",
    difficulty: "Người mới bắt đầu",
    category: "Ngôn ngữ",
    isPremium: false,
    participants: 3456,
    rating: 4.5,
  },
  {
    id: 6,
    title: "Cấu trúc dữ liệu & Thuật toán",
    description: "Những kiến thức thiết yếu về khoa học máy tính cho phỏng vấn kỹ thuật",
    questions: 60,
    duration: "60 phút",
    difficulty: "Nâng cao",
    category: "Lập trình",
    isPremium: true,
    participants: 1123,
    rating: 4.9,
  },
]


export default function QuizHomepage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")

  const categories = ["all", "Lập trình", "Địa lý", "Công nghệ", "Ngôn ngữ"]
  const difficulties = ["all", "Người mới bắt đầu", "Trung cấp", "Nâng cao"]

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || quiz.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "all" || quiz.difficulty === selectedDifficulty

    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Chào mừng trở lại, Alex!</h2>
            <p className="text-gray-600">Sẵn sàng thử thách bản thân chưa? Chọn một bài quiz và bắt đầu học tập.</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Tìm kiếm bài quiz..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>
              <div className="flex gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40 h-12 border-gray-200">
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
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-40 h-12 border-gray-200">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty === "all" ? "All Levels" : difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quiz Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow duration-200 border-gray-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getDifficultyColor(quiz.difficulty)}>{quiz.difficulty}</Badge>
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
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">{quiz.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-600 line-clamp-2">{quiz.description}</CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        {quiz.questions} câu hỏi
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {quiz.duration}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {quiz.participants.toLocaleString()} đã làm
                      </div>
                      <div className="flex items-center">⭐ {quiz.rating}</div>
                    </div>
                  </div>

                  <Button
                    className={`w-full h-11 font-medium ${
                      quiz.isPremium
                        ? "bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                    disabled={quiz.isPremium}
                  >
                    {quiz.isPremium ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Upgrade to Access
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Quiz
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No results */}
          {filteredQuizzes.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
