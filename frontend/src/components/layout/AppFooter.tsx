"use client"
import { BookOpen } from "lucide-react"

export function AppFooter() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    { name: "Contact", href: "#contact" },
    { name: "About Us", href: "#about" },
    { name: "Help & FAQ", href: "#help" },
    { name: "Privacy Policy", href: "#privacy" },
  ]

  return (
    <footer className="bg-gray-100 py-8 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Copyright and App Name */}
        <div className="flex items-center space-x-2 text-gray-600 text-sm">
          <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-pink-400 rounded-md flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span>&copy; {currentYear} QuizMaster. All rights reserved.</span>
        </div>

        {/* Right: Navigation Links */}
        <nav className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
