import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'
import { Trophy, Star, Crown, Zap, Award, Target } from 'lucide-react'

interface AchievementBadgeProps {
  title: string
  description?: string
  icon?: 'trophy' | 'star' | 'crown' | 'zap' | 'award' | 'target'
  variant?: 'gold' | 'silver' | 'bronze' | 'default'
  unlocked?: boolean
  progress?: number // 0-100
  showProgress?: boolean
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const iconMap = {
  trophy: Trophy,
  star: Star,
  crown: Crown,
  zap: Zap,
  award: Award,
  target: Target,
}

export function AchievementBadge({
  title,
  description,
  icon = 'trophy',
  variant = 'default',
  unlocked = false,
  progress = 0,
  showProgress = false,
  animated = true,
  size = 'md',
  onClick,
}: AchievementBadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null)
  const [justUnlocked, setJustUnlocked] = useState(false)
  const Icon = iconMap[icon]

  // Unlock animation
  useEffect(() => {
    if (unlocked && animated && badgeRef.current && !justUnlocked) {
      setJustUnlocked(true)
      
      const badge = badgeRef.current
      
      // Confetti effect
      const confettiColors = ['#10b981', '#fbbf24', '#6366f1', '#a855f7', '#ef4444']
      for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div')
        confetti.className = 'confetti-piece'
        confetti.style.left = '50%'
        confetti.style.top = '50%'
        confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)]
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`
        badge.appendChild(confetti)

        gsap.to(confetti, {
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200,
          opacity: 0,
          duration: 1 + Math.random(),
          ease: 'power2.out',
          onComplete: () => confetti.remove(),
        })
      }

      // Scale animation
      gsap.fromTo(
        badge,
        {
          scale: 0.5,
          rotation: -10,
          opacity: 0,
        },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'back.out(1.7)',
        }
      )

      // Glow pulse
      gsap.to(badge, {
        boxShadow: '0 0 40px rgba(99, 102, 241, 0.8)',
        duration: 0.3,
        yoyo: true,
        repeat: 3,
        ease: 'power2.inOut',
      })
    }
  }, [unlocked, animated, justUnlocked])

  const variantStyles = {
    gold: 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-premium',
    silver: 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800',
    bronze: 'bg-gradient-to-br from-orange-400 to-orange-600 text-white',
    default: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white',
  }

  const sizeStyles = {
    sm: 'w-12 h-12 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-24 h-24 text-base',
  }

  const iconSizeStyles = {
    sm: 16,
    md: 20,
    lg: 28,
  }

  return (
    <div
      ref={badgeRef}
      className={cn(
        'relative inline-flex flex-col items-center gap-2 cursor-pointer group',
        onClick && 'hover:scale-110 transition-transform duration-300'
      )}
      onClick={onClick}
    >
      {/* Badge Circle */}
      <div
        className={cn(
          'level-badge relative',
          sizeStyles[size],
          unlocked ? variantStyles[variant] : 'bg-gray-300 opacity-50',
          !unlocked && 'grayscale',
          'transition-all duration-300'
        )}
      >
        <Icon size={iconSizeStyles[size]} className="relative z-10" />
        
        {/* Lock overlay for locked badges */}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        )}

        {/* Progress ring */}
        {showProgress && progress > 0 && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${progress * 2.827} 282.7`}
              className="transition-all duration-500"
            />
          </svg>
        )}
      </div>

      {/* Title */}
      <div className="text-center max-w-[120px]">
        <p className={cn('font-display font-semibold', size === 'sm' && 'text-xs', size === 'md' && 'text-sm')}>
          {title}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {description}
          </p>
        )}
      </div>

      {/* Progress percentage */}
      {showProgress && progress > 0 && progress < 100 && (
        <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
          {Math.round(progress)}%
        </Badge>
      )}

      {/* Unlocked indicator */}
      {unlocked && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-game-success rounded-full flex items-center justify-center shadow-success">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  )
}
