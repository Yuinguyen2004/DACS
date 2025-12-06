"use client"

import { useState, useEffect, useRef, type ChangeEvent } from "react"
import { PlusCircle, Save, Trash2, Crown, Upload, FileWarning, ImageIcon, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useNavigate, useSearchParams } from "react-router-dom"
import { authAPI, userUtils, quizAPI, questionAPI, answerAPI } from "../../services/api"
import { type User, QuestionType } from "../../types/types"

interface QuestionWithImage {
  id: string
  text: string
  image?: string | File // Can be URL string or File object
  options: string[]
  correctAnswerIndex: number | null
  hasImage?: boolean // Toggle for image type
}

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswerIndex: number | null
}

// Helper function to parse questions from text (for .docx files)
const parseQuestionsFromText = (text: string): Question[] => {
  const questions: Question[] = []

  // Split text by question patterns - look for numbered questions
  const lines = text.split("\n").filter((line) => line.trim().length > 0)

  let currentQuestion: Partial<Question> | null = null
  let currentOptions: string[] = []
  let correctAnswerIndex: number | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Match question patterns: "1. Question text" or "Question 1: text"
    const questionMatch = line.match(/^(\d+)[.:)\s]+(.+)/) || line.match(/^Question\s+(\d+)[:\s]+(.+)/i)

    if (questionMatch) {
      // Save previous question if it exists
      if (currentQuestion && currentQuestion.text && currentOptions.length >= 2) {
        questions.push({
          id: `imp-${Date.now()}-${questions.length + 1}`,
          text: currentQuestion.text,
          options:
            currentOptions.length === 4
              ? currentOptions
              : [...currentOptions, ...Array(4 - currentOptions.length).fill("")],
          correctAnswerIndex,
        })
      }

      // Start new question
      currentQuestion = { text: questionMatch[2].trim() }
      currentOptions = []
      correctAnswerIndex = null
      continue
    }

    // Match option patterns: "A) option", "a. option", "1) option", etc.
    const optionMatch = line.match(/^[A-Da-d\d][.)\s]+(.+)/)

    if (optionMatch && currentQuestion) {
      currentOptions.push(optionMatch[1].trim())

      // Check if this line contains correct answer indicators
      if (line.includes("*") || line.includes("(correct)") || line.includes("[correct]")) {
        correctAnswerIndex = currentOptions.length - 1
      }
      continue
    }

    // Check for separate correct answer indicators
    const correctMatch =
      line.match(/correct\s*answer\s*:?\s*([A-Da-d\d])/i) ||
      line.match(/answer\s*:?\s*([A-Da-d\d])/i) ||
      line.match(/^([A-Da-d\d])\s*\*/) ||
      line.match(/\*\s*([A-Da-d\d])/)

    if (correctMatch && currentQuestion) {
      const answerChar = correctMatch[1].toUpperCase()
      if (answerChar >= "A" && answerChar <= "D") {
        correctAnswerIndex = answerChar.charCodeAt(0) - "A".charCodeAt(0)
      } else if (answerChar >= "1" && answerChar <= "4") {
        correctAnswerIndex = Number.parseInt(answerChar) - 1
      }
      continue
    }

    // If line doesn't match any pattern but we have a current question, it might be continuation
    if (currentQuestion && currentQuestion.text && !line.match(/^[A-Da-d\d][.)\s]/)) {
      currentQuestion.text += " " + line
    }
  }

  // Don't forget the last question
  if (currentQuestion && currentQuestion.text && currentOptions.length >= 2) {
    questions.push({
      id: `imp-${Date.now()}-${questions.length + 1}`,
      text: currentQuestion.text,
      options:
        currentOptions.length === 4
          ? currentOptions
          : [...currentOptions, ...Array(4 - currentOptions.length).fill("")],
      correctAnswerIndex,
    })
  }

  return questions
}

export default function CreateQuizPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const quizType = (searchParams.get("type") || "image") as "basic" | "image"

  const [user, setUser] = useState<User | null>(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [quizName, setQuizName] = useState("")
  const [quizImage, setQuizImage] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [timeLimit, setTimeLimit] = useState<number | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [questions, setQuestions] = useState<QuestionWithImage[]>([
    { id: "q1", text: "", options: ["", "", "", ""], correctAnswerIndex: null, hasImage: false },
  ])
  const [importError, setImportError] = useState<string | null>(null)
  const [isProcessingWithGemini, setIsProcessingWithGemini] = useState(false)
  const [editQuizId, setEditQuizId] = useState<string | null>(null)
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false)
  const [aiRequirements, setAiRequirements] = useState("")

  // Check authentication and premium access on mount
  useEffect(() => {
    const currentUser = authAPI.getCurrentUser()

    if (!currentUser) {
      console.log("[CREATE_QUIZ] No authenticated user found, redirecting to login")
      navigate("/")
      return
    }

    if (!userUtils.hasPremiumAccess(currentUser) && !userUtils.isAdmin(currentUser)) {
      console.log("[CREATE_QUIZ] User does not have premium access and is not admin, redirecting to upgrade")
      navigate("/upgrade")
      return
    }

    console.log("[CREATE_QUIZ] Premium user access confirmed:", currentUser.name)
    setUser(currentUser)
    setIsCheckingAccess(false)

    // Check if we're editing an existing quiz
    const urlParams = new URLSearchParams(window.location.search)
    const editId = urlParams.get("editId")
    if (editId) {
      console.log("[CREATE_QUIZ] Edit mode detected for quiz:", editId)
      setEditQuizId(editId)
      loadExistingQuiz(editId)
    }
  }, [navigate])

  // Load existing quiz data for editing
  const loadExistingQuiz = async (quizId: string) => {
    setIsLoadingQuiz(true)
    try {
      console.log("[CREATE_QUIZ] Loading quiz for editing:", quizId)

      // Get quiz details
      const quiz = await quizAPI.getQuizById(quizId)
      console.log("[CREATE_QUIZ] Quiz loaded:", quiz)

      // Get quiz questions
      const quizQuestions = await questionAPI.getQuizQuestions(quizId)
      console.log("[CREATE_QUIZ] Questions loaded:", quizQuestions)

      // Set quiz basic info
      setQuizName(quiz.title)
      setQuizImage(quiz.image || null)
      setIsPremium(quiz.is_premium)
      setTimeLimit(quiz.time_limit || null)

      // Convert questions to local format
      const formattedQuestions: QuestionWithImage[] = quizQuestions.map((q) => {
        console.log("[CREATE_QUIZ] Processing question:", q)
        console.log("[CREATE_QUIZ] Question answers:", q.answers)
        console.log("[CREATE_QUIZ] Question image:", q.image)

        return {
          id: `edit-${q._id}`,
          text: q.content,
          image: q.image || undefined,
          options: q.answers?.map((a) => a.content) || ["", "", "", ""],
          correctAnswerIndex: q.answers?.findIndex((a) => a.is_correct) ?? null,
          hasImage: !!q.image,
        }
      })

      console.log("[CREATE_QUIZ] Formatted questions with images:", formattedQuestions)

      if (formattedQuestions.length > 0) {
        setQuestions(formattedQuestions)
      }
    } catch (error) {
      console.error("[CREATE_QUIZ] Error loading quiz for editing:", error)
      alert("Không thể tải dữ liệu quiz để chỉnh sửa. Vui lòng thử lại.")
    } finally {
      setIsLoadingQuiz(false)
    }
  }

  // Show loading state while checking access or loading quiz
  if (isCheckingAccess || isLoadingQuiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isCheckingAccess ? "Đang kiểm tra quyền truy cập..." : "Đang tải dữ liệu quiz..."}
          </p>
        </div>
      </div>
    )
  }

  const addQuestion = () => {
    const newQuestion: QuestionWithImage = {
      id: `q${Date.now()}`,
      text: "",
      options: ["", "", "", ""],
      correctAnswerIndex: null,
      hasImage: quizType === "image" ? false : undefined,
    }
    if (quizType === "image" && questions.length === 0) {
      newQuestion.image = "https://example.com/sample-quiz-image.jpg"
      newQuestion.hasImage = true
    }
    setQuestions((prevQuestions) => [...prevQuestions, newQuestion])
  }

  const removeQuestion = (id: string) => {
    setQuestions((prevQuestions) => prevQuestions.filter((q) => q.id !== id))
  }

  const updateQuestionText = (id: string, newText: string) => {
    setQuestions((prevQuestions) => prevQuestions.map((q) => (q.id === id ? { ...q, text: newText } : q)))
  }

  const updateQuestionImage = (id: string, image: string | File | undefined) => {
    setQuestions((prevQuestions) => prevQuestions.map((q) => (q.id === id ? { ...q, image } : q)))
  }

  const toggleQuestionImage = (id: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === id
          ? {
            ...q,
            hasImage: !q.hasImage,
            image: !q.hasImage ? "https://example.com/sample-quiz-image.jpg" : undefined,
          }
          : q,
      ),
    )
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

  const handleGeminiProcessing = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImportError("No file selected.")
      return
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    if (fileExtension !== "docx") {
      setImportError("Only .docx files are supported for AI processing.")
      return
    }

    setImportError(null)
    setIsProcessingWithGemini(true)

    try {
      console.log("[GEMINI] Sending file to Gemini API for processing:", file.name)

      // Try Gemini API first, fall back to local processing if endpoint doesn't exist
      try {
        const result = await quizAPI.processDocxWithGemini(file, aiRequirements)

        if (result.questions && result.questions.length > 0) {
          const geminiQuestions: Question[] = result.questions.map((q, index) => ({
            id: `gemini-${Date.now()}-${index + 1}`,
            text: q.text,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex,
          }))

          setQuestions(geminiQuestions)
          alert(`🤖 Gemini successfully processed ${geminiQuestions.length} questions from ${file.name}!`)
          return
        }
      } catch (apiError: any) {
        console.log("[GEMINI] API not available, falling back to local processing:", apiError.message)

        // Fall back to local .docx parsing
        const mammoth = await import("mammoth")
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        const text = result.value

        console.log("[DEBUG] Extracted text from docx:", text.substring(0, 1000) + "...")

        const parsedQuestions = parseQuestionsFromText(text)

        console.log("[DEBUG] Parsed questions count:", parsedQuestions.length)
        console.log("[DEBUG] First few questions:", parsedQuestions.slice(0, 2))

        if (parsedQuestions.length === 0) {
          setImportError(
            `No questions found in the document. Please check the format. Extracted text preview: "${text.substring(0, 200)}..."`,
          )
          return
        }

        setQuestions(parsedQuestions)
        alert(`📄 Successfully parsed ${parsedQuestions.length} questions from ${file.name} (using local processing)`)
        return
      }

      setImportError("Gemini could not extract any questions from this document. Please check the file format.")
    } catch (error) {
      console.error("Error processing file:", error)
      setImportError(`Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsProcessingWithGemini(false)
    }

    // Clear the file input after processing
    event.target.value = ""
  }

  // Handle image upload with compression
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh (PNG, JPG, GIF, etc.)")
      return
    }

    // Check file size (max 2MB for original file)
    if (file.size > 2 * 1024 * 1024) {
      alert("Kích thước file không được vượt quá 2MB")
      return
    }

    // Create an image element to resize and compress
    const img = new Image()
    img.onload = () => {
      // Create canvas for image processing
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        alert("Không thể xử lý hình ảnh")
        return
      }

      // Calculate new dimensions (max 800x600, maintain aspect ratio)
      const maxWidth = 800
      const maxHeight = 600
      let { width, height } = img

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Set canvas size
      canvas.width = width
      canvas.height = height

      // Draw and compress the image
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to base64 with compression (0.8 quality for JPEG)
      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8)

      // Check final size (base64 encoded)
      const finalSize = Math.round((compressedDataUrl.length * 3) / 4) // Approximate base64 to bytes

      if (finalSize > 1024 * 1024) {
        // 1MB limit for final compressed image
        alert("Hình ảnh quá lớn sau khi nén. Vui lòng chọn hình ảnh nhỏ hơn.")
        return
      }

      setQuizImage(compressedDataUrl)
    }

    img.onerror = () => {
      alert("Không thể tải hình ảnh. Vui lòng thử file khác.")
    }

    // Load the image
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // Clear the input
    event.target.value = ""
  }

  // Remove image
  const handleRemoveImage = () => {
    setQuizImage(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ""
    }
  }

  const handleQuestionImageUpload = (questionId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh (PNG, JPG, GIF, etc.)")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      updateQuestionImage(questionId, imageData)
    }
    reader.readAsDataURL(file)
    event.target.value = ""
  }

  const handleQuestionImageUrl = (questionId: string, url: string) => {
    if (url.trim()) {
      updateQuestionImage(questionId, url)
    }
  }

  const removeQuestionImage = (questionId: string) => {
    updateQuestionImage(questionId, undefined)
  }

  const handleSaveQuiz = async () => {
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

    try {
      if (editQuizId) {
        // Edit existing quiz
        const updateData = {
          title: quizName,
          description: `Quiz được cập nhật bởi ${user?.name || "User"}`,
          image: quizImage || undefined,
          is_premium: isPremium,
          time_limit: timeLimit ?? undefined,
        }

        console.log("Updating quiz:", updateData)
        await quizAPI.updateQuiz(editQuizId, updateData)
        console.log("Quiz updated successfully")

        // For now, alert about limitations - full question editing would require more complex logic
        alert(`Quiz "${quizName}" đã được cập nhật thành công!

Lưu ý: Để chỉnh sửa câu hỏi, vui lòng tạo quiz mới.`)

        // Navigate back to manage quizzes
        navigate("/manage-quizzes")
      } else {
        // Create new quiz
        const quizData = {
          title: quizName,
          description: `Quiz tạo bởi ${user?.name || "User"}`,
          image: quizImage || undefined,
          is_premium: isPremium,
          time_limit: timeLimit ?? undefined,
        }

        console.log("Creating quiz:", quizData)
        const createdQuiz = await quizAPI.createQuiz(quizData)
        console.log("Quiz created successfully:", createdQuiz)

        // For mock purposes, log the form data as JSON
        const quizFormData = {
          quiz: quizData,
          questions: questions.map((q) => ({
            text: q.text,
            image: q.image instanceof File ? `[File: ${q.image.name}]` : q.image,
            hasImage: q.hasImage,
            options: {
              a: q.options[0],
              b: q.options[1],
              c: q.options[2],
              d: q.options[3],
            },
            correct: String.fromCharCode(97 + (q.correctAnswerIndex || 0)), // Convert to a/b/c/d
          })),
          type: quizType,
        }
        console.log("[CREATE_QUIZ] Complete form data with hybrid support:", JSON.stringify(quizFormData, null, 2))

        // Create questions and answers for the quiz
        for (const [index, question] of questions.entries()) {
          const questionData = {
            quiz_id: createdQuiz._id,
            content: question.text,
            type: QuestionType.MCQ,
            explanation: "", // You can add explanation input later if needed
            question_number: index + 1,
            image: typeof question.image === 'string' ? question.image : undefined,
          }

          console.log("Creating question:", questionData)
          const createdQuestion = await questionAPI.createQuestion(questionData)

          // Create answers for this question
          for (const [optIndex, option] of question.options.entries()) {
            const answerData = {
              question_id: createdQuestion._id,
              content: option,
              is_correct: optIndex === question.correctAnswerIndex,
            }

            console.log("Creating answer:", answerData)
            await answerAPI.createAnswer(answerData)
          }
        }

        alert(`Quiz "${quizName}" đã được tạo thành công với ${questions.length} câu hỏi!`)

        // Reset form
        setQuizName("")
        setQuizImage(null)
        setIsPremium(false)
        setTimeLimit(null)
        setQuestions([{ id: "q1", text: "", options: ["", "", "", ""], correctAnswerIndex: null, hasImage: false }])
      }
    } catch (error) {
      console.error("Error saving quiz:", error)
      alert(
        `Lỗi khi ${editQuizId ? "cập nhật" : "tạo"} quiz: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">



      <main className="max-w-4xl mx-auto space-y-8">
        {/* Quiz Details Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Thông tin bài kiểm tra</CardTitle>
            <CardDescription className="text-gray-600">
              Nhập thông tin cơ bản cho bài kiểm tra mới của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="quizName" className="text-sm font-medium text-gray-700">
                Tên bài kiểm tra
              </Label>
              <Input
                id="quizName"
                placeholder="Ví dụ: Cơ bản về JavaScript"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                className="h-11 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>

            {/* Quiz Image Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Hình ảnh bài kiểm tra (tùy chọn)</Label>
              <div className="flex items-start space-x-4">
                {/* Image Preview */}
                <div className="flex-1">
                  {quizImage ? (
                    <div className="relative">
                      <img
                        src={quizImage || "/placeholder.svg"}
                        alt="Quiz preview"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">Chưa có hình ảnh</p>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex flex-col space-y-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                    className="whitespace-nowrap"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Tải lên
                  </Button>
                  {quizImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Xóa
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Hỗ trợ: PNG, JPG, GIF. Kích thước tối đa: 2MB. Hình ảnh sẽ được tự động nén và thay đổi kích thước để
                tối ưu hiển thị.
              </p>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <Crown className="w-5 h-5 text-orange-500" />
                <Label htmlFor="isPremium" className="text-base font-medium text-gray-700">
                  Đánh dấu là bài kiểm tra Premium
                </Label>
              </div>
              <Switch
                id="isPremium"
                checked={isPremium}
                onCheckedChange={setIsPremium}
                className="data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-gray-300"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="timeLimit" className="text-sm font-medium text-gray-700">
                Thời gian làm bài (phút)
              </Label>
              <div className="flex items-center space-x-3">
                <Input
                  id="timeLimit"
                  type="number"
                  placeholder="Ví dụ: 30"
                  value={timeLimit || ""}
                  onChange={(e) => setTimeLimit(e.target.value ? Number.parseInt(e.target.value) : null)}
                  className="flex-1 h-11 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  min="1"
                  max="600"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">phút</span>
              </div>
              <p className="text-xs text-gray-500">
                Để trống nếu không muốn giới hạn thời gian. Thời gian tối đa: 600 phút (10 giờ)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI-Powered Import Section */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">🤖 Nhập câu hỏi từ tệp</CardTitle>
            <CardDescription className="text-gray-600">
              Sử dụng Gemini AI để tự động phân tích và tạo câu hỏi từ tài liệu .docx của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-requirements" className="text-sm font-medium text-gray-700">
                Yêu cầu cho AI (tùy chọn)
              </Label>
              <Textarea
                id="ai-requirements"
                placeholder="Ví dụ: Tạo 10 câu hỏi trắc nghiệm về lịch sử với độ khó từ cơ bản đến nâng cao. Đảm bảo mỗi câu hỏi có 4 đáp án và 1 đáp án đúng..."
                value={aiRequirements}
                onChange={(e) => setAiRequirements(e.target.value)}
                rows={3}
                className="border-gray-200 focus:border-purple-400 focus:ring-purple-400"
              />
              <p className="text-xs text-gray-500">
                Mô tả chi tiết yêu cầu của bạn để AI tạo ra những câu hỏi phù hợp nhất.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Label htmlFor="gemini-import" className="sr-only">
                AI Import
              </Label>
              <Input
                id="gemini-import"
                type="file"
                accept=".docx"
                onChange={handleGeminiProcessing}
                disabled={isProcessingWithGemini}
                className="flex-1 h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-400 file:text-purple-600 file:bg-purple-50 file:border-purple-200 file:hover:bg-purple-100"
              />
              <Button
                onClick={() => document.getElementById("gemini-import")?.click()}
                disabled={isProcessingWithGemini}
                className="h-11 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingWithGemini ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>✨ Phân tích bằng AI</>
                )}
              </Button>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="text-purple-600 mt-1">🎯</div>
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">AI sẽ tự động:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Phân tích nội dung tài liệu .docx</li>
                    <li>Trích xuất câu hỏi và đáp án</li>
                    <li>Tạo định dạng quiz chuẩn</li>
                    <li>Xác định đáp án đúng</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">Chỉ hỗ trợ: .docx • Được hỗ trợ bởi Google Gemini AI</p>
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
            <CardTitle className="text-2xl font-bold text-gray-900">Câu hỏi bài kiểm tra</CardTitle>
            <CardDescription className="text-gray-600">
              {quizType === "image"
                ? "Thêm câu hỏi với hình ảnh tùy chọn và các tùy chọn trả lời. Mỗi câu hỏi có thể có hình ảnh hoặc chỉ văn bản."
                : "Thêm câu hỏi và các tùy chọn trả lời trắc nghiệm. Chọn câu trả lời đúng cho mỗi câu hỏi."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {questions.length > 0 ? (
              questions.map((question, qIndex) => (
                <div key={question.id} className="space-y-6 p-6 border border-gray-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Câu hỏi {qIndex + 1}</h3>
                    {questions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </Button>
                    )}
                  </div>

                  {quizType === "image" && (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`image-toggle-${question.id}`} className="text-sm font-medium text-gray-700">
                          Thêm hình ảnh?
                        </Label>
                        <Switch
                          id={`image-toggle-${question.id}`}
                          checked={question.hasImage || false}
                          onCheckedChange={() => toggleQuestionImage(question.id)}
                          className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
                        />
                      </div>

                      {question.hasImage && (
                        <div className="space-y-3 mt-4">
                          <div className="flex gap-2">
                            <Input
                              type="url"
                              placeholder="Hoặc nhập URL hình ảnh..."
                              defaultValue={typeof question.image === "string" ? question.image : ""}
                              onChange={(e) => handleQuestionImageUrl(question.id, e.target.value)}
                              className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleQuestionImageUpload(question.id, e)}
                              className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 file:text-blue-600 file:bg-blue-50 file:border-blue-200"
                            />
                          </div>

                          {question.image && typeof question.image === "string" && (
                            <div className="relative">
                              <img
                                src={question.image || "/placeholder.svg"}
                                alt="Question preview"
                                className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                onError={(e) => {
                                  ; (e.target as HTMLImageElement).src = "/quiz-image.jpg"
                                }}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 h-6 w-6 p-0"
                                onClick={() => removeQuestionImage(question.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`question-text-${question.id}`} className="text-sm font-medium text-gray-700">
                      Nội dung câu hỏi
                    </Label>
                    <Textarea
                      id={`question-text-${question.id}`}
                      placeholder="Nhập nội dung câu hỏi ở đây..."
                      value={question.text}
                      onChange={(e) => updateQuestionText(question.id, e.target.value)}
                      rows={3}
                      className="border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Đáp án lựa chọn</Label>
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
                <p>
                  Chưa có câu hỏi nào được thêm. Bắt đầu bằng cách <strong>thêm một câu hỏi mới</strong> hoặc{" "}
                  <strong>nhập từ tệp</strong>.
                </p>
              </div>
            )}

            <Button
              onClick={addQuestion}
              variant="outline"
              className="w-full h-12 border-dashed border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Thêm câu hỏi mới
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveQuiz}
            className="h-12 px-8 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
          >
            <Save className="w-5 h-5 mr-3" />
            {editQuizId ? "Cập nhật Quiz" : "Lưu Quiz"}
          </Button>
        </div>
      </main>
    </div>
  )
}
