"use client"
import { Link } from "react-router-dom"
import { BookOpen, Menu, LogOut, User, Settings, HelpCircle } from "lucide-react"
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

interface AppHeaderProps {
  isLoggedIn?: boolean
  userName?: string
  userAvatarUrl?: string
}

export function AppHeader({ isLoggedIn = true, userName = "John Doe", userAvatarUrl }: AppHeaderProps) {
  const navigationLinks = [
    { name: "Home", to: "/" },
    { name: "My Quizzes", to: "/my-quizzes" },
    { name: "History", to: "/history" },
    { name: "Upgrade", to: "/upgrade" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: App Logo and Name */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">QuizMaster</span>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          {navigationLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right: User/Auth Buttons */}
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-auto px-2 flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
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
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">m@example.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Support</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex space-x-2">
              <Button
                variant="outline"
                className="h-9 px-4 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
              >
                Login
              </Button>
              <Button className="h-9 px-4 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white">
                Register
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
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
                  <span>QuizMaster</span>
                </SheetTitle>
                <SheetDescription className="sr-only">Main navigation and user options.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.to}
                    className="text-lg font-medium text-gray-700 hover:text-orange-600 transition-colors"
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
                        <span className="text-sm text-muted-foreground">m@example.com</span>
                      </div>
                    </div>
                    <Button variant="ghost" className="justify-start text-gray-700 hover:text-orange-600">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                    <Button variant="ghost" className="justify-start text-gray-700 hover:text-orange-600">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                    <Button variant="ghost" className="justify-start text-gray-700 hover:text-orange-600">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Support
                    </Button>
                    <Button variant="ghost" className="justify-start text-red-600 hover:text-red-700">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="outline"
                      className="h-10 px-4 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                    >
                      Login
                    </Button>
                    <Button className="h-10 px-4 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white">
                      Register
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
