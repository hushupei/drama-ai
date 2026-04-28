import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import MainLayout from '@/components/layout/MainLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import NovelListPage from '@/pages/novel/NovelListPage'
import NovelDetailPage from '@/pages/novel/NovelDetailPage'
import ProjectListPage from '@/pages/project/ProjectListPage'
import ProjectDetailPage from '@/pages/project/ProjectDetailPage'
import CharacterManagePage from '@/pages/character/CharacterManagePage'
import EpisodeGeneratePage from '@/pages/episode/EpisodeGeneratePage'
import VideoPreviewPage from '@/pages/episode/VideoPreviewPage'
import ScriptDetailPage from '@/pages/episode/ScriptDetailPage'
import ScriptListPage from '@/pages/episode/ScriptListPage'
import VideoGalleryPage from '@/pages/episode/VideoGalleryPage'
import TaskHistoryPage from '@/pages/task/TaskHistoryPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return !isAuthenticated ? <>{children}</> : <Navigate to="/novels" />
}

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/novels" />} />
        <Route path="novels" element={<NovelListPage />} />
        <Route path="novels/:id" element={<NovelDetailPage />} />
        <Route path="novels/:novelId/characters" element={<CharacterManagePage />} />
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="projects/:projectId/episodes/:episodeId/generate" element={<EpisodeGeneratePage />} />
        <Route path="projects/:projectId/episodes/:episodeId/preview" element={<VideoPreviewPage />} />
        <Route path="projects/:projectId/episodes/:episodeId/script" element={<ScriptDetailPage />} />
        <Route path="scripts" element={<ScriptListPage />} />
        <Route path="videos" element={<VideoGalleryPage />} />
        <Route path="tasks/history" element={<TaskHistoryPage />} />
      </Route>
    </Routes>
  )
}
