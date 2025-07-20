"use client"

import { useState } from "react"
import { Search, Filter, BookOpen, User, Crown, Play, Lock, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock quiz data
const quizzes = [
  {
    id: 1,
    title: "JavaScript Fundamentals",
    description: "Master the basics of JavaScript programming",
    questions: 25,
    duration: "30 min",
    difficulty: "Beginner",
    category: "Programming",
    isPremium: false,
    participants: 1234,
    rating: 4.8,
  },
  {
    id: 2,
    title: "Advanced React Patterns",
    description: "Deep dive into React hooks, context, and performance",
    questions: 40,
    duration: "45 min",
    difficulty: "Advanced",
    category: "Programming",
    isPremium: true,
    participants: 567,
    rating: 4.9,
  },
  {
    id: 3,
    title: "World Geography",
    description: "Test your knowledge of countries, capitals, and landmarks",
    questions: 50,
    duration: "35 min",
    difficulty: "Intermediate",
    category: "Geography",
    isPremium: false,
    participants: 2341,
    rating: 4.6,
  },
  {
    id: 4,
    title: "Machine Learning Basics",
    description: "Introduction to ML algorithms and concepts",
    questions: 30,
    duration: "40 min",
    difficulty: "Intermediate",
    category: "Technology",
    isPremium: true,
    participants: 789,
    rating: 4.7,
  },
  {
    id: 5,
    title: "English Grammar",
    description: "Perfect your grammar and language skills",
    questions: 35,
    duration: "25 min",
    difficulty: "Beginner",
    category: "Language",
    isPremium: false,
    participants: 3456,
    rating: 4.5,
  },
  {
    id: 6,
    title: "Data Structures & Algorithms",
    description: "Essential CS concepts for technical interviews",
    questions: 60,
    duration: "60 min",
    difficulty: "Advanced",
    category: "Programming",
    isPremium: true,
    participants: 1123,
    rating: 4.9,
  },
]

export default function QuizHomepage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")

  const categories = ["all", "Programming", "Geography", "Technology", "Language"]
  const difficulties = ["all", "Beginner", "Intermediate", "Advanced"]

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
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">QuizMaster</h1>
                <p className="text-xs text-gray-500">Practice & Learn</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <Button className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-medium">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Premium
              </Button>
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white">
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Alex!</h2>
            <p className="text-gray-600">Ready to challenge yourself? Choose a quiz and start learning.</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search quizzes..."
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
                        {category === "all" ? "All Categories" : category}
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
                        {quiz.questions} questions
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {quiz.duration}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {quiz.participants.toLocaleString()} taken
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
