import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'
import { Filter, X, Check } from 'lucide-react'

export interface FilterOption {
  id: string
  label: string
  count?: number
  color?: string
}

interface InteractiveFilterProps {
  title?: string
  options: FilterOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  multiSelect?: boolean
  className?: string
  animated?: boolean
}

export function InteractiveFilter({
  title = 'Filters',
  options,
  selected,
  onChange,
  multiSelect = true,
  className,
  animated = true,
}: InteractiveFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)

  // Toggle filter option
  const toggleOption = (optionId: string) => {
    if (multiSelect) {
      if (selected.includes(optionId)) {
        onChange(selected.filter(id => id !== optionId))
      } else {
        onChange([...selected, optionId])
      }
    } else {
      onChange([optionId])
    }
  }

  // Clear all filters
  const clearAll = () => {
    onChange([])
  }

  // Animate filter panel
  useEffect(() => {
    if (!animated || !optionsRef.current) return

    if (isOpen) {
      gsap.fromTo(
        optionsRef.current,
        {
          height: 0,
          opacity: 0,
          y: -20,
        },
        {
          height: 'auto',
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: 'back.out(1.7)',
        }
      )
    } else {
      gsap.to(optionsRef.current, {
        height: 0,
        opacity: 0,
        y: -20,
        duration: 0.2,
        ease: 'power2.in',
      })
    }
  }, [isOpen, animated])

  const selectedCount = selected.length

  return (
    <div ref={filterRef} className={cn('relative', className)}>
      {/* Filter Button */}
      <Button
        variant="outline"
        className={cn(
          'gap-2 transition-all duration-300 hover:scale-105',
          isOpen && 'shadow-glow',
          selectedCount > 0 && 'border-game-primary bg-game-primary/5'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter size={16} className={cn(isOpen && 'rotate-180 transition-transform duration-300')} />
        <span className="font-display font-medium">{title}</span>
        {selectedCount > 0 && (
          <Badge
            variant="secondary"
            className="ml-1 bg-game-primary text-white hover:bg-game-primary animate-scale-in"
          >
            {selectedCount}
          </Badge>
        )}
      </Button>

      {/* Filter Options Panel */}
      {isOpen && (
        <Card
          ref={optionsRef}
          className="absolute top-full mt-2 left-0 z-50 min-w-[280px] shadow-card-hover border-2 border-game-primary/20 overflow-hidden"
        >
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b">
              <h4 className="font-display font-semibold text-sm">Select {title}</h4>
              {selectedCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="h-7 text-xs gap-1 hover:text-game-danger"
                >
                  <X size={12} />
                  Clear
                </Button>
              )}
            </div>

            {/* Options Grid */}
            <div className="space-y-2">
              {options.map((option, index) => {
                const isSelected = selected.includes(option.id)
                
                return (
                  <div
                    key={option.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200',
                      'hover:scale-105 hover:shadow-md',
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow'
                        : 'bg-muted hover:bg-muted/80',
                      animated && 'animate-slide-down'
                    )}
                    style={animated ? { animationDelay: `${index * 50}ms` } : undefined}
                    onClick={() => toggleOption(option.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <div
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200',
                          isSelected
                            ? 'bg-white border-white scale-110'
                            : 'border-muted-foreground/30'
                        )}
                      >
                        {isSelected && (
                          <Check size={14} className="text-game-primary animate-scale-in" />
                        )}
                      </div>

                      {/* Label */}
                      <span className={cn('font-medium text-sm', isSelected && 'font-semibold')}>
                        {option.label}
                      </span>
                    </div>

                    {/* Count Badge */}
                    {option.count !== undefined && (
                      <Badge
                        variant={isSelected ? 'secondary' : 'outline'}
                        className={cn(
                          'text-xs',
                          isSelected && 'bg-white/20 text-white border-0'
                        )}
                      >
                        {option.count}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer info */}
            {multiSelect && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t text-center">
                {selectedCount === 0
                  ? 'Select one or more options'
                  : `${selectedCount} filter${selectedCount > 1 ? 's' : ''} applied`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
