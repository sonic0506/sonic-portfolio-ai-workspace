import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { Layout } from '@/components/layout'
import { AuthGate } from '@/features/auth'
import { meQueryKey } from '@/features/auth-queries'
import { ApiError } from '@/lib/api'
import { FaqEditPage } from '@/pages/faq-edit-page'
import { FaqListPage } from '@/pages/faq-list-page'
import { PostEditPage } from '@/pages/post-edit-page'
import { PostListPage } from '@/pages/post-list-page'
import { ProfilePage } from '@/pages/profile-page'
import { ProjectEditPage } from '@/pages/project-edit-page'
import { ProjectListPage } from '@/pages/project-list-page'
import { RagPage } from '@/pages/rag-page'
import { TaxonomyPage } from '@/pages/taxonomy-page'
import { UnansweredPage } from '@/pages/unanswered-page'
import './index.css'

// 세션이 끊겨 401이 오면 로그인 화면으로 돌아간다.
const onError = (error: Error) => {
  if (error instanceof ApiError && error.status === 401) queryClient.setQueryData(meQueryKey, null)
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError }),
  mutationCache: new MutationCache({ onError }),
  defaultOptions: {
    queries: {
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createBrowserRouter([
  {
    element: (
      <AuthGate>
        <Layout />
      </AuthGate>
    ),
    children: [
      { index: true, element: <Navigate to="/unanswered" replace /> },
      { path: 'projects', element: <ProjectListPage /> },
      { path: 'projects/new', element: <ProjectEditPage /> },
      { path: 'projects/:id', element: <ProjectEditPage /> },
      { path: 'posts', element: <PostListPage /> },
      { path: 'posts/new', element: <PostEditPage /> },
      { path: 'posts/:id', element: <PostEditPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'taxonomy', element: <TaxonomyPage /> },
      { path: 'unanswered', element: <UnansweredPage /> },
      { path: 'faqs', element: <FaqListPage /> },
      { path: 'faqs/new', element: <FaqEditPage /> },
      { path: 'faqs/:id', element: <FaqEditPage /> },
      { path: 'rag', element: <RagPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
