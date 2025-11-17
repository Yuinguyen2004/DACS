"use client"
import { Link, useNavigate } from "react-router-dom"
import { BookOpen, Menu, LogOut, User, Settings, HelpCircle, Shield, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { authAPI, userUtils, notificationAPI } from "../../services/api"
import { User as UserType } from "../../types/types"
import { useState, useEffect, useRef } from "react"
import { webSocketService } from "../../services/websocket"
import { gsap } from 'gsap'

interface AppHeaderProps {
  isLoggedIn?: boolean
  userName?: string
  userAvatarUrl?: string
  user?: UserType | null
}

export function AppHeader({ isLoggedIn = true, userName = "Guest", userAvatarUrl, user }: AppHeaderProps) {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  
  // GSAP Refs
  const headerRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const userActionsRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  
  // Animation on mount
  useEffect(() => {
    if (headerRef.current) {
      // Set initial states
      gsap.set([logoRef.current, navRef.current, userActionsRef.current], {
        opacity: 0,
        y: -20
      })
      
      // Animate in sequence
      const tl = gsap.timeline()
      
      tl.to(headerRef.current, {
        opacity: 1,
        duration: 0.3
      })
      .to(logoRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "back.out(1.2)"
      })
      .to(navRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.3")
      .to(userActionsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.3")
    }
  }, [])

  // Logo hover animation
  const handleLogoHover = (isHovering: boolean) => {
    if (logoRef.current) {
      gsap.to(logoRef.current.querySelector('.logo-icon'), {
        rotation: isHovering ? 15 : 0,
        scale: isHovering ? 1.1 : 1,
        duration: 0.3,
        ease: "back.out(1.2)"
      })
      
      gsap.to(logoRef.current.querySelector('.logo-text'), {
        scale: isHovering ? 1.05 : 1,
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }

  // Navigation link hover effects
  const handleNavLinkHover = (element: HTMLElement, isHovering: boolean) => {
    gsap.to(element, {
      scale: isHovering ? 1.05 : 1,
      y: isHovering ? -2 : 0,
      duration: 0.2,
      ease: "power2.out"
    })
  }

  // Notification bell animation
  const animateNotification = () => {
    if (notificationRef.current) {
      gsap.to(notificationRef.current.querySelector('.bell-icon'), {
        rotation: 15,
        duration: 0.1,
        yoyo: true,
        repeat: 3,
        ease: "power2.inOut"
      })
    }
  }

  // Button click animation
  const handleButtonClick = (element: HTMLElement) => {
    gsap.to(element, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut"
    })
  }

  // Notification count pulse animation
  useEffect(() => {
    if (unreadCount > 0 && notificationRef.current) {
      const badge = notificationRef.current.querySelector('.notification-badge')
      if (badge) {
        gsap.fromTo(badge, 
          { scale: 0 },
          { 
            scale: 1, 
            duration: 0.5, 
            ease: "back.out(1.5)",
            onComplete: () => {
              gsap.to(badge, {
                scale: 1.2,
                duration: 0.8,
                yoyo: true,
                repeat: -1,
                ease: "power2.inOut"
              })
            }
          }
        )
      }
    }
  }, [unreadCount])

  const handleLogout = async () => {
    console.log('🚪 User logging out')
    await authAPI.logout()
    console.log('✅ Logout successful, redirecting to login')
    navigate('/')
  }

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    if (isLoggedIn && user) {
      try {
        const notifications = await notificationAPI.getMyNotifications()
        // Add null check to prevent undefined filter error
        const count = (notifications || []).filter(n => !n.isRead).length
        setUnreadCount(count)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    
    // Connect to WebSocket for real-time updates
    if (isLoggedIn && user) {
      webSocketService.connect()
      webSocketService.requestNotificationPermission()
    }

    // Listen for real-time unread count updates
    const handleUnreadCountUpdate = (event: CustomEvent) => {
      setUnreadCount(event.detail.count)
    }

    window.addEventListener('unreadCountUpdate', handleUnreadCountUpdate as EventListener)

    // Fallback: Set up interval to refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('unreadCountUpdate', handleUnreadCountUpdate as EventListener)
      if (!isLoggedIn) {
        webSocketService.disconnect()
      }
    }
  }, [isLoggedIn, user])

  // Get navigation links based on user role
  const getNavigationLinks = () => {
    const baseLinks = [
      { name: "Trang chủ", to: "/homepage" },
      { name: "Bài quiz của tôi", to: "/manage" },
      { name: "Lịch sử", to: "/history" },
      { name: "Nâng cấp", to: "/upgrade" },
    ]

    // Add admin link if user is admin
    if (user && userUtils.isAdmin(user)) {
      baseLinks.splice(3, 0, { name: "Quản trị", to: "/admin" }) // Insert before "Thông báo"
    }

    return baseLinks
  }

  const navigationLinks = getNavigationLinks()

  return (
    <header 
      ref={headerRef}
      className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
      style={{ opacity: 0 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: App Logo and Name */}
        <div 
          ref={logoRef}
          className="flex items-center space-x-3"
          onMouseEnter={() => handleLogoHover(true)}
          onMouseLeave={() => handleLogoHover(false)}
        >
          <Link to="/homepage" className="flex items-center space-x-2">
            <div className="logo-icon w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center transition-all duration-300">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="logo-text text-xl font-bold text-gray-900 transition-all duration-300">Quizz</span>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav ref={navRef} className="hidden md:flex space-x-6">
          {navigationLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-all duration-300 relative overflow-hidden"
              onMouseEnter={(e) => handleNavLinkHover(e.currentTarget, true)}
              onMouseLeave={(e) => handleNavLinkHover(e.currentTarget, false)}
            >
              <span className="relative z-10">{link.name}</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-400 to-pink-400 transition-all duration-300 hover:w-full"></div>
            </Link>
          ))}
        </nav>

        {/* Right: User/Auth Buttons */}
        <div ref={userActionsRef} className="flex items-center space-x-4">
          {isLoggedIn ? (
            <>
              {/* Notification Bell */}
              <div ref={notificationRef}>
                <Link to="/notifications">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative transition-all duration-300 hover:scale-110 hover:bg-orange-50"
                    onClick={(e) => {
                      handleButtonClick(e.currentTarget)
                      animateNotification()
                    }}
                  >
                    <Bell className="bell-icon h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="notification-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-9 w-auto px-2 flex items-center space-x-2 transition-all duration-300 hover:scale-105 hover:bg-orange-50"
                    onClick={(e) => handleButtonClick(e.currentTarget)}
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-orange-200 transition-all duration-300">
                      <AvatarImage src={userAvatarUrl || "/placeholder.svg?height=32&width=32"} alt={userName} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white text-sm">
                        {userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline text-sm font-medium text-gray-800">{userName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 animate-in slide-in-from-top-2 duration-300" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email || "user@example.com"}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild className="transition-all duration-200 hover:bg-orange-50">
                      <Link to="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {user && userUtils.isAdmin(user) && (
                      <DropdownMenuItem asChild className="transition-all duration-200 hover:bg-orange-50">
                        <Link to="/admin">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Quản trị hệ thống</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600 cursor-pointer transition-all duration-200 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex space-x-2">
              <Button
                variant="outline"
                className="h-9 px-4 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent transition-all duration-300 hover:scale-105 hover:shadow-md"
                onClick={(e) => handleButtonClick(e.currentTarget)}
              >
                Login
              </Button>
              <Button 
                className="h-9 px-4 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={(e) => handleButtonClick(e.currentTarget)}
              >
                Register
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                className="transition-all duration-300 hover:scale-110 hover:bg-orange-50"
                onClick={(e) => handleButtonClick(e.currentTarget)}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <span>Quizz</span>
                </SheetTitle>
                <SheetDescription className="sr-only">Main navigation and user options.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                {navigationLinks.map((link, index) => (
                  <Link
                    key={link.name}
                    to={link.to}
                    className="text-lg font-medium text-gray-700 hover:text-orange-600 transition-all duration-300 hover:translate-x-2"
                    style={{
                      opacity: 0,
                      transform: 'translateX(-20px)',
                      animation: `slideInLeft 0.3s ease-out forwards ${index * 0.1}s`
                    }}
                  >
                    {link.name}
                  </Link>
                ))}
                <Separator className="my-4" />
                {isLoggedIn ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userAvatarUrl || "/placeholder.svg?height=40&width=40"} alt={userName} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white">
                          {userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-base font-medium text-gray-800">{userName}</span>
                        <span className="text-sm text-muted-foreground">{user?.email || "user@example.com"}</span>
                      </div>
                    </div>
                    <Link to="/notifications" className="w-full">
                      <Button variant="ghost" className="justify-start text-gray-700 hover:text-orange-600 w-full transition-all duration-300 hover:bg-orange-50">
                        <Bell className="mr-2 h-4 w-4" />
                        Thông báo
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </Button>
                    </Link>
                    <Link to="/profile" className="w-full">
                      <Button variant="ghost" className="justify-start text-gray-700 hover:text-orange-600 w-full transition-all duration-300 hover:bg-orange-50">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                    </Link>
                    {user && userUtils.isAdmin(user) && (
                      <Link to="/admin" className="w-full">
                        <Button variant="ghost" className="justify-start text-gray-700 hover:text-orange-600 w-full transition-all duration-300 hover:bg-orange-50">
                          <Shield className="mr-2 h-4 w-4" />
                          Quản trị hệ thống
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="ghost" 
                      className="justify-start text-red-600 hover:text-red-700 w-full transition-all duration-300 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="outline"
                      className="h-10 px-4 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent transition-all duration-300"
                    >
                      Login
                    </Button>
                    <Button className="h-10 px-4 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white transition-all duration-300">
                      Register
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Custom CSS for mobile menu animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `
      }} />
    </header>
  )
}