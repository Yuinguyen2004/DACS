"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Trophy, Medal, ArrowLeft, Crown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { leaderboardAPI, authAPI } from "@/services/api"
import { LeaderboardEntry } from "@/types/types"

export default function QuizLeaderboardPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const currentUser = authAPI.getCurrentUser()

  useEffect(() => {
    if (!quizId) return

    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true)
        const data = await leaderboardAPI.getQuizLeaderboard(quizId)
        setLeaderboard(data)
      } catch (err: any) {
        console.error('Failed to fetch leaderboard:', err)
        setError('Không thể tải bảng xếp hạng')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [quizId])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-600">{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800 border-yellow-300"
    if (rank === 2) return "bg-gray-100 text-gray-800 border-gray-300"
    if (rank === 3) return "bg-amber-100 text-amber-800 border-amber-300"
    return "bg-blue-50 text-blue-700 border-blue-200"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => navigate('/homepage')} className="mt-4">
              Về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <h1 className="text-3xl font-bold text-gray-900">Bảng Xếp Hạng</h1>
          </div>
          <p className="text-gray-600">
            Top {leaderboard.length} người chơi xuất sắc nhất
          </p>
        </div>

        {/* Leaderboard */}
        {leaderboard.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Chưa có ai hoàn thành quiz này</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const rank = entry.rank || (index + 1)
              const isCurrentUser = entry.user._id === currentUser?._id
              
              return (
                <Card
                  key={entry.user._id}
                  className={`
                    transition-all hover:shadow-md
                    ${isCurrentUser ? 'border-2 border-blue-500 bg-blue-50' : ''}
                    ${rank <= 3 ? 'shadow-lg' : ''}
                  `}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                        {getRankIcon(rank)}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className={getRankBadgeColor(rank)}>
                          {entry.user.name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 truncate">
                            {entry.user.name || 'Anonymous'}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="outline" className="border-blue-500 text-blue-700">
                              Bạn
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(entry.completedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>

                      {/* Score & Time */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {entry.score}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.timeSpent ? `${entry.timeSpent}s` : '-'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
