import { ReactNode, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'

interface GamifiedCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'premium' | 'success' | 'glow'
  hoverable?: boolean
  particles?: boolean
  glowOnHover?: boolean
  onClick?: () => void
}

export function GamifiedCard({
  children,
  className,
  variant = 'default',
  hoverable = true,
  particles = false,
  glowOnHover = true,
  onClick,
}: GamifiedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const particleContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cardRef.current || !hoverable) return

    const card = cardRef.current

    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -8,
        scale: 1.02,
        duration: 0.3,
        ease: 'back.out(1.7)',
      })
    }

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    card.addEventListener('mouseenter', handleMouseEnter)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [hoverable])

  // Generate particles on hover
  useEffect(() => {
    if (!particles || !particleContainerRef.current) return

    const container = particleContainerRef.current

    const createParticle = () => {
      const particle = document.createElement('div')
      particle.className = 'absolute w-1 h-1 rounded-full opacity-60'
      
      const colors = ['bg-game-primary', 'bg-game-secondary', 'bg-game-success', 'bg-game-gold']
      particle.classList.add(colors[Math.floor(Math.random() * colors.length)])
      
      particle.style.left = `${Math.random() * 100}%`
      particle.style.top = `${Math.random() * 100}%`
      
      container.appendChild(particle)

      gsap.to(particle, {
        y: -50,
        opacity: 0,
        duration: 1 + Math.random(),
        ease: 'power2.out',
        onComplete: () => particle.remove(),
      })
    }

    const interval = setInterval(createParticle, 300)
    return () => clearInterval(interval)
  }, [particles])

  const variantStyles = {
    default: 'bg-white hover:shadow-card-hover',
    premium: 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-game-gold hover:shadow-premium',
    success: 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-game-success hover:shadow-success',
    glow: 'bg-white hover:shadow-glow-lg border-2 border-game-primary/20',
  }

  return (
    <div className="relative">
      {particles && (
        <div
          ref={particleContainerRef}
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
        />
      )}
      <Card
        ref={cardRef}
        className={cn(
          'card-3d transition-all duration-300 cursor-pointer relative overflow-hidden',
          variantStyles[variant],
          glowOnHover && 'glow-on-hover',
          className
        )}
        onClick={onClick}
      >
        {children}
      </Card>
    </div>
  )
}
