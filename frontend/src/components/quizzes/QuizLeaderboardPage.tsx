"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Trophy, Medal, ArrowLeft, Crown, Loader2, Users, Clock, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { leaderboardAPI, authAPI, QuizLeaderboardResponse, UserRankResponse } from "@/services/api"
import { LeaderboardEntry } from "@/types/types"

// Format time from seconds to mm:ss
function formatTime(seconds?: number): string {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Podium component for top 3 players
function Podium({ entries, currentUserId }: { entries: LeaderboardEntry[], currentUserId?: string }) {
  const top3 = entries.slice(0, 3)
  if (top3.length === 0) return null

  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 2
    ? [top3[1], top3[0], top3[2]].filter(Boolean)
    : top3

  const getPodiumStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          height: 'h-32',
          bgColor: 'bg-gradient-to-b from-yellow-400 to-yellow-500',
          avatarSize: 'w-20 h-20',
          textColor: 'text-yellow-600',
          icon: <Crown className="w-8 h-8 text-yellow-500" />,
          medalColor: 'text-yellow-500'
        }
      case 2:
        return {
          height: 'h-24',
          bgColor: 'bg-gradient-to-b from-gray-300 to-gray-400',
          avatarSize: 'w-16 h-16',
          textColor: 'text-gray-600',
          icon: <Medal className="w-6 h-6 text-gray-400" />,
          medalColor: 'text-gray-400'
        }
      case 3:
        return {
          height: 'h-20',
          bgColor: 'bg-gradient-to-b from-amber-500 to-amber-600',
          avatarSize: 'w-14 h-14',
          textColor: 'text-amber-600',
          icon: <Medal className="w-5 h-5 text-amber-600" />,
          medalColor: 'text-amber-600'
        }
      default:
        return {
          height: 'h-16',
          bgColor: 'bg-gray-200',
          avatarSize: 'w-12 h-12',
          textColor: 'text-gray-600',
          icon: null,
          medalColor: 'text-gray-400'
        }
    }
  }

  return (
    <div className="flex items-end justify-center gap-4 mb-8">
      {podiumOrder.map((entry) => {
        if (!entry) return null
        const style = getPodiumStyle(entry.rank)
        const isCurrentUser = entry.userId === currentUserId

        return (
          <div key={entry.userId} className="flex flex-col items-center">
            {/* Medal icon */}
            <div className="mb-2">
              {style.icon}
            </div>

            {/* Avatar */}
            <div className={`relative ${isCurrentUser ? 'ring-4 ring-blue-500 rounded-full' : ''}`}>
              <Avatar className={`${style.avatarSize} border-4 border-white shadow-lg`}>
                <AvatarFallback className={`${style.bgColor} text-white font-bold text-xl`}>
                  {entry.username?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              {isCurrentUser && (
                <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs">
                  You
                </Badge>
              )}
            </div>

            {/* Name */}
            <p className={`mt-2 font-semibold ${style.textColor} text-center max-w-24 truncate`}>
              {entry.username || 'Anonymous'}
            </p>

            {/* Score */}
            <p className="text-2xl font-bold text-gray-900">{entry.score}</p>

            {/* Time */}
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(entry.timeSpent)}
            </p>

            {/* Podium base */}
            <div className={`${style.height} ${style.bgColor} w-24 mt-2 rounded-t-lg flex items-end justify-center pb-2`}>
              <span className="text-white font-bold text-2xl">{entry.rank}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function QuizLeaderboardPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const [leaderboardData, setLeaderboardData] = useState<QuizLeaderboardResponse | null>(null)
  const [myRank, setMyRank] = useState<UserRankResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const currentUser = authAPI.getCurrentUser()

  useEffect(() => {
    if (!quizId) return

    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true)

        // Fetch leaderboard data
        const data = await leaderboardAPI.getQuizLeaderboard(quizId)
        setLeaderboardData(data)

        // Fetch current user's rank if logged in
        if (currentUser) {
          const rankData = await leaderboardAPI.getMyRankInQuiz(quizId)
          setMyRank(rankData)
        }
      } catch (err: any) {
        console.error('Failed to fetch leaderboard:', err)
        setError('Không thể tải bảng xếp hạng')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [quizId, currentUser?._id])

  // Check if current user is in top 50
  const isUserInTopList = leaderboardData?.entries.some(
    entry => entry.userId === currentUser?._id
  )

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

  const entries = leaderboardData?.entries || []

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

          {/* Quiz Title */}
          {leaderboardData?.quizTitle && (
            <h2 className="text-xl text-gray-700 mb-2">{leaderboardData.quizTitle}</h2>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-gray-600">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {leaderboardData?.totalParticipants || 0} người tham gia
            </span>
          </div>
        </div>

        {/* Current User Rank Card (if not in top list) */}
        {currentUser && myRank && !isUserInTopList && (
          <Card className="mb-6 border-2 border-blue-500 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                    <Star className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Thứ hạng của bạn</p>
                    <p className="text-2xl font-bold text-gray-900">#{myRank.rank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Điểm số</p>
                  <p className="text-2xl font-bold text-gray-900">{myRank.score}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        {entries.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Chưa có ai hoàn thành quiz này</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Podium for top 3 */}
            {entries.length >= 1 && (
              <Podium entries={entries} currentUserId={currentUser?._id} />
            )}

            {/* Rest of the leaderboard (rank 4+) */}
            <div className="space-y-3">
              {entries.slice(3).map((entry) => {
                const isCurrentUser = entry.userId === currentUser?._id

                return (
                  <Card
                    key={entry.userId}
                    className={`
                      transition-all hover:shadow-md
                      ${isCurrentUser ? 'border-2 border-blue-500 bg-blue-50' : ''}
                    `}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full">
                          <span className="text-lg font-bold text-gray-600">{entry.rank}</span>
                        </div>

                        {/* Avatar */}
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-orange-200 to-pink-200 text-gray-700 font-semibold">
                            {entry.username?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 truncate">
                              {entry.username || 'Anonymous'}
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
                          <div className="text-sm text-gray-500 flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(entry.timeSpent)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
