"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { BookOpen, Save, Trash2, Crown, Upload, FileWarning, ArrowLeft, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Link, useParams, useNavigate } from "react-router-dom"

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswerIndex: number | null
}

interface Quiz {
  id: string
  name: string
  isPremium: boolean
  questions: Question[]
  category: string
  lastUpdated: string
}

// Mock quiz data - in a real app, this would come from your backend
const mockQuizzes: Quiz[] = [
  {
    id: "quiz1",
    name: "JavaScript Fundamentals",
    isPremium: false,
    category: "Programming",
    lastUpdated: "2024-01-15",
    questions: [
      {
        id: "q1",
        text: "What is the correct way to declare a variable in JavaScript?",
        options: ["var myVariable = 5;", "variable myVariable = 5;", "v myVariable = 5;", "declare myVariable = 5;"],
        correctAnswerIndex: 0,
      },
      {
        id: "q2",
        text: "Which of the following is NOT a JavaScript data type?",
        options: ["String", "Boolean", "Float", "Number"],
        correctAnswerIndex: 2,
      },
    ],
  },
  {
    id: "quiz2",
    name: "Advanced React Patterns",
    isPremium: true,
    category: "Programming",
    lastUpdated: "2024-01-14",
    questions: [
      {
        id: "q1",
        text: "What is the purpose of React.memo()?",
        options: [
          "To memoize component props",
          "To prevent unnecessary re-renders",
          "To cache API responses",
          "To optimize state updates",
        ],
        correctAnswerIndex: 1,
      },
    ],
  },
]

export default function EditQuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizName, setQuizName] = useState("")
  const [isPremium, setIsPremium] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [importError, setImportError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load quiz data on component mount
  useEffect(() => {
    if (quizId) {
      // In a real app, you'd fetch from your API
      const foundQuiz = mockQuizzes.find((q) => q.id === quizId)
      if (foundQuiz) {
        setQuiz(foundQuiz)
        setQuizName(foundQuiz.name)
        setIsPremium(foundQuiz.isPremium)
        setQuestions(foundQuiz.questions)
      } else {
        // Quiz not found, redirect back to manage quizzes
        navigate("/manage")
      }
    }
    setIsLoading(false)
  }, [quizId, navigate])

  const addQuestion = () => {
    setQuestions((prevQuestions) => [
      ...prevQuestions,
      { id: `q${Date.now()}`, text: "", options: ["", "", "", ""], correctAnswerIndex: null },
    ])
  }

  const removeQuestion = (id: string) => {
    setQuestions((prevQuestions) => prevQuestions.filter((q) => q.id !== id))
  }

  const updateQuestionText = (id: string, newText: string) => {
    setQuestions((prevQuestions) => prevQuestions.map((q) => (q.id === id ? { ...q, text: newText } : q)))
  }

  const updateOptionText = (questionId: string, optionIndex: number, newText: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) => (idx === optionIndex ? newText : opt)),
            }
          : q,
      ),
    )
  }

  const updateCorrectAnswer = (questionId: string, optionIndex: number) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => (q.id === questionId ? { ...q, correctAnswerIndex: optionIndex } : q)),
    )
  }

  const handleFileImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImportError("No file selected.")
      return
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    setImportError(null)

    if (["docx", "xlsx", "csv"].includes(fileExtension || "")) {
      const importedMockQuestions: Question[] = [
        {
          id: `imp-${Date.now()}-1`,
          text: "What is the capital of France?",
          options: ["Berlin", "Madrid", "Paris", "Rome"],
          correctAnswerIndex: 2,
        },
        {
          id: `imp-${Date.now()}-2`,
          text: "Which planet is known as the Red Planet?",
          options: ["Earth", "Mars", "Jupiter", "Venus"],
          correctAnswerIndex: 1,
        },
      ]
      setQuestions((prev) => [...prev, ...importedMockQuestions])
      alert(`Successfully imported questions from ${file.name}!`)
    } else {
      setImportError("Unsupported file format. Please upload .docx, .xlsx, or .csv files.")
    }
    event.target.value = ""
  }

  const handleSaveQuiz = () => {
    // Basic validation
    if (!quizName.trim()) {
      alert("Please enter a quiz name.")
      return
    }
    if (
      questions.some((q) => !q.text.trim() || q.options.some((opt) => !opt.trim()) || q.correctAnswerIndex === null)
    ) {
      alert("Please fill in all question details and select a correct answer for each question.")
      return
    }

    const updatedQuizData = {
      id: quizId,
      name: quizName,
      isPremium: isPremium,
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctAnswer: q.options[q.correctAnswerIndex!],
      })),
      lastUpdated: new Date().toISOString().split("T")[0],
    }

    console.log("Updating Quiz:", updatedQuizData)
    alert("Quiz updated successfully! Check console for data.")

    // In a real app, you would send this data to your backend
    // After successful update, navigate back to manage quizzes
    navigate("/manage-quizzes")
  }

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
      navigate("/manage-quizzes")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Not Found</h2>
          <p className="text-gray-600 mb-6">The quiz you're looking for doesn't exist.</p>
          <Link to="/manage-quizzes">
            <Button className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white">
              Back to Manage Quizzes
            </Button>
          </Link>
        </div>
      </div>
    )
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
              <h1 className="text-lg font-semibold text-gray-900">Edit Quiz</h1>
            </div>
            <Link to="/manage-quizzes">
              <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Manage Quizzes</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        {/* Quiz Details Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Quiz Details</CardTitle>
            <CardDescription className="text-gray-600">Update the basic information for "{quiz.name}".</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="quizName" className="text-sm font-medium text-gray-700">
                Quiz Name
              </Label>
              <Input
                id="quizName"
                placeholder="e.g., JavaScript Fundamentals"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                className="h-11 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <Crown className="w-5 h-5 text-orange-500" />
                <Label htmlFor="isPremium" className="text-base font-medium text-gray-700">
                  Mark as Premium Quiz
                </Label>
              </div>
              <Switch
                id="isPremium"
                checked={isPremium}
                onCheckedChange={setIsPremium}
                className="data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-gray-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Import Questions Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Import Additional Questions</CardTitle>
            <CardDescription className="text-gray-600">
              Upload a file to add more questions to this quiz.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Label htmlFor="file-import" className="sr-only">
                Import File
              </Label>
              <Input
                id="file-import"
                type="file"
                accept=".docx,.xlsx,.csv"
                onChange={handleFileImport}
                className="flex-1 h-11 border-gray-200 focus:border-orange-400 focus:ring-orange-400 file:text-orange-600 file:bg-orange-50 file:border-orange-200 file:hover:bg-orange-100"
              />
              <Button
                onClick={() => document.getElementById("file-import")?.click()}
                className="h-11 px-6 bg-gray-900 hover:bg-gray-800 text-white font-medium flex-shrink-0"
              >
                <Upload className="w-5 h-5 mr-2" />
                Import Questions
              </Button>
            </div>
            <p className="text-sm text-gray-500">Supported formats: .docx, .xlsx, .csv</p>
            {importError && (
              <div className="flex items-center text-red-600 text-sm mt-2">
                <FileWarning className="w-4 h-4 mr-2" />
                {importError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Quiz Questions</CardTitle>
            <CardDescription className="text-gray-600">
              Edit existing questions or add new ones. Select the correct answer for each.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {questions.length > 0 ? (
              questions.map((question, qIndex) => (
                <div key={question.id} className="space-y-6 p-6 border border-gray-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Question {qIndex + 1}</h3>
                    {questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`question-text-${question.id}`} className="text-sm font-medium text-gray-700">
                      Question Text
                    </Label>
                    <Textarea
                      id={`question-text-${question.id}`}
                      placeholder="Enter your question here..."
                      value={question.text}
                      onChange={(e) => updateQuestionText(question.id, e.target.value)}
                      rows={3}
                      className="border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Answer Options</Label>
                    <RadioGroup
                      value={question.correctAnswerIndex !== null ? String(question.correctAnswerIndex) : undefined}
                      onValueChange={(value) => updateCorrectAnswer(question.id, Number.parseInt(value))}
                      className="space-y-3"
                    >
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-3">
                          <RadioGroupItem
                            value={String(oIndex)}
                            id={`option-${question.id}-${oIndex}`}
                            className="text-orange-500 focus:ring-orange-500"
                          />
                          <Label htmlFor={`option-${question.id}-${oIndex}`} className="flex-1">
                            <Input
                              placeholder={`Option ${oIndex + 1}`}
                              value={option}
                              onChange={(e) => updateOptionText(question.id, oIndex, e.target.value)}
                              className="h-10 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                            />
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  {qIndex < questions.length - 1 && <Separator className="mt-8" />}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p>No questions found. Add some questions to this quiz.</p>
              </div>
            )}

            <Button
              onClick={addQuestion}
              variant="outline"
              className="w-full h-12 border-dashed border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Add New Question
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="h-12 px-8 text-lg font-medium border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveQuiz}
            className="h-12 px-8 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
          >
            <Save className="w-5 h-5 mr-3" />
            Update Quiz
          </Button>
        </div>
      </main>
    </div>
  )
}
