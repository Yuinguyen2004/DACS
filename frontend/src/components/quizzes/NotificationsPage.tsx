import { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck, Calendar } from 'lucide-react'
import { gsap } from 'gsap'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { notificationAPI } from '../../services/api'
import { Notification as AppNotification, NotificationType } from '../../types/types'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // GSAP refs
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await notificationAPI.getMyNotifications()
      console.log('Fetched notifications data:', data)
      // Ensure data is an array before setting it
      setNotifications(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      setError('Failed to load notifications')
      setNotifications([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.isRead)
        .map(n => n._id)
      
      if (unreadIds.length === 0) return

      await notificationAPI.markAsRead(unreadIds)
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      )
    } catch (err) {
      console.error('Failed to mark notifications as read:', err)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead([notificationId])
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, isRead: true }
            : n
        )
      )
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const getNotificationTypeDisplay = (type: NotificationType) => {
    switch (type) {
      case NotificationType.QUIZ_COMPLETED:
        return { label: 'Quiz Completed', color: 'bg-green-100 text-green-800' }
      case NotificationType.QUIZ_REMINDER:
        return { label: 'Quiz Reminder', color: 'bg-blue-100 text-blue-800' }
      case NotificationType.SYSTEM_UPDATE:
        return { label: 'System Update', color: 'bg-purple-100 text-purple-800' }
      case NotificationType.PAYMENT_SUCCESS:
        return { label: 'Payment Success', color: 'bg-green-100 text-green-800' }
      case NotificationType.PAYMENT_FAILED:
        return { label: 'Payment Failed', color: 'bg-red-100 text-red-800' }
      default:
        return { label: 'Notification', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    fetchNotifications()

    // Listen for real-time new notifications
    const handleNewNotification = (event: CustomEvent) => {
      const newNotification = event.detail
      setNotifications(prev => [newNotification, ...prev])
    }

    window.addEventListener('newNotification', handleNewNotification as EventListener)

    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener)
    }
  }, [])

  // GSAP animations after loading
  useEffect(() => {
    if (!loading && containerRef.current) {
      const tl = gsap.timeline()
      
      // Set initial states
      gsap.set([headerRef.current, contentRef.current], {
        opacity: 0,
        y: 30
      })
      
      gsap.set('.notification-card', {
        opacity: 0,
        x: -30,
        scale: 0.95
      })
      
      gsap.set('.bell-icon', {
        opacity: 0,
        scale: 0,
        rotation: -45
      })
      
      gsap.set('.action-button', {
        opacity: 0,
        scale: 0.8
      })
      
      // Animate in sequence
      tl.to(headerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      })
      .to('.bell-icon', {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.6,
        ease: "back.out(1.5)"
      }, "-=0.5")
      .to(contentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.4")
      .to('.notification-card', {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(1.2)"
      }, "-=0.3")
      .to('.action-button', {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: "back.out(1.5)"
      }, "-=0.3")
    }
  }, [loading, notifications])

  // Notification card hover animations
  const handleNotificationHover = (element: HTMLElement, isHovering: boolean) => {
    gsap.to(element, {
      y: isHovering ? -3 : 0,
      scale: isHovering ? 1.01 : 1,
      boxShadow: isHovering ? "0 10px 25px rgba(0,0,0,0.1)" : "0 4px 12px rgba(0,0,0,0.05)",
      duration: 0.3,
      ease: "power2.out"
    })
  }

  // Button click animations
  const handleButtonClick = (element: HTMLElement) => {
    gsap.to(element, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut"
    })
  }

  // Bell ring animation
  const animateBellRing = () => {
    const bellIcon = document.querySelector('.bell-icon')
    if (bellIcon) {
      gsap.to(bellIcon, {
        rotation: 15,
        duration: 0.1,
        yoyo: true,
        repeat: 5,
        ease: "power2.inOut"
      })
    }
  }

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading notifications...</div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className="mb-8" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell 
                className="bell-icon w-8 h-8 text-orange-500 cursor-pointer" 
                onClick={animateBellRing}
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 
                    ? `Bạn có ${unreadCount} thông báo chưa đọc`
                    : 'Tất cả thông báo đã được đọc'
                  }
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={(e) => {
                  handleButtonClick(e.currentTarget)
                  setTimeout(() => markAllAsRead(), 150)
                }}
                className="action-button flex items-center space-x-2"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Đánh dấu tất cả đã đọc</span>
              </Button>
            )}
          </div>
        </div>

        <div ref={contentRef} style={{ opacity: 0 }}>
          {error && (
            <Card className="notification-card mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          {notifications.length === 0 ? (
            <Card className="notification-card">
              <CardContent className="p-8 text-center">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có thông báo nào
                </h3>
                <p className="text-gray-500">
                  Các thông báo sẽ xuất hiện ở đây khi có cập nhật mới
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const typeDisplay = getNotificationTypeDisplay(notification.type)
                
                return (
                  <Card 
                    key={notification._id}
                    className={`notification-card transition-all hover:shadow-md ${
                      !notification.isRead ? 'border-orange-200 bg-orange-50' : 'bg-white'
                    }`}
                    onMouseEnter={(e) => handleNotificationHover(e.currentTarget, true)}
                    onMouseLeave={(e) => handleNotificationHover(e.currentTarget, false)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge className={typeDisplay.color}>
                              {typeDisplay.label}
                            </Badge>
                            {!notification.isRead && (
                              <Badge variant="outline" className="bg-orange-100 text-orange-700">
                                Chưa đọc
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {notification.title}
                          </h3>
                          
                          <p className="text-gray-600 mb-3">
                            {notification.content}
                          </p>
                          
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(notification.createdAt)}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                handleButtonClick(e.currentTarget)
                                setTimeout(() => markAsRead(notification._id), 150)
                              }}
                              className="action-button flex items-center space-x-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Đánh dấu đã đọc</span>
                            </Button>
                          )}
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
    </div>
  )
}