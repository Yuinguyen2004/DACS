"use client"

import { useState, useEffect, useRef, type ChangeEvent } from "react"
import { BookOpen, PlusCircle, Save, Trash2, Crown, Upload, FileWarning, ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useNavigate } from "react-router-dom"
import { authAPI, userUtils, quizAPI, questionAPI, answerAPI } from "../../services/api"
import { User } from "../../types/types"

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswerIndex: number | null // Index of the correct option (0-3)
}

// Helper function to parse questions from text (for .docx files)
const parseQuestionsFromText = (text: string): Question[] => {
  const questions: Question[] = []
  
  // Split text by question patterns - look for numbered questions
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  let currentQuestion: Partial<Question> | null = null
  let currentOptions: string[] = []
  let correctAnswerIndex: number | null = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Match question patterns: "1. Question text" or "Question 1: text"
    const questionMatch = line.match(/^(\d+)[\.\:\)\s]+(.+)/) || line.match(/^Question\s+(\d+)[\:\s]+(.+)/i)
    
    if (questionMatch) {
      // Save previous question if it exists
      if (currentQuestion && currentQuestion.text && currentOptions.length >= 2) {
        questions.push({
          id: `imp-${Date.now()}-${questions.length + 1}`,
          text: currentQuestion.text,
          options: currentOptions.length === 4 ? currentOptions : [...currentOptions, ...Array(4 - currentOptions.length).fill("")],
          correctAnswerIndex
        })
      }
      
      // Start new question
      currentQuestion = { text: questionMatch[2].trim() }
      currentOptions = []
      correctAnswerIndex = null
      continue
    }
    
    // Match option patterns: "A) option", "a. option", "1) option", etc.
    const optionMatch = line.match(/^[A-Da-d\d][\.\)\s]+(.+)/) 
    
    if (optionMatch && currentQuestion) {
      currentOptions.push(optionMatch[1].trim())
      
      // Check if this line contains correct answer indicators
      if (line.includes('*') || line.includes('(correct)') || line.includes('[correct]')) {
        correctAnswerIndex = currentOptions.length - 1
      }
      continue
    }
    
    // Check for separate correct answer indicators
    const correctMatch = line.match(/correct\s*answer\s*:?\s*([A-Da-d\d])/i) || 
                        line.match(/answer\s*:?\s*([A-Da-d\d])/i) ||
                        line.match(/^([A-Da-d\d])\s*\*/) ||
                        line.match(/\*\s*([A-Da-d\d])/)
    
    if (correctMatch && currentQuestion) {
      const answerChar = correctMatch[1].toUpperCase()
      if (answerChar >= 'A' && answerChar <= 'D') {
        correctAnswerIndex = answerChar.charCodeAt(0) - 'A'.charCodeAt(0)
      } else if (answerChar >= '1' && answerChar <= '4') {
        correctAnswerIndex = parseInt(answerChar) - 1
      }
      continue
    }
    
    // If line doesn't match any pattern but we have a current question, it might be continuation
    if (currentQuestion && currentQuestion.text && !line.match(/^[A-Da-d\d][\.\)\s]/)) {
      currentQuestion.text += ' ' + line
    }
  }
  
  // Don't forget the last question
  if (currentQuestion && currentQuestion.text && currentOptions.length >= 2) {
    questions.push({
      id: `imp-${Date.now()}-${questions.length + 1}`,
      text: currentQuestion.text,
      options: currentOptions.length === 4 ? currentOptions : [...currentOptions, ...Array(4 - currentOptions.length).fill("")],
      correctAnswerIndex
    })
  }
  
  return questions
}

// Helper function to parse questions from CSV
const parseQuestionsFromCSV = (csvText: string): Question[] => {
  const questions: Question[] = []
  const lines = csvText.split('\n').filter(line => line.trim().length > 0)
  
  // Skip header row if it exists
  const startIndex = lines[0].toLowerCase().includes('question') ? 1 : 0
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Parse CSV line (simple comma splitting - for more complex CSV, use a proper CSV parser)
    const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''))
    
    if (columns.length >= 6) {
      // Expected format: Question, Option1, Option2, Option3, Option4, CorrectAnswer
      const [questionText, opt1, opt2, opt3, opt4, correctAnswer] = columns
      
      let correctAnswerIndex: number | null = null
      const options = [opt1, opt2, opt3, opt4]
      
      // Find correct answer index
      if (correctAnswer) {
        const correctAnswerUpper = correctAnswer.toUpperCase()
        if (correctAnswerUpper >= 'A' && correctAnswerUpper <= 'D') {
          correctAnswerIndex = correctAnswerUpper.charCodeAt(0) - 'A'.charCodeAt(0)
        } else if (correctAnswerUpper >= '1' && correctAnswerUpper <= '4') {
          correctAnswerIndex = parseInt(correctAnswerUpper) - 1
        } else {
          // Try to match by content
          correctAnswerIndex = options.findIndex(opt => 
            opt.toLowerCase() === correctAnswer.toLowerCase()
          )
        }
      }
      
      questions.push({
        id: `csv-${Date.now()}-${questions.length + 1}`,
        text: questionText,
        options,
        correctAnswerIndex: correctAnswerIndex !== -1 ? correctAnswerIndex : null
      })
    }
  }
  
  return questions
}

export default function CreateQuizPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [quizName, setQuizName] = useState("")
  const [quizImage, setQuizImage] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [timeLimit, setTimeLimit] = useState<number | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [questions, setQuestions] = useState<Question[]>([
    { id: "q1", text: "", options: ["", "", "", ""], correctAnswerIndex: null },
  ])
  const [importError, setImportError] = useState<string | null>(null)
  const [isProcessingWithGemini, setIsProcessingWithGemini] = useState(false)
  const [editQuizId, setEditQuizId] = useState<string | null>(null)
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false)
  const [desiredQuestionCount, setDesiredQuestionCount] = useState<number | null>(null)

  // Check authentication and premium access on mount
  useEffect(() => {
    const currentUser = authAPI.getCurrentUser()
    
    if (!currentUser) {
      console.log('[CREATE_QUIZ] No authenticated user found, redirecting to login')
      navigate('/')
      return
    }

    if (!userUtils.hasPremiumAccess(currentUser)) {
      console.log('[CREATE_QUIZ] User does not have premium access, redirecting to upgrade')
      navigate('/upgrade')
      return
    }

    console.log('[CREATE_QUIZ] Premium user access confirmed:', currentUser.name)
    setUser(currentUser)
    setIsCheckingAccess(false)

    // Check if we're editing an existing quiz
    const urlParams = new URLSearchParams(window.location.search)
    const editId = urlParams.get('editId')
    if (editId) {
      console.log('[CREATE_QUIZ] Edit mode detected for quiz:', editId)
      setEditQuizId(editId)
      loadExistingQuiz(editId)
    }
  }, [navigate])

  // Load existing quiz data for editing
  const loadExistingQuiz = async (quizId: string) => {
    setIsLoadingQuiz(true)
    try {
      console.log('[CREATE_QUIZ] Loading quiz for editing:', quizId)
      
      // Get quiz details
      const quiz = await quizAPI.getQuizById(quizId)
      console.log('[CREATE_QUIZ] Quiz loaded:', quiz)
      
      // Get quiz questions
      const quizQuestions = await questionAPI.getQuizQuestions(quizId)
      console.log('[CREATE_QUIZ] Questions loaded:', quizQuestions)
      
      // Set quiz basic info
      setQuizName(quiz.title)
      setQuizImage(quiz.image || null)
      setIsPremium(quiz.is_premium)
      setTimeLimit(quiz.time_limit || null)
      
      // Convert questions to local format
      const formattedQuestions: Question[] = quizQuestions.map((q, index) => {
        console.log('[CREATE_QUIZ] Processing question:', q)
        console.log('[CREATE_QUIZ] Question answers:', q.answers)
        
        return {
          id: `edit-${q._id}`,
          text: q.content,
          options: q.answers?.map(a => a.content) || ["", "", "", ""],
          correctAnswerIndex: q.answers?.findIndex(a => a.is_correct) ?? null
        }
      })
      
      if (formattedQuestions.length > 0) {
        setQuestions(formattedQuestions)
      }
      
    } catch (error) {
      console.error('[CREATE_QUIZ] Error loading quiz for editing:', error)
      alert('Không thể tải dữ liệu quiz để chỉnh sửa. Vui lòng thử lại.')
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
            {isCheckingAccess ? 'Đang kiểm tra quyền truy cập...' : 'Đang tải dữ liệu quiz...'}
          </p>
        </div>
      </div>
    )
  }

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

  const handleFileImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImportError("No file selected.")
      return
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    setImportError(null) // Clear previous errors

    try {
      if (fileExtension === "docx") {
        // Import mammoth for .docx parsing
        const mammoth = await import('mammoth')
        
        // Read the .docx file
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        const text = result.value

        // Parse the text to extract questions
        const parsedQuestions = parseQuestionsFromText(text)
        
        if (parsedQuestions.length === 0) {
          setImportError("No questions found in the document. Please check the format.")
          return
        }

        // Replace all questions (including the default empty one) with imported questions
        setQuestions(parsedQuestions)
        alert(`Successfully imported ${parsedQuestions.length} questions from ${file.name}!`)
        
      } else if (fileExtension === "csv") {
        // Handle CSV files
        const text = await file.text()
        const parsedQuestions = parseQuestionsFromCSV(text)
        
        if (parsedQuestions.length === 0) {
          setImportError("No questions found in the CSV file. Please check the format.")
          return
        }

        setQuestions(parsedQuestions)
        alert(`Successfully imported ${parsedQuestions.length} questions from ${file.name}!`)
        
      } else if (fileExtension === "xlsx") {
        setImportError("Excel (.xlsx) import is not yet implemented. Please use .docx or .csv files.")
      } else {
        setImportError("Unsupported file format. Please upload .docx or .csv files.")
      }
    } catch (error) {
      console.error("Error importing file:", error)
      setImportError(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    // Clear the file input after processing
    event.target.value = ""
  }

  const handleGeminiProcessing = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImportError("Không có file nào được chọn.")
      return
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    
    // Accept both .docx and .pdf
    if (!['docx', 'pdf'].includes(fileExtension || '')) {
      setImportError("Chỉ hỗ trợ file .docx hoặc .pdf cho xử lý AI.")
      return
    }

    // Validate file type by MIME
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf'
    ]
    
    if (!allowedMimeTypes.includes(file.type)) {
      setImportError("Loại file không được hỗ trợ. Vui lòng chọn file .docx hoặc .pdf hợp lệ.")
      return
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setImportError("File quá lớn. Kích thước tối đa là 5MB.")
      return
    }

    // Validate question count if provided
    if (desiredQuestionCount !== null && (desiredQuestionCount < 5 || desiredQuestionCount > 100)) {
      setImportError("Số lượng câu hỏi phải nằm trong khoảng 5-100.")
      return
    }

    setImportError(null)
    setIsProcessingWithGemini(true)

    try {
      console.log('[GEMINI] Processing file with AI:', {
        name: file.name,
        type: file.type,
        size: file.size,
        desiredQuestionCount
      })
      
      const result = await quizAPI.processFileWithGemini(file, desiredQuestionCount || undefined)
      
      if (result.questions && result.questions.length > 0) {
        const geminiQuestions: Question[] = result.questions.map((q, index) => ({
          id: `gemini-${Date.now()}-${index + 1}`,
          text: q.text,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex
        }))

        setQuestions(geminiQuestions)
        
        // Note: AI can provide title and description in result.title and result.description
        // but current form doesn't have separate inputs for them
        // User can use AI-generated title as reference and enter manually
        if (result.title) {
          console.log('[GEMINI] AI suggested title:', result.title)
        }
        if (result.description) {
          console.log('[GEMINI] AI suggested description:', result.description)
        }
        
        const fileType = file.name.endsWith('.pdf') ? 'PDF' : 'Word'
        let successMessage = `🤖 AI đã xử lý thành công ${geminiQuestions.length} câu hỏi từ file ${fileType}!`
        
        // Show warning if fewer questions than requested
        if (result.requestedCount && result.actualCount && result.actualCount < result.requestedCount) {
          successMessage += `\n⚠️ Lưu ý: Bạn yêu cầu ${result.requestedCount} câu hỏi nhưng chỉ có thể tạo ${result.actualCount} câu từ nội dung file.`
        }
        
        alert(successMessage)
      } else {
        setImportError("AI không tìm thấy câu hỏi nào trong file. Vui lòng kiểm tra nội dung.")
      }
    } catch (error: any) {
      console.error('[GEMINI] Processing error:', error)
      
      let errorMessage = 'Xử lý file thất bại. '
      
      if (error.response?.status === 413) {
        errorMessage = 'File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.'
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'File không hợp lệ hoặc không thể đọc.'
      } else if (error.response?.status === 403) {
        errorMessage = 'Bạn cần nâng cấp gói premium để sử dụng tính năng này.'
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi xử lý AI. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.'
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += 'Lỗi không xác định. Vui lòng thử lại.'
      }
      
      setImportError(errorMessage)
    } finally {
      setIsProcessingWithGemini(false)
      event.target.value = "" // Clear input
    }
  }

  // Handle image upload with compression
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (PNG, JPG, GIF, etc.)')
      return
    }

    // Check file size (max 2MB for original file)
    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 2MB')
      return
    }

    // Create an image element to resize and compress
    const img = new Image()
    img.onload = () => {
      // Create canvas for image processing
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        alert('Không thể xử lý hình ảnh')
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
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
      
      // Check final size (base64 encoded)
      const finalSize = Math.round((compressedDataUrl.length * 3) / 4) // Approximate base64 to bytes
      
      if (finalSize > 1024 * 1024) { // 1MB limit for final compressed image
        alert('Hình ảnh quá lớn sau khi nén. Vui lòng chọn hình ảnh nhỏ hơn.')
        return
      }

      setQuizImage(compressedDataUrl)
    }

    img.onerror = () => {
      alert('Không thể tải hình ảnh. Vui lòng thử file khác.')
    }

    // Load the image
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // Clear the input
    event.target.value = ''
  }

  // Remove image
  const handleRemoveImage = () => {
    setQuizImage(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
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
          description: `Quiz được cập nhật bởi ${user?.name || 'User'}`,
          image: quizImage,
          is_premium: isPremium,
          time_limit: timeLimit
        }

        console.log("Updating quiz:", updateData)
        await quizAPI.updateQuiz(editQuizId, updateData)
        console.log("Quiz updated successfully")

        // For now, alert about limitations - full question editing would require more complex logic
        alert(`Quiz "${quizName}" đã được cập nhật thành công!

Lưu ý: Để chỉnh sửa câu hỏi, vui lòng tạo quiz mới.`)
        
        // Navigate back to manage quizzes
        navigate('/manage-quizzes')
        
      } else {
        // Create new quiz
        const quizData = {
          title: quizName,
          description: `Quiz tạo bởi ${user?.name || 'User'}`,
          image: quizImage,
          is_premium: isPremium,
          time_limit: timeLimit
        }

        console.log("Creating quiz:", quizData)
        const createdQuiz = await quizAPI.createQuiz(quizData)
        console.log("Quiz created successfully:", createdQuiz)

        // Create questions and answers for the quiz
        for (const [index, question] of questions.entries()) {
          const questionData = {
            quiz_id: createdQuiz._id,
            content: question.text,
            type: 'mcq' as const,
            explanation: '', // You can add explanation input later if needed
            question_number: index + 1
          }

          console.log("Creating question:", questionData)
          const createdQuestion = await questionAPI.createQuestion(questionData)

          // Create answers for this question
          for (const [optIndex, option] of question.options.entries()) {
            const answerData = {
              question_id: createdQuestion._id,
              content: option,
              is_correct: optIndex === question.correctAnswerIndex
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
        setQuestions([{ id: "q1", text: "", options: ["", "", "", ""], correctAnswerIndex: null }])
      }
      
    } catch (error) {
      console.error('Error saving quiz:', error)
      alert(`Lỗi khi ${editQuizId ? 'cập nhật' : 'tạo'} quiz: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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
              <h1 className="text-lg font-semibold text-gray-900">
                {editQuizId ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        {/* Quiz Details Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Thông tin bài kiểm tra</CardTitle>
            <CardDescription className="text-gray-600">Nhập thông tin cơ bản cho bài kiểm tra mới của bạn.</CardDescription>
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
              <Label className="text-sm font-medium text-gray-700">
                Hình ảnh bài kiểm tra (tùy chọn)
              </Label>
              <div className="flex items-start space-x-4">
                {/* Image Preview */}
                <div className="flex-1">
                  {quizImage ? (
                    <div className="relative">
                      <img
                        src={quizImage}
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Xóa
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Hỗ trợ: PNG, JPG, GIF. Kích thước tối đa: 2MB. Hình ảnh sẽ được tự động nén và thay đổi kích thước để tối ưu hiển thị.
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
                  onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
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
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
              🤖 Nhập câu hỏi từ tệp
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sử dụng Gemini AI để tự động phân tích và tạo câu hỏi từ tài liệu .docx của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Question Count Control */}
            <div className="space-y-2">
              <Label htmlFor="question-count" className="text-sm font-medium text-gray-700">
                Số lượng câu hỏi mong muốn (tùy chọn)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="question-count"
                  type="number"
                  min="5"
                  max="100"
                  placeholder="Để trống = Tự động"
                  value={desiredQuestionCount || ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : null
                    setDesiredQuestionCount(value)
                  }}
                  disabled={isProcessingWithGemini}
                  className="w-32 h-10 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                />
                <span className="text-sm text-gray-500">
                  {desiredQuestionCount 
                    ? `${desiredQuestionCount} câu hỏi` 
                    : "Tự động (AI quyết định)"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Nhập số từ 5-100, hoặc để trống để AI tự chọn số lượng phù hợp
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Label htmlFor="gemini-import" className="sr-only">
                AI Import
              </Label>
              <Input
                id="gemini-import"
                type="file"
                accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
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
                  <>
                    ✨ Phân tích bằng AI
                  </>
                )}
              </Button>
            </div>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="text-purple-600 mt-1">🎯</div>
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">AI sẽ tự động:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Phân tích nội dung tài liệu Word (.docx) hoặc PDF</li>
                    <li>Trích xuất câu hỏi và đáp án</li>
                    <li>Tạo lựa chọn cho câu hỏi nếu chưa có</li>
                    <li>Tạo định dạng quiz chuẩn với giải thích</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Hỗ trợ: .docx, .pdf (tối đa 5MB) • Được hỗ trợ bởi Google Gemini AI
            </p>
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
              Thêm câu hỏi và các tùy chọn trả lời trắc nghiệm. Chọn câu trả lời đúng cho mỗi câu hỏi.
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
                <p>Chưa có câu hỏi nào được thêm. Bắt đầu bằng cách <strong>thêm một câu hỏi mới</strong> hoặc <strong>nhập từ tệp</strong>.</p>
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
            {editQuizId ? 'Cập nhật Quiz' : 'Lưu Quiz'}
          </Button>
        </div>
      </main>
    </div>
  )
}
