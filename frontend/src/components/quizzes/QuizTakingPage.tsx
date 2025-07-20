"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Clock, BookOpen, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

// Mock quiz data
const quizData = {
  title: "JavaScript Fundamentals",
  totalQuestions: 10,
  timeLimit: 1800, // 30 minutes in seconds
  questions: [
    {
      id: 1,
      question: "What is the correct way to declare a variable in JavaScript?",
      options: ["var myVariable = 5;", "variable myVariable = 5;", "v myVariable = 5;", "declare myVariable = 5;"],
    },
    {
      id: 2,
      question: "Which of the following is NOT a JavaScript data type?",
      options: ["String", "Boolean", "Float", "Number"],
    },
    {
      id: 3,
      question: "What does the '===' operator do in JavaScript?",
      options: [
        "Assigns a value to a variable",
        "Compares values only",
        "Compares both value and type",
        "Performs mathematical addition",
      ],
    },
    {
      id: 4,
      question: "How do you create a function in JavaScript?",
      options: [
        "function myFunction() {}",
        "create myFunction() {}",
        "def myFunction() {}",
        "function = myFunction() {}",
      ],
    },
    {
      id: 5,
      question: "What is the correct way to write a JavaScript array?",
      options: [
        "var colors = 'red', 'green', 'blue'",
        "var colors = (1:'red', 2:'green', 3:'blue')",
        "var colors = ['red', 'green', 'blue']",
        "var colors = 1 = ('red'), 2 = ('green'), 3 = ('blue')",
      ],
    },
    {
      id: 6,
      question: "Which event occurs when the user clicks on an HTML element?",
      options: ["onchange", "onclick", "onmouseclick", "onmouseover"],
    },
    {
      id: 7,
      question: "How do you write 'Hello World' in an alert box?",
      options: ["alertBox('Hello World');", "msg('Hello World');", "alert('Hello World');", "msgBox('Hello World');"],
    },
    {
      id: 8,
      question: "What is the correct JavaScript syntax to change the content of an HTML element?",
      options: [
        "document.getElement('p').innerHTML = 'Hello World!';",
        "document.getElementById('demo').innerHTML = 'Hello World!';",
        "#demo.innerHTML = 'Hello World!';",
        "document.getElementByName('p').innerHTML = 'Hello World!';",
      ],
    },
    {
      id: 9,
      question: "Where is the correct place to insert a JavaScript?",
      options: [
        "The <head> section",
        "The <body> section",
        "Both the <head> section and the <body> section are correct",
        "The <footer> section",
      ],
    },
    {
      id: 10,
      question: "What is the correct syntax for referring to an external script called 'xxx.js'?",
      options: ["<script href='xxx.js'>", "<script name='xxx.js'>", "<script src='xxx.js'>", "<script file='xxx.js'>"],
    },
  ],
}

export default function QuizTaking() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(quizData.timeLimit)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      handleSubmit()
    }
  }, [timeLeft, isSubmitted])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: value,
    }))
  }

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = () => {
    setIsSubmitted(true)
    // Here you would typically send the answers to your backend
    console.log("Quiz submitted with answers:", answers)
  }

  const progress = ((currentQuestion + 1) / quizData.totalQuestions) * 100
  const answeredQuestions = Object.keys(answers).length
  const currentAnswer = answers[currentQuestion] || ""

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Quiz Submitted!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              You answered {answeredQuestions} out of {quizData.totalQuestions} questions.
            </p>
            <Button className="w-full bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white">
              View Results
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">{quizData.title}</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className={`font-mono font-medium ${timeLeft < 300 ? "text-red-600" : "text-gray-700"}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestion + 1} of {quizData.totalQuestions}
            </span>
            <span className="text-sm text-gray-500">{answeredQuestions} answered</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-8 shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 leading-relaxed">
              {quizData.questions[currentQuestion].question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={currentAnswer} onValueChange={handleAnswerChange} className="space-y-4">
              {quizData.questions[currentQuestion].options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <RadioGroupItem
                    value={option}
                    id={`option-${index}`}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                  <Label htmlFor={`option-${index}`} className="flex-1 text-gray-700 cursor-pointer leading-relaxed">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center justify-center h-12 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-4">
            {currentQuestion === quizData.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                className="flex items-center justify-center h-12 px-8 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium"
              >
                <Check className="w-4 h-4 mr-2" />
                Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentQuestion === quizData.questions.length - 1}
                className="flex items-center justify-center h-12 px-6 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-medium"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigation Dots (Mobile-friendly) */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {quizData.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                index === currentQuestion
                  ? "bg-gradient-to-r from-orange-400 to-pink-400 text-white"
                  : answers[index]
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
