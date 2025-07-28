import { AppHeader } from './components/layout/AppHeader'
import { AppFooter } from './components/layout/AppFooter'
import QuizAuthPage from './components/auth/QuizAuthPage'
import UpgradePremiumPage from './components/quizzes/UpgradePremiumPage'
import QuizTakingPage from './components/quizzes/QuizTakingPage'
import Quizhomepage from './components/quizzes/QuizHomepage'
import QuizHistoryPage from './components/quizzes/QuizHistoryPage'
import CreateQuizPage from './components/teachers/CreateQuizPage'
import ManageQuizzesPage from './components/teachers/ManageQuizzesPage'
import AdminDashboardPage from './components/teachers/admin/AdminDashboardPage'
import UserDashboardPage from './components/quizzes/UserDashboard'
import QuizResultPage from './components/quizzes/QuizResultPage' // ví dụ thêm trang kết quả
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <>
      <AppHeader isLoggedIn={true} userName="Guest" />
      <main className="min-h-[calc(100vh-64px-56px)] flex flex-col justify-center">
        <Routes>
          <Route path="/" element={<QuizAuthPage />} />
          <Route path="/result" element={<QuizResultPage isPremium={false} />} />
          <Route path="/history" element={<QuizHistoryPage />} />
          <Route path="/homepage" element={<Quizhomepage />} />
          <Route path="/test" element={<QuizTakingPage />} />
          <Route path="/upgrade" element={<UpgradePremiumPage />} />
          <Route path="/create" element={<CreateQuizPage />} />
          <Route path="/manage" element={<ManageQuizzesPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/profile" element={<UserDashboardPage />} />
        </Routes>
      </main>
      <AppFooter />
    </>
  )
}

export default App