"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "./components/layout/AppHeader"
import { AppFooter } from "./components/layout/AppFooter"
import QuizAuthPage from "./components/auth/QuizAuthPage"
import UpgradePremiumPage from "./components/quizzes/UpgradePremiumPage"
import QuizTakingPage from "./components/quizzes/QuizTakingPage"
import Quizhomepage from "./components/quizzes/QuizHomepage"
import QuizHistoryPage from "./components/quizzes/QuizHistoryPage"
import CreateQuizPage from "./components/teachers/CreateQuizPage"
import ManageQuizzesPage from "./components/teachers/ManageQuizzesPage"
import AdminDashboardPage from "./components/teachers/admin/AdminDashboardPage"
import UserDashboardPage from "./components/quizzes/UserDashboard"
import QuizResultPage from "./components/quizzes/QuizResultPage"
import PaymentMethodSelectionPage from "./components/quizzes/PaymentMethod"
import PaymentSuccessPage from "./components/quizzes/PaymentSuccess"
import PaymentFailurePage from "./components/quizzes/PaymentFail"
import NotificationsPage from "./components/quizzes/NotificationsPage"
import EditQuizPage from "./components/teachers/EditQuizzes"
import AdminEditUserPage from "./components/teachers/admin/AdminEditUser"
import QuizTypeSelectorPage from "./components/teachers/QuizTypeSelectorPage"
import ImportQuizPage from "./components/teachers/ImportQuizPage"
import QuizLeaderboardPage from "./components/quizzes/QuizLeaderboardPage"
import AllQuizzesPage from "./components/quizzes/AllQuizzesPage"
import { Routes, Route, useLocation } from "react-router-dom"
import { authAPI } from "./services/api"
import type { User } from "./types/types"

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const location = useLocation()

  // Check authentication status on app load
  useEffect(() => {
    console.log("🔍 Checking authentication status...")
    const currentUser = authAPI.getCurrentUser()
    const token = authAPI.getToken()

    if (currentUser && token) {
      console.log("✅ User authenticated:", currentUser.name)
      setUser(currentUser)
      setIsAuthenticated(true)
    } else {
      console.log("❌ No authenticated user found")
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  // Update auth state when location changes (after login/logout) - but avoid conflicts
  useEffect(() => {
    // Only check auth state on specific route changes that matter
    if (location.pathname === "/homepage" || location.pathname.startsWith("/profile")) {
      console.log("🔄 Checking auth state due to route change to:", location.pathname)
      const currentUser = authAPI.getCurrentUser()
      const token = authAPI.getToken()

      if (currentUser && token) {
        console.log("✅ Auth state updated from route change")
        setUser(currentUser)
        setIsAuthenticated(true)
      } else {
        console.log("❌ Auth state cleared from route change")
        setUser(null)
        setIsAuthenticated(false)
      }
    }
  }, [location])

  // Don't show header/footer on auth page
  const isAuthPage = location.pathname === "/"

  return (
    <>
      {!isAuthPage && <AppHeader isLoggedIn={isAuthenticated} userName={user?.name || "Guest"} user={user} />}
      <main className={isAuthPage ? "" : "min-h-[calc(100vh-64px-56px)]"}>
        <Routes>
          <Route path="/" element={<QuizAuthPage />} />
          <Route path="/result" element={<QuizResultPage />} />
          <Route path="/history" element={<QuizHistoryPage />} />
          <Route path="/homepage" element={<Quizhomepage />} />
          <Route path="/quiz-taking" element={<QuizTakingPage />} />
          <Route path="/quizzes/taking" element={<QuizTakingPage />} />
          <Route path="/test" element={<QuizTakingPage />} />
          <Route path="/upgrade" element={<UpgradePremiumPage />} />
          <Route path="/quiz-type-selector" element={<QuizTypeSelectorPage />} />
          <Route path="/import-quiz" element={<ImportQuizPage />} />
          <Route path="/create" element={<CreateQuizPage />} />
          <Route path="/manage" element={<ManageQuizzesPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/profile" element={<UserDashboardPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/payment" element={<PaymentMethodSelectionPage />} />
          <Route path="/payment/:packageId" element={<PaymentMethodSelectionPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-fail" element={<PaymentFailurePage />} />
          <Route path="/edit/:quizId" element={<EditQuizPage />} />
          <Route path="/adminedituser/:userId" element={<AdminEditUserPage />} />
          <Route path="/leaderboard/:quizId" element={<QuizLeaderboardPage />} />
          <Route path="/quizzes" element={<AllQuizzesPage />} />
        </Routes>
      </main>
      {!isAuthPage && <AppFooter />}
    </>
  )
}

export default App
