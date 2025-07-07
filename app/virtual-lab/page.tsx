"use client"

import type React from "react"
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

// Dynamically import the dashboard components
// Note: Please ensure these paths match your project structure.
import StudentDashboard from "./components/StudentDashboard"
import TeacherDashboard from "./components/TeacherDashboard"

// =================================================================
// 1. Type Definitions
// =================================================================
interface UserType {
  id: string
  name: string
  email: string
  role: "student" | "teacher" | "admin"
}

// =================================================================
// 2. API Request Functions
// =================================================================
const API_BASE_URL = "http://localhost:8080/api/v1"

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken")
  }
  return null
}

/**
 * Fetches the current user's profile information from the backend.
 * It processes the role array from the backend to a single role string.
 */
const fetchUser = async (): Promise<UserType> => {
  const token = getAuthToken()
  if (!token) throw new Error("用户未登录或Token已失效")

  const response = await fetch(`${API_BASE_URL}/me/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "获取用户信息失败" }))
    throw new Error(errorData.message || `请求失败: ${response.status}`)
  }

  const backendUser = await response.json()

  // Helper function to determine user role from the backend's role array
  const processRole = (roles: string[] = []): "student" | "teacher" | "admin" => {
    const firstRole = (roles[0] || "").toUpperCase()
    if (firstRole === "ROLE_STUDENT") return "student"
    if (firstRole === "ROLE_TEACHER") return "teacher"
    if (firstRole === "ROLE_ADMIN") return "admin"
    return "student" // Default role if none match
  }

  return {
    id: String(backendUser.id),
    name: backendUser.realName || backendUser.username || "未命名用户",
    email: backendUser.email || "",
    role: processRole(backendUser.roles),
  }
}

// =================================================================
// 3. Main Page Component (VirtualLabPage & Wrapper)
// =================================================================
const queryClient = new QueryClient()

// This is the root component you should use in your Next.js page file.
// It provides the React Query context to all child components.
export default function VirtualLabPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <VirtualLabPage />
    </QueryClientProvider>
  )
}

/**
 * The main page component that fetches user data and renders the correct dashboard.
 */
function VirtualLabPage() {
  const { data: user, isLoading, error, refetch } = useQuery<UserType>({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 15, // Data stays fresh for 15 minutes
    retry: 1, // Retry once on failure
  })

  // Loading state UI
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-lg p-8 space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  // Error state UI
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-800 p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold mb-2">加载错误</h2>
          <p className="mb-4">无法获取您的用户信息。请检查您的网络连接或尝试重新登录。</p>
          <p className="text-sm text-red-600 font-mono bg-red-100 p-2 rounded mb-6">
            错误详情: {error.message}
          </p>
          <Button onClick={() => refetch()}>
            重试
          </Button>
        </div>
      </div>
    )
  }

  // Render the appropriate dashboard based on the user's role
  if (user) {
    switch (user.role) {
      case 'student':
        return <StudentDashboard user={user} />
      case 'teacher':
        return <TeacherDashboard user={user} />
      case 'admin':
        // Admin dashboard can be developed here
        return <TeacherDashboard user={user} /> // Admin can use teacher's view for now
      default:
        return <div className="p-8 text-center">未知的用户角色。</div>
    }
  }

  // Fallback if no user data is available after loading and no error occurred
  return <div className="p-8 text-center">无法加载用户数据。</div>
}
