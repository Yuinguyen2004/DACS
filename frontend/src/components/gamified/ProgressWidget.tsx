import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'
import { Flame, Zap, TrendingUp, Star } from 'lucide-react'

interface ProgressWidgetProps {
  level: number
  xp: number
  xpToNextLevel: number
  streak?: number
  totalQuizzes?: number
  completedQuizzes?: number
  achievements?: number
  className?: string
  animated?: boolean
}

export function ProgressWidget({
  level,
  xp,
  xpToNextLevel,
  streak = 0,
  totalQuizzes = 0,
  completedQuizzes = 0,
  achievements = 0,
  className,
  animated = true,
}: ProgressWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null)
  const [displayXP, setDisplayXP] = useState(0)
  const [displayLevel, setDisplayLevel] = useState(0)

  const xpPercentage = (xp / xpToNextLevel) * 100

  // Animated counter effect
  useEffect(() => {
    if (!animated) {
      setDisplayXP(xp)
      setDisplayLevel(level)
      return
    }

    // Animate XP counter
    const xpCounter = { value: 0 }
    gsap.to(xpCounter, {
      value: xp,
      duration: 1,
      ease: 'power2.out',
      onUpdate: () => setDisplayXP(Math.round(xpCounter.value)),
    })

    // Animate Level counter
    const levelCounter = { value: 0 }
    gsap.to(levelCounter, {
      value: level,
      duration: 0.8,
      ease: 'back.out(1.7)',
      onUpdate: () => setDisplayLevel(Math.round(levelCounter.value)),
    })
  }, [xp, level, animated])

  return (
    <Card
      ref={widgetRef}
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white shadow-glow',
        className
      )}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="particles" />
      </div>

      <CardContent className="p-6 relative z-10">
        {/* Header with Level Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="level-badge w-16 h-16 bg-white/20 backdrop-blur-sm">
              <span className="text-2xl font-display font-bold">{displayLevel}</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Level {displayLevel}</h3>
              <p className="text-sm text-white/80">Keep learning!</p>
            </div>
          </div>

          {/* Streak indicator */}
          {streak > 0 && (
            <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 gap-1">
              <Flame size={14} />
              <span className="font-display font-bold">{streak} day{streak > 1 ? 's' : ''}</span>
            </Badge>
          )}
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Zap size={16} className="text-yellow-300" />
              <span className="font-medium">{displayXP} XP</span>
            </div>
            <span className="text-white/80">{xpToNextLevel} XP</span>
          </div>
          
          <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="xp-bar h-full transition-all duration-1000 ease-out"
              style={{ width: `${xpPercentage}%` }}
            />
            {/* Glow effect */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent shimmer"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          
          <p className="text-xs text-white/70 text-center">
            {xpToNextLevel - xp} XP to level {level + 1}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
          {/* Quizzes Completed */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp size={14} className="text-green-300" />
              <p className="text-2xl font-display font-bold">{completedQuizzes}</p>
            </div>
            <p className="text-xs text-white/70">Completed</p>
          </div>

          {/* Total Quizzes */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={14} className="text-yellow-300" />
              <p className="text-2xl font-display font-bold">{totalQuizzes}</p>
            </div>
            <p className="text-xs text-white/70">Total</p>
          </div>

          {/* Achievements */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <svg
                className="w-4 h-4 text-purple-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <p className="text-2xl font-display font-bold">{achievements}</p>
            </div>
            <p className="text-xs text-white/70">Badges</p>
          </div>
        </div>

        {/* Motivational message */}
        {xpPercentage > 80 && (
          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-yellow-300 animate-pulse">
              🎯 Almost there! Keep going!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
