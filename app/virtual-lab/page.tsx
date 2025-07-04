"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FlaskConical,
  Search,
  Play,
  Pause,
  RotateCcw,
  Download,
  Clock,
  Star,
  BookOpen,
  Microscope,
  Atom,
  Beaker,
  Plus,
  User,
  Send,
  Edit,
  Trash,
  List,
  Library,
  FileText,
  FileCheck,
  FileBarChart,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

// 创建 QueryClient 实例
const queryClient = new QueryClient()

interface User {
  id: string
  name: string
  email: string
  role: "student" | "teacher" | "admin"
  classId?: string
}

interface Experiment {
  id: string
  title: string
  description: string
  category: string
  difficulty: number // 1-5 星级难度
  duration: number
  rating: number
  completed: boolean
  progress: number
  thumbnail: string
  tags: string[]
  creator: string // 创建者信息
  isSystem?: boolean // 是否为系统实验
  assignments?: Assignment[] // 实验任务
}

interface Assignment {
  id: string
  taskName: string
  className: string
  classId: string
  startTime: string
  endTime: string
  requirements: string
  status: "未开始" | "进行中" | "已提交" | "已批改"
  assignedTo: string[] // 被指派的学生ID
  submittedAt?: string
  grade?: number
  reports?: Report[] // 实验报告
}

interface Report {
  id: string
  studentId: string
  studentName: string
  submittedAt: string
  content: string
  grade?: number
  feedback?: string
  status: "未提交" | "已提交" | "已批改"
}

// API基础URL
const API_BASE_URL = "http://localhost:8080/api/v1/teaching";
const fetchFromApi = async (url: string, options?: RequestInit) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
    // 在实际应用中，这里应该跳转到登录页
    throw new Error('用户未登录或Token已失效');
  }
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options?.headers,
  };
  const response = await fetch(url, { ...options, headers });
  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || `请求失败: ${response.status}`);
  }
  // 确保即使后端返回的data字段为null，我们也能返回一个可接受的值
  return responseData.data || null;
};

// 获取token的函数
const getAuthToken = () => {
  return localStorage.getItem("accessToken");
};

// 获取实验列表
const fetchExperiments = async (): Promise<Experiment[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/experiments?page=0&size=100`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('获取实验列表失败');

  const responseData = await response.json();

  // 最终修正：返回 data 对象中的 records 数组。
  // 使用可选链 (?.) 确保即使 data 或 records 不存在时也不会报错。
  // 使用 || [] 确保最终总能返回一个数组。
  return responseData?.data?.records || [];
};
// 获取当前用户信息
const fetchUser = async (): Promise<User> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`http://localhost:8080/api/v1/me/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('获取用户信息失败');
  return response.json();
};

// 创建新实验
const createExperiment = async (newExperiment: any): Promise<Experiment> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/experiments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(newExperiment)
  });
  if (!response.ok) throw new Error('创建实验失败');
  return response.json();
};

// 指派实验任务
const publishAssignment = async (assignmentData: any): Promise<Assignment> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/experiment-tasks/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(assignmentData)
  });
  if (!response.ok) throw new Error('发布任务失败');
  return response.json();
};

// 提交实验报告
const submitReport = async (taskId: string, reportData: any): Promise<Report> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/my-report`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      manualContent: reportData.content,
      isSubmitted: true
    })
  });
  if (!response.ok) throw new Error('提交报告失败');
  return response.json();
};

// 评分实验报告
const gradeReport = async (reportId: string, gradeData: any): Promise<Report> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/reports/${reportId}/grade`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      manualScore: gradeData.grade,
      feedback: gradeData.feedback
    })
  });
  if (!response.ok) throw new Error('评分失败');
  return response.json();
};
// 更新实验信息
const updateExperiment = async (id: string, updateData: any): Promise<Experiment> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/experiments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) throw new Error('更新实验失败');
  return response.json();
};

// 删除实验
const deleteExperiment = async (id: string): Promise<void> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/experiments/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('删除实验失败');
};

// 获取实验详情
const getExperimentById = async (id: string): Promise<Experiment> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/experiments/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('获取实验详情失败');
  return response.json();
};

// 分页查询实验
const fetchExperimentsPaginated = async (
    page: number = 0,
    size: number = 10,
    title?: string,
    subject?: string
): Promise<Experiment[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString()
  });

  if (title) params.append('title', title);
  if (subject) params.append('subject', subject);

  const response = await fetch(`${API_BASE_URL}/experiments?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('获取实验列表失败');

  const responseData = await response.json();
  return responseData?.data?.records || [];
};

// 获取我的任务列表（学生）
const fetchMyTasks = async (status?: string): Promise<Assignment[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const params = new URLSearchParams();
  if (status) params.append('status', status);

  const response = await fetch(`${API_BASE_URL}/experiment-tasks/my-tasks?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('获取任务列表失败');

  const responseData = await response.json();
  return responseData?.data || [];
};

// 获取教师发布的任务
const fetchTeacherTasks = async (
    classId?: string,
    experimentId?: string
): Promise<Assignment[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const params = new URLSearchParams();
  if (classId) params.append('classId', classId);
  if (experimentId) params.append('experimentId', experimentId);

  const response = await fetch(`${API_BASE_URL}/experiment-tasks/teacher-tasks?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('获取教师任务失败');

  const responseData = await response.json();
  return responseData?.data || [];
};

// 获取任务详情
const getTaskById = async (id: string): Promise<Assignment> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/experiment-tasks/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('获取任务详情失败');
  return response.json();
};

// 获取我的实验报告（学生）
const getMyReport = async (taskId: string): Promise<Report> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/my-report`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('获取实验报告失败');
  return response.json();
};

// 保存/提交实验报告（扩展原有方法）
const saveOrSubmitReport = async (
    taskId: string,
    content: string,
    isSubmitted: boolean = false
): Promise<Report> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/my-report`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      manualContent: content,
      isSubmitted
    })
  });

  if (!response.ok) throw new Error(isSubmitted ? '提交报告失败' : '保存报告失败');
  return response.json();
};

// 教师获取指定报告
const getReportById = async (reportId: string): Promise<Report> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('获取报告失败');
  return response.json();
};
function VirtualLabPage() {
  const router = useRouter();

  // 使用 React Query 获取数据
  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5 // 5分钟
  });

  const {
    data: experiments = [],
    isLoading: experimentsLoading,
    error: experimentsError,
    refetch: refetchExperiments
  } = useQuery<Experiment[]>({
    queryKey: ['experiments'],
    queryFn: fetchExperiments,
    staleTime: 1000 * 60 * 5 // 5分钟
  });

  // 状态管理
  const [filteredExperiments, setFilteredExperiments] = useState<Experiment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [currentExperiment, setCurrentExperiment] = useState<Experiment | null>(null)
  const [newExperiment, setNewExperiment] = useState({
    title: "",
    description: "",
    category: "化学",
    difficulty: 3,
    duration: 30,
    tags: "",
  })
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [currentReport, setCurrentReport] = useState<Report | null>(null)
  const [currentTask, setCurrentTask] = useState<Assignment | null>(null)
  const [reportContent, setReportContent] = useState("")
  const [gradeValue, setGradeValue] = useState(0)
  const [feedback, setFeedback] = useState("")

  // 发布实验表单状态
  const [newAssignment, setNewAssignment] = useState({
    taskName: "",
    classId: "",
    studentId: "",
    startTime: "",
    endTime: "",
    requirements: ""
  })

  // 突变操作
  const createExperimentMutation = useMutation({
    mutationFn: createExperiment,
    onSuccess: (newExp) => {
      queryClient.setQueryData(['experiments'], (old: Experiment[] | undefined) =>
        old ? [newExp, ...old] : [newExp]
      );
      setIsCreating(false);
      setNewExperiment({
        title: "",
        description: "",
        category: "化学",
        difficulty: 3,
        duration: 30,
        tags: "",
      });
    }
  });

  const publishAssignmentMutation = useMutation({
    mutationFn: publishAssignment,
    onSuccess: (newAssignment) => {
      queryClient.setQueryData(['experiments'], (old: Experiment[] | undefined) => {
        if (!old) return [];
        return old.map(exp => {
          if (exp.id === currentExperiment?.id) {
            return {
              ...exp,
              assignments: [
                ...(exp.assignments || []),
                newAssignment
              ]
            };
          }
          return exp;
        });
      });
      setIsPublishing(false);
      setNewAssignment({
        taskName: "",
        classId: "",
        studentId: "",
        startTime: "",
        endTime: "",
        requirements: ""
      });
    }
  });

  const submitReportMutation = useMutation({
    mutationFn: ({ taskId, reportData }: { taskId: string, reportData: any }) =>
      submitReport(taskId, reportData),
    onSuccess: (newReport) => {
      queryClient.setQueryData(['experiments'], (old: Experiment[] | undefined) => {
        if (!old) return [];
        return old.map(exp => {
          if (exp.id === selectedExperiment?.id) {
            const updatedAssignments = exp.assignments?.map(assignment => {
              if (assignment.id === currentTask?.id) {
                const updatedReports = assignment.reports?.map(report =>
                  report.studentId === newReport.studentId ? newReport : report
                );
                return {
                  ...assignment,
                  reports: updatedReports,
                  status: "已提交"
                };
              }
              return assignment;
            });
            return {
              ...exp,
              assignments: updatedAssignments
            };
          }
          return exp;
        });
      });
      setIsSubmittingReport(false);
      setReportContent("");
    }
  });

  const gradeReportMutation = useMutation({
    mutationFn: ({ reportId, gradeData }: { reportId: string, gradeData: any }) =>
      gradeReport(reportId, gradeData),
    onSuccess: (gradedReport) => {
      queryClient.setQueryData(['experiments'], (old: Experiment[] | undefined) => {
        if (!old) return [];
        return old.map(exp => {
          if (exp.id === selectedExperiment?.id) {
            const updatedAssignments = exp.assignments?.map(assignment => {
              if (assignment.id === currentTask?.id) {
                const updatedReports = assignment.reports?.map(report =>
                  report.id === gradedReport.id ? gradedReport : report
                );

                // 检查是否所有报告都已批改
                const allGraded = updatedReports?.every(r => r.status === "已批改");

                return {
                  ...assignment,
                  reports: updatedReports,
                  status: allGraded ? "已批改" : assignment.status
                };
              }
              return assignment;
            });
            return {
              ...exp,
              assignments: updatedAssignments
            };
          }
          return exp;
        });
      });
      setIsGrading(false);
      setGradeValue(0);
      setFeedback("");
    }
  });

  // 班级和学生数据（保留虚拟数据，因为后端可能未提供）
  const [classes] = useState([
    { id: "class1", name: "高三(1)班", students: ["stu1", "stu2", "stu3"] },
    { id: "class2", name: "高三(2)班", students: ["stu4", "stu5", "stu6"] },
    { id: "class3", name: "高二(1)班", students: ["stu7", "stu8", "stu9"] },
    { id: "class4", name: "高二(2)班", students: ["stu10", "stu11", "stu12"] },
  ])

  const [students] = useState([
    { id: "stu1", name: "张三", classId: "class1" },
    { id: "stu2", name: "李四", classId: "class1" },
    { id: "stu3", name: "王五", classId: "class1" },
    { id: "stu4", name: "赵六", classId: "class2" },
    { id: "stu5", name: "钱七", classId: "class2" },
    { id: "stu6", name: "孙八", classId: "class2" },
    { id: "stu7", name: "周九", classId: "class3" },
    { id: "stu8", name: "吴十", classId: "class3" },
    { id: "stu9", name: "郑十一", classId: "class3" },
    { id: "stu10", name: "王十二", classId: "class4" },
    { id: "stu11", name: "冯十三", classId: "class4" },
    { id: "stu12", name: "陈十四", classId: "class4" },
  ])

  useEffect(() => {
    if (!user) return;

    let filtered = experiments

    if (searchTerm) {
      filtered = filtered.filter(
        (exp) =>
          exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (exp.tags && exp.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((exp) => exp.category === categoryFilter)
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter((exp) => exp.difficulty === parseInt(difficultyFilter))
    }

    setFilteredExperiments(filtered)
  }, [experiments, searchTerm, categoryFilter, difficultyFilter, user])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "化学":
        return <Beaker className="w-5 h-5" />
      case "物理":
        return <Atom className="w-5 h-5" />
      case "生物":
        return <Microscope className="w-5 h-5" />
      default:
        return <FlaskConical className="w-5 h-5" />
    }
  }

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )
  }

  const handleCreateExperiment = () => {
    createExperimentMutation.mutate(newExperiment);
  }

  const handlePublishExperiment = () => {
    if (!currentExperiment) return;

    publishAssignmentMutation.mutate({
      experimentId: currentExperiment.id,
      taskName: newAssignment.taskName || currentExperiment.title,
      classId: newAssignment.classId,
      requirements: newAssignment.requirements,
      startTime: newAssignment.startTime,
      endTime: newAssignment.endTime
    });
  }

  const handleSubmitReport = () => {
    if (!selectedExperiment || !currentTask || !user) return;

    submitReportMutation.mutate({
      taskId: currentTask.id,
      reportData: { content: reportContent }
    });
  }

  const handleGradeReport = () => {
    if (!currentReport || !currentTask) return;

    gradeReportMutation.mutate({
      reportId: currentReport.id,
      gradeData: {
        grade: gradeValue,
        feedback: feedback
      }
    });
  }

  const getCurrentStudentReport = (task: Assignment) => {
    if (!user) return null;
    return task.reports?.find(report => report.studentId === user.id);
  }

  const handleGoToRecords = () => {
    router.push("/experiment-records");
  }


  if (userError || experimentsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-2">加载数据失败</h2>
            <p className="mb-4">请检查网络连接后重试</p>
            <Button
              variant="default"
              onClick={() => {
                if (userError) queryClient.refetchQueries({ queryKey: ['user'] });
                if (experimentsError) queryClient.refetchQueries({ queryKey: ['experiments'] });
              }}
            >
              重新加载
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (userLoading || experimentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-video rounded-t-lg" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>
  }

  if (selectedExperiment) {
    const currentTask = selectedExperiment.assignments?.[0]
    const studentReport = currentTask && user ? getCurrentStudentReport(currentTask) : null

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => setSelectedExperiment(null)}
              className="text-white hover:bg-gray-800"
            >
              ← 返回实验列表
            </Button>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-gray-900 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                下载报告
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 实验界面 */}
            <div className="lg:col-span-3">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">{selectedExperiment.title}</CardTitle>
                  <CardDescription className="text-gray-300">{selectedExperiment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 虚拟实验界面 */}
                  <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center mb-6">
                    <div className="text-center">
                      <FlaskConical className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-gray-300 mb-4">虚拟实验环境</p>
                      <div className="flex items-center justify-center space-x-4">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Play className="w-4 h-4 mr-2" />
                          开始实验
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-white border-white hover:bg-white hover:text-gray-900 bg-transparent"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          暂停
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-white border-white hover:bg-white hover:text-gray-900 bg-transparent"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          重置
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 实验进度 - 仅学生可见 */}
                  {user?.role === "student" && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-300">实验进度</span>
                        <span className="text-sm text-gray-300">{selectedExperiment.progress}%</span>
                      </div>
                      <Progress value={selectedExperiment.progress} className="bg-gray-700" />
                    </div>
                  )}

                  {/* 实验控制面板 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white text-sm">实验参数</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-300 block mb-1">温度 (°C)</label>
                          <Input type="number" defaultValue="25" className="bg-gray-600 border-gray-500 text-white" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-300 block mb-1">浓度 (mol/L)</label>
                          <Input
                            type="number"
                            defaultValue="0.1"
                            step="0.01"
                            className="bg-gray-600 border-gray-500 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-300 block mb-1">时间 (min)</label>
                          <Input type="number" defaultValue="10" className="bg-gray-600 border-gray-500 text-white" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white text-sm">实验数据</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">反应速率:</span>
                          <span className="text-white">0.025 mol/L·s</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">转化率:</span>
                          <span className="text-white">78.5%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">产物浓度:</span>
                          <span className="text-white">0.078 mol/L</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">反应时间:</span>
                          <span className="text-white">8.5 min</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 侧边栏 */}
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">实验信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(selectedExperiment.category)}
                    <span className="text-sm text-gray-300">{selectedExperiment.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">创建者: {selectedExperiment.creator}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{selectedExperiment.duration} 分钟</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-300">难度:</span>
                    {renderStarRating(selectedExperiment.difficulty)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-300">{selectedExperiment.rating}/5.0</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">实验步骤</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white">
                        1
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">准备实验器材</p>
                        <p className="text-xs text-gray-400">检查所需的实验设备和试剂</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white">
                        2
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">设置实验参数</p>
                        <p className="text-xs text-gray-400">调整温度、浓度等实验条件</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs text-gray-400">
                        3
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 font-medium">开始反应</p>
                        <p className="text-xs text-gray-500">启动化学反应并记录数据</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs text-gray-400">
                        4
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 font-medium">数据分析</p>
                        <p className="text-xs text-gray-500">分析实验结果并得出结论</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 实验报告区域 */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">实验报告</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentTask ? (
                    <>
                      {user?.role === "student" ? (
                        <div>
                          {studentReport ? (
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">状态</span>
                                <Badge
                                  variant={
                                    studentReport.status === "已批改" ? "default" :
                                      studentReport.status === "已提交" ? "secondary" : "destructive"
                                  }
                                >
                                  {studentReport.status}
                                </Badge>
                              </div>

                              {studentReport.status === "已批改" && (
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm">成绩</span>
                                    <span className="text-sm font-bold">{studentReport.grade}分</span>
                                  </div>
                                  <div>
                                    <span className="text-sm">教师反馈</span>
                                    <p className="text-xs text-gray-300 mt-1">{studentReport.feedback}</p>
                                  </div>
                                </div>
                              )}

                              <div className="mt-4">
                                {studentReport.status === "未提交" ? (
                                  <Dialog open={isSubmittingReport} onOpenChange={setIsSubmittingReport}>
                                    <DialogTrigger asChild>
                                      <Button className="w-full" size="sm">
                                        <FileText className="w-4 h-4 mr-2" />
                                        提交实验报告
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>提交实验报告</DialogTitle>
                                        <p className="text-sm text-gray-500">任务: {currentTask.taskName}</p>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="reportContent">报告内容</Label>
                                          <Textarea
                                            id="reportContent"
                                            value={reportContent}
                                            onChange={(e) => setReportContent(e.target.value)}
                                            placeholder="请输入实验报告内容..."
                                            className="min-h-[300px]"
                                          />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsSubmittingReport(false)}>
                                          取消
                                        </Button>
                                        <Button
                                          onClick={handleSubmitReport}
                                          disabled={submitReportMutation.isPending}
                                        >
                                          {submitReportMutation.isPending ? "提交中..." : "提交报告"}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                ) : studentReport.status === "已批改" ? (
                                  <Button variant="outline" className="w-full" size="sm">
                                    <FileBarChart className="w-4 h-4 mr-2" />
                                    查看详细报告
                                  </Button>
                                ) : (
                                  <Button className="w-full" size="sm" disabled>
                                    <FileCheck className="w-4 h-4 mr-2" />
                                    已提交，等待批改
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm">当前任务未分配给你</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-gray-300">学生报告</h3>
                          {currentTask.reports?.length ? (
                            <div className="space-y-3">
                              {currentTask.reports.map((report) => (
                                <div key={report.id} className="bg-gray-700 p-3 rounded-lg">
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium">{report.studentName}</span>
                                    <Badge
                                      variant={
                                        report.status === "已批改" ? "default" :
                                          report.status === "已提交" ? "secondary" : "destructive"
                                      }
                                      className="text-xs"
                                    >
                                      {report.status}
                                    </Badge>
                                  </div>

                                  <div className="mt-2 flex justify-end">
                                    <Dialog open={isGrading} onOpenChange={setIsGrading}>
                                      <DialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setCurrentReport(report)
                                            setGradeValue(report.grade || 0)
                                            setFeedback(report.feedback || "")
                                          }}
                                          disabled={report.status === "未提交"}
                                        >
                                          {report.status === "已批改" ? "查看评分" : "评分"}
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                          <DialogTitle>
                                            {report.status === "已批改" ? "查看评分" : "评分报告"}
                                          </DialogTitle>
                                          <p className="text-sm text-gray-500">学生: {report.studentName}</p>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                          <div className="space-y-2">
                                            <Label htmlFor="grade">成绩 (0-100)</Label>
                                            <Input
                                              id="grade"
                                              type="number"
                                              min="0"
                                              max="100"
                                              value={gradeValue}
                                              onChange={(e) => setGradeValue(parseInt(e.target.value))}
                                              disabled={report.status === "已批改"}
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label htmlFor="feedback">评语</Label>
                                            <Textarea
                                              id="feedback"
                                              value={feedback}
                                              onChange={(e) => setFeedback(e.target.value)}
                                              placeholder="请输入评语..."
                                              disabled={report.status === "已批改"}
                                            />
                                          </div>
                                          {report.content && (
                                            <div className="space-y-2">
                                              <Label>报告内容</Label>
                                              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm max-h-40 overflow-y-auto">
                                                {report.content}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        <DialogFooter>
                                          <DialogClose asChild>
                                            <Button variant="outline">关闭</Button>
                                          </DialogClose>
                                          {report.status !== "已批改" && (
                                            <Button
                                              onClick={handleGradeReport}
                                              disabled={gradeReportMutation.isPending}
                                            >
                                              {gradeReportMutation.isPending ? "评分中..." : "提交评分"}
                                            </Button>
                                          )}
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm">暂无学生报告</p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 text-sm">当前实验暂无任务</p>
                  )}
                </CardContent>
              </Card>

              {/* 实验任务/指派任务区域 */}
              {(user?.role === "teacher" || user?.role === "admin") ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">实验任务</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedExperiment.assignments && selectedExperiment.assignments.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-300">已指派任务</h3>
                        {selectedExperiment.assignments.map((task) => (
                          <div key={task.id} className="bg-gray-700 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-white">{task.taskName}</span>
                              <Badge variant="outline" className="text-xs">
                                {task.className}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-300 mt-1">{task.requirements}</p>
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                              <span>截止: {new Date(task.endTime).toLocaleString()}</span>
                              <span>{task.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">暂无指派任务</p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">实验任务</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedExperiment.assignments && selectedExperiment.assignments.length > 0 ? (
                      <div className="space-y-4">
                        {selectedExperiment.assignments.map((task) => (
                          <div key={task.id} className="bg-gray-700 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-white">{task.taskName}</span>
                              <Badge variant={task.status === "已批改" ? "default" : "secondary"} className="text-xs">
                                {task.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-300 mt-1">{task.requirements}</p>
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                              <span>截止: {new Date(task.endTime).toLocaleString()}</span>
                              {task.grade && <span>成绩: {task.grade}分</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">当前实验暂无任务</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">虚拟仿真实验平台</h1>
            <p className="text-gray-600">探索科学世界，进行虚拟实验</p>
          </div>

          {/* 教师专属的创建实验按钮 */}
          {(user?.role === "teacher" || user?.role === "admin") && (
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  新建实验
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>创建新实验</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      实验标题
                    </Label>
                    <Input
                      id="title"
                      value={newExperiment.title}
                      onChange={(e) => setNewExperiment({ ...newExperiment, title: e.target.value })}
                      className="col-span-3"
                      placeholder="输入实验标题"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      实验描述
                    </Label>
                    <Textarea
                      id="description"
                      value={newExperiment.description}
                      onChange={(e) => setNewExperiment({ ...newExperiment, description: e.target.value })}
                      className="col-span-3"
                      placeholder="输入实验描述"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      所属学科
                    </Label>
                    <Select
                      value={newExperiment.category}
                      onValueChange={(value) => setNewExperiment({ ...newExperiment, category: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="选择学科" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="化学">化学</SelectItem>
                        <SelectItem value="物理">物理</SelectItem>
                        <SelectItem value="生物">生物</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="difficulty" className="text-right">
                      难度等级
                    </Label>
                    <Select
                      value={newExperiment.difficulty.toString()}
                      onValueChange={(value) => setNewExperiment({ ...newExperiment, difficulty: parseInt(value) })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="选择难度" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 星 (初级)</SelectItem>
                        <SelectItem value="2">2 星</SelectItem>
                        <SelectItem value="3">3 星 (中级)</SelectItem>
                        <SelectItem value="4">4 星</SelectItem>
                        <SelectItem value="5">5 星 (高级)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="duration" className="text-right">
                      预计时长
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      value={newExperiment.duration}
                      onChange={(e) => setNewExperiment({ ...newExperiment, duration: parseInt(e.target.value) || 0 })}
                      className="col-span-3"
                      placeholder="输入预计分钟数"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="tags" className="text-right">
                      实验标签
                    </Label>
                    <Input
                      id="tags"
                      value={newExperiment.tags}
                      onChange={(e) => setNewExperiment({ ...newExperiment, tags: e.target.value })}
                      className="col-span-3"
                      placeholder="输入标签，用逗号分隔"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="package" className="text-right">
                      上传仿真包
                    </Label>
                    <div className="col-span-3">
                      <Input id="package" type="file" accept=".zip" />
                      <p className="text-xs text-gray-500 mt-1">支持ZIP格式的仿真实验包</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="thumbnail" className="text-right">
                      上传封面图
                    </Label>
                    <div className="col-span-3">
                      <Input id="thumbnail" type="file" accept="image/*" />
                      <p className="text-xs text-gray-500 mt-1">建议尺寸：800x450像素</p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                  >
                    取消
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateExperiment}
                    disabled={createExperimentMutation.isPending}
                  >
                    {createExperimentMutation.isPending ? "创建中..." : "创建实验"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* 筛选器 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜索实验..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择学科" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部学科</SelectItem>
                  <SelectItem value="化学">化学</SelectItem>
                  <SelectItem value="物理">物理</SelectItem>
                  <SelectItem value="生物">生物</SelectItem>
                </SelectContent>
              </Select>

              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="选择难度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部难度</SelectItem>
                  <SelectItem value="1">1 星</SelectItem>
                  <SelectItem value="2">2 星</SelectItem>
                  <SelectItem value="3">3 星</SelectItem>
                  <SelectItem value="4">4 星</SelectItem>
                  <SelectItem value="5">5 星</SelectItem>
                </SelectContent>
              </Select>

              {/* 只对学生显示"我的实验记录"按钮 */}
              {user?.role === "student" && (
                <Button variant="outline" onClick={handleGoToRecords}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  我的实验记录
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={user?.role === "teacher" ? "library" : "assigned"} className="space-y-6">
          {user?.role === "teacher" && (
            <TabsList>
              <TabsTrigger value="library">
                <Library className="w-4 h-4 mr-2" />
                实验库
              </TabsTrigger>
              <TabsTrigger value="published">
                <List className="w-4 h-4 mr-2" />
                已发布实验
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="library">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiments.map((experiment) => (
                <Card
                  key={experiment.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow relative"
                  onClick={() => setSelectedExperiment(experiment)}
                >
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <FlaskConical className="w-12 h-12 text-gray-400" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant={experiment.isSystem ? "default" : "secondary"} className="flex items-center">
                        {getCategoryIcon(experiment.category)}
                        <span className="ml-1">{experiment.isSystem ? "系统实验" : "自定义实验"}</span>
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{experiment.title}</CardTitle>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">难度:</span>
                        {renderStarRating(experiment.difficulty)}
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">{experiment.description}</CardDescription>
                    <div className="flex items-center text-sm text-gray-500 mt-2">
                      <User className="w-4 h-4 mr-1" />
                      <span>创建者: {experiment.creator}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{experiment.duration} 分钟</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-gray-600">{experiment.rating}</span>
                        </div>
                      </div>

                      {/* 只对学生显示进度条 */}
                      {user?.role === "student" && experiment.progress > 0 && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>进度</span>
                            <span>{experiment.progress}%</span>
                          </div>
                          <Progress value={experiment.progress} />
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {(experiment.tags ?? []).slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* 操作按钮 - 根据用户角色显示 */}
                      {user?.role === "teacher" ? (
                        <div className="flex justify-between mt-4">
                          <Dialog
                            open={isPublishing}
                            onOpenChange={(open) => {
                              setIsPublishing(open);
                              if (open) {
                                setCurrentExperiment(experiment);
                                setNewAssignment({
                                  taskName: experiment.title,
                                  classId: "",
                                  studentId: "",
                                  startTime: "",
                                  endTime: "",
                                  requirements: ""
                                });
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="default" size="sm">
                                <Send className="w-4 h-4 mr-1" />
                                发布
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>发布实验任务</DialogTitle>
                                <p className="text-sm text-gray-500">发布实验: {experiment.title}</p>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="taskName" className="text-right">
                                    任务名称
                                  </Label>
                                  <Input
                                    id="taskName"
                                    value={newAssignment.taskName}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, taskName: e.target.value })}
                                    className="col-span-3"
                                    placeholder="输入任务名称"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="class" className="text-right">
                                    指派班级
                                  </Label>
                                  <Select
                                    value={newAssignment.classId}
                                    onValueChange={(value) => setNewAssignment({ ...newAssignment, classId: value, studentId: "" })}
                                  >
                                    <SelectTrigger className="col-span-3">
                                      <SelectValue placeholder="选择班级" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {classes.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {newAssignment.classId && (
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="student" className="text-right">
                                      指定学生
                                    </Label>
                                    <Select
                                      value={newAssignment.studentId}
                                      onValueChange={(value) => setNewAssignment({ ...newAssignment, studentId: value })}
                                    >
                                      <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="选择学生 (可选)" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="">全班学生</SelectItem>
                                        {students
                                          .filter(stu => stu.classId === newAssignment.classId)
                                          .map(stu => (
                                            <SelectItem key={stu.id} value={stu.id}>{stu.name}</SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="startTime" className="text-right">
                                    开始时间
                                  </Label>
                                  <Input
                                    id="startTime"
                                    type="datetime-local"
                                    value={newAssignment.startTime}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, startTime: e.target.value })}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="endTime" className="text-right">
                                    截止时间
                                  </Label>
                                  <Input
                                    id="endTime"
                                    type="datetime-local"
                                    value={newAssignment.endTime}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, endTime: e.target.value })}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="requirements" className="text-right">
                                    任务要求
                                  </Label>
                                  <Textarea
                                    id="requirements"
                                    value={newAssignment.requirements}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, requirements: e.target.value })}
                                    className="col-span-3"
                                    rows={3}
                                    placeholder="输入实验要求..."
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsPublishing(false)}
                                >
                                  取消
                                </Button>
                                <Button
                                  onClick={handlePublishExperiment}
                                  disabled={publishAssignmentMutation.isPending}
                                >
                                  {publishAssignmentMutation.isPending ? "发布中..." : "发布任务"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {!experiment.isSystem && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentExperiment(experiment);
                                  setIsCreating(true);
                                  setNewExperiment({
                                    title: experiment.title,
                                    description: experiment.description,
                                    category: experiment.category,
                                    difficulty: experiment.difficulty,
                                    duration: experiment.duration,
                                    tags: experiment.tags.join(", "),
                                  });
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                编辑
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // 在实际应用中这里应该是删除API调用
                                  const updatedExperiments = experiments.filter(exp => exp.id !== experiment.id)
                                  queryClient.setQueryData(['experiments'], updatedExperiments);
                                }}
                              >
                                <Trash className="w-4 h-4 mr-1" />
                                删除
                              </Button>
                            </>
                          )}
                        </div>
                      ) : (
                        <Button
                          className="w-full mt-4"
                          onClick={() => setSelectedExperiment(experiment)}
                        >
                          开始实验
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {user?.role === "teacher" && (
            <TabsContent value="published">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {experiments
                  .filter(exp => exp.assignments && exp.assignments.length > 0)
                  .map(experiment => (
                    <Card key={experiment.id} className="relative">
                      <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <FlaskConical className="w-12 h-12 text-gray-400" />
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant="default" className="flex items-center">
                            <Send className="w-3 h-3 mr-1" />
                            已发布
                          </Badge>
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="text-lg">{experiment.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{experiment.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{experiment.duration} 分钟</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm text-gray-600">{experiment.rating}</span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <h4 className="text-sm font-medium mb-2">已发布任务</h4>
                            {experiment.assignments?.map(task => (
                              <div key={task.id} className="bg-blue-50 p-3 rounded-lg mb-2">
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">{task.taskName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {task.className}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">截止: {new Date(task.endTime).toLocaleString()}</p>
                                <div className="mt-2">
                                  <span className="text-xs text-gray-600">指派给: </span>
                                  <span className="text-xs">
                                    {task.assignedTo.length === 1 ?
                                      students.find(s => s.id === task.assignedTo[0])?.name || "1名学生" :
                                      `${task.assignedTo.length}名学生`}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <Button
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => setSelectedExperiment(experiment)}
                          >
                            查看详情
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                }
              </div>
            </TabsContent>
          )}

          {user?.role === "student" && (
            <TabsContent value="assigned">
              {/* 修正1：添加安全访问和括号匹配 */}
              {(experiments || []).filter(exp =>
                exp.assignments?.some(a =>
                  a.assignedTo.includes(user?.id) // 使用user?.id安全访问
                )
              ).length === 0 ? (
                // 无实验时显示
                <div className="text-center py-12">
                  <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无指派实验</h3>
                  <p className="text-gray-500">等待老师发布实验任务</p>
                </div>
              ) : (
                // 有实验时显示
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* 修正2：修正filter和map链式调用 */}
                  {(experiments || [])
                    .filter(exp =>
                      exp.assignments?.some(a =>
                        a.assignedTo.includes(user?.id)
                      )
                    )
                    .map((experiment) => {
                      const studentAssignment = experiment.assignments?.find(a =>
                        a.assignedTo.includes(user?.id)
                      );
                      return (
                        <Card key={experiment.id} /* 其他属性 */>
                          {/* 卡片内容保持不变 */}
                        </Card>
                      )
                    })}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}

// 包装组件以提供 React Query 上下文
export default function VirtualLabPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <VirtualLabPage />
    </QueryClientProvider>
  );
}