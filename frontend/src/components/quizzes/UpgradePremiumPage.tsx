"use client"

import {
  CheckCircle,
  Crown,
  Zap,
  BarChart,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Award,
  LockOpen,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function UpgradePremiumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm mb-8 rounded-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">QuizMaster</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-10">
        {/* Hero Section */}
        <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center mb-4">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-4xl font-extrabold text-gray-900 mb-3">
              Unlock Your Full Learning Potential
            </CardTitle>
            <CardDescription className="text-xl text-gray-700 max-w-2xl mx-auto">
              Go Premium with QuizMaster to access exclusive features, detailed insights, and an ad-free experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <Button className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
              <Zap className="w-5 h-5 mr-3" />
              Upgrade to Premium Now
            </Button>
            <p className="text-sm text-gray-500 mt-4">Starting at just $9.99/month • Cancel anytime</p>
          </CardContent>
        </Card>

        {/* Premium Benefits Section */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">Why Go Premium?</CardTitle>
            <CardDescription className="text-gray-600">
              Elevate your quiz experience with these powerful features.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Detailed Explanations</h3>
                <p className="text-gray-600 text-sm">
                  Understand every answer with in-depth explanations for all questions.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Advanced Analytics</h3>
                <p className="text-gray-600 text-sm">
                  Track your progress, identify weak areas, and see performance trends.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <LockOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Unlimited Access</h3>
                <p className="text-gray-600 text-sm">
                  Enjoy unlimited attempts on all quizzes, including premium content.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Priority Support</h3>
                <p className="text-gray-600 text-sm">
                  Get faster responses and dedicated assistance from our support team.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Ad-Free Experience</h3>
                <p className="text-gray-600 text-sm">
                  Focus purely on learning without any interruptions from advertisements.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Exclusive Content</h3>
                <p className="text-gray-600 text-sm">
                  Access special quizzes and learning modules available only to Premium members.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison Table */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">Compare Plans</CardTitle>
            <CardDescription className="text-gray-600">See how Premium enhances your learning journey.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[200px] text-gray-700 font-semibold">Feature</TableHead>
                    <TableHead className="text-center text-gray-700 font-semibold">Free</TableHead>
                    <TableHead className="text-center text-gray-700 font-semibold">
                      <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white text-sm px-3 py-1">
                        Premium
                      </Badge>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Quiz Attempts</TableCell>
                    <TableCell className="text-center text-gray-600">Limited</TableCell>
                    <TableCell className="text-center text-green-600 font-medium">Unlimited</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Detailed Explanations</TableCell>
                    <TableCell className="text-center text-red-600">
                      <XCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Advanced Analytics</TableCell>
                    <TableCell className="text-center text-red-600">
                      <XCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Ad-Free Experience</TableCell>
                    <TableCell className="text-center text-red-600">
                      <XCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Exclusive Quizzes</TableCell>
                    <TableCell className="text-center text-red-600">
                      <XCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Priority Support</TableCell>
                    <TableCell className="text-center text-red-600">
                      <XCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Quiz History</TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Final Call to Action */}
        <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="py-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Master Your Knowledge?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Join thousands of learners who are already accelerating their progress with QuizMaster Premium.
            </p>
            <Button className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
              <Crown className="w-5 h-5 mr-3" />
              Upgrade to Premium Today!
            </Button>
            <p className="text-sm text-gray-500 mt-4">Secure payment via Stripe • 7-day money-back guarantee</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
