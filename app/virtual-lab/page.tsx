"use client"

import { useState, useEffect, useRef } from "react"
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
  Paperclip,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import Link from "next/link";

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
  completed: boolean
  progress: number
  thumbnail: string
  creator: string // 创建者信息
  isSystem?: boolean // 是否为系统实验
  assignments?: Assignment[] // 实验任务
  simulationUrl?: string // 仿真环境URL
}

interface Assignment {
  id: string
  taskName: string
  className: string
  classId: string
  experimentId: string
  startTime: string
  endTime: string
  requirements: string
  status: "未开始" | "进行中" | "已提交" | "已批改"
  assignedTo: string[]
  submittedAt?: string
  grade?: number
  reports?: Report[]
}

interface Report {
  id: string
  studentId: string
  studentName: string
  submittedAt: string
  content: string
  autoContent?: string // 自动生成内容
  grade?: number
  feedback?: string
  status: "未提交" | "已提交" | "已批改"
  attachments?: Attachment[] // 报告附件
}

interface Attachment {
  id: string
  name: string
  url: string
  type: string
}

interface ClassDTO {
  id: number;
  name: string;
}

interface UserInfoDTO {
  id: number;
  name: string;
}

// API基础URL
const API_BASE_URL = "http://localhost:8080/api/v1/teaching";
const RESOURCE_BASE_URL = "http://localhost:8080/api/v1/resources";

const fetchFromApi = async (url: string, options?: RequestInit) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (!token) {
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
  return responseData.data || null;
};

// 数据规范化辅助函数
const normalizeExperiment = (record: any): Experiment => {
  let creatorName = "系统"; // 默认值

  if (record && record.creator) {
    if (typeof record.creator === 'object' && record.creator !== null) {
      // 如果是对象, 优先使用 realName, 其次是 username
      creatorName = record.creator.realName || record.creator.username || "未知作者";
    } else {
      // 如果不是对象 (例如直接是字符串或数字), 转换为字符串
      creatorName = String(record.creator);
    }
  }

  return {
    id: String(record.id),
    title: record.title || "无标题实验",
    category: record.subject || "其它",
    description: record.description || "",
    difficulty: record.difficulty || 1,
    duration: record.duration || 30,
    completed: record.completed || false,
    progress: record.progress || 0,
    thumbnail: record.thumbnailUrl || "",
    creator: creatorName, // 使用我们安全处理过的字符串
    isSystem: record.isSystem ?? true,
    assignments: record.assignments || [],
    simulationUrl: record.simulationUrl || "" // 仿真环境URL
  };
};

// 获取token的函数
const getAuthToken = () => {
  return localStorage.getItem("accessToken");
};

// 获取实验列表（带分页）
const fetchExperiments = async (page: number = 0, size: number = 10): Promise<{ experiments: Experiment[], totalPages: number }> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/experiments?page=${page}&size=${size}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('获取实验列表失败');

  const responseData = await response.json();
  const data = responseData?.data || {};

  const records = data?.records || [];
  const totalPages = data?.pages || 0;

  return {
    experiments: records.map((record: any) => normalizeExperiment(record)),
    totalPages
  };
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
  const backendUser = await response.json();
  const processRole = (roles: string[] = []): "student" | "teacher" | "admin" => {
    const firstRole = (roles[0] || "").toUpperCase();
    if (firstRole === "ROLE_STUDENT") return "student";
    if (firstRole === "ROLE_TEACHER") return "teacher";
    if (firstRole === "ROLE_ADMIN") return "admin";
    return "student";
  };
  return {
    id: String(backendUser.id),
    name: backendUser.realName || backendUser.username || "未命名用户",
    email: backendUser.email || "",
    role: processRole(backendUser.roles),
  };
};

// 创建新实验（带文件上传）
const createExperiment = async (newExperiment: any, files: { simulationPackage?: File, thumbnail?: File }): Promise<Experiment> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  // 首先上传文件
  let simulationPackageId, thumbnailId;

  if (files.simulationPackage) {
    const simFormData = new FormData();
    simFormData.append('file', files.simulationPackage);
    simFormData.append('type', 'SIMULATION_PACKAGE');

    const simResponse = await fetch(`${RESOURCE_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: simFormData
    });

    if (!simResponse.ok) throw new Error('上传仿真包失败');
    const simData = await simResponse.json();
    simulationPackageId = simData.data.id;
  }

  if (files.thumbnail) {
    const thumbFormData = new FormData();
    thumbFormData.append('file', files.thumbnail);
    thumbFormData.append('type', 'IMAGE');

    const thumbResponse = await fetch(`${RESOURCE_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: thumbFormData
    });

    if (!thumbResponse.ok) throw new Error('上传封面图失败');
    const thumbData = await thumbResponse.json();
    thumbnailId = thumbData.data.id;
  }

  // 创建实验
  const response = await fetch(`${API_BASE_URL}/experiments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...newExperiment,
      simulationPackageId,
      thumbnailId
    })
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

// 提交实验报告（带附件）
const submitReport = async (taskId: string, reportData: any, attachments: File[]): Promise<Report> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  // 1. 上传附件
  const attachmentIds: string[] = [];

  for (const file of attachments) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'REPORT_ATTACHMENT');

    const response = await fetch(`${RESOURCE_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) throw new Error('上传附件失败');
    const data = await response.json();
    attachmentIds.push(data.data.id);
  }

  // 2. 提交报告
  const reportResponse = await fetch(`${API_BASE_URL}/tasks/${taskId}/my-report`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      manualContent: reportData.content,
      isSubmitted: true,
      attachmentIds
    })
  });

  if (!reportResponse.ok) throw new Error('提交报告失败');
  return reportResponse.json();
};

// 获取我的实验报告（包含自动生成内容）
const getMyReport = async (taskId: string): Promise<Report> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/my-report`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('获取实验报告失败');
  const data = await response.json();

  return {
    id: data.id,
    studentId: data.studentId,
    studentName: data.studentName,
    submittedAt: data.submittedAt,
    content: data.manualContent || "",
    autoContent: data.autoContent || "", // 自动生成内容
    grade: data.grade,
    feedback: data.feedback,
    status: data.status,
    attachments: data.attachments?.map((a: any) => ({
      id: a.id,
      name: a.name,
      url: a.url,
      type: a.type
    })) || []
  };
};

// 获取报告详情
const getReportById = async (reportId: string): Promise<Report> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('获取报告失败');
  const data = await response.json();

  return {
    id: data.id,
    studentId: data.studentId,
    studentName: data.studentName,
    submittedAt: data.submittedAt,
    content: data.manualContent || "",
    autoContent: data.autoContent || "",
    grade: data.grade,
    feedback: data.feedback,
    status: data.status,
    attachments: data.attachments?.map((a: any) => ({
      id: a.id,
      name: a.name,
      url: a.url,
      type: a.type
    })) || []
  };
};
// 启动实验任务
const startExperimentTask = async (taskId: string): Promise<string> => {
  const token = getAuthToken();
  if (!token) throw new Error('用户未登录');

  const response = await fetch(`${API_BASE_URL}/experiment-tasks/${taskId}/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('启动实验失败');
  const data = await response.json();
  return data.data.sessionId; // 返回会话ID
};

// 包装组件以提供 React Query 上下文
export default function VirtualLabPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <VirtualLabPage />
    </QueryClientProvider>
  );
}

function VirtualLabPage() {
  const router = useRouter();

  // 新增班级和学生状态
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [classStudentsMap, setClassStudentsMap] = useState<{ [key: number]: UserInfoDTO[] }>({});
  const [loadingClasses, setLoadingClasses] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // 使用 React Query 获取数据（带分页）
  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5
  });

  const {
    data: experimentsData = { experiments: [], totalPages: 0 },
    isLoading: experimentsLoading,
    error: experimentsError,
    refetch: refetchExperiments
  } = useQuery({
    queryKey: ['experiments', currentPage],
    queryFn: () => fetchExperiments(currentPage, pageSize),
    staleTime: 1000 * 60 * 5
  });

  // 获取学生任务列表
  const { data: studentTasks = [], isLoading: studentTasksLoading } = useQuery<Assignment[]>({
    queryKey: ['studentTasks', user?.id],
    queryFn: () => fetchMyTasks(),
    enabled: !!user && user.role === 'student',
    staleTime: 1000 * 60 * 5
  });

  // 获取教师发布的任务
  const { data: teacherTasks = [], isLoading: teacherTasksLoading } = useQuery<Assignment[]>({
    queryKey: ['teacherTasks', user?.id],
    queryFn: () => fetchTeacherTasks(),
    enabled: !!user && user.role === 'teacher',
    staleTime: 1000 * 60 * 5
  });

  // 状态管理
  const [filteredExperiments, setFilteredExperiments] = useState<Experiment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentExperiment, setCurrentExperiment] = useState<Experiment | null>(null)
  const [newExperiment, setNewExperiment] = useState({
    title: "",
    description: "",
    category: "化学",
    difficulty: 3,
    duration: 30,
  })
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [currentReport, setCurrentReport] = useState<Report | null>(null)
  const [currentTask, setCurrentTask] = useState<Assignment | null>(null)
  const [reportContent, setReportContent] = useState("")
  const [autoReportContent, setAutoReportContent] = useState("") // 自动生成内容
  const [gradeValue, setGradeValue] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [simulationStarted, setSimulationStarted] = useState(false) // 仿真环境启动状态
  const [sessionId, setSessionId] = useState("") // 实验会话ID
  const [attachments, setAttachments] = useState<File[]>([]) // 报告附件
  const [simulationPackage, setSimulationPackage] = useState<File | null>(null) // 仿真包文件
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null) // 封面图文件

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
    mutationFn: ({ newExperiment, files }: { newExperiment: any, files: any }) =>
      createExperiment(newExperiment, files),
    onSuccess: (newExp) => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      setIsCreating(false);
      setNewExperiment({
        title: "", description: "", category: "化学", difficulty: 3, duration: 30,
      });
      setSimulationPackage(null);
      setThumbnailFile(null);
    }
  });

  const submitReportMutation = useMutation({
    mutationFn: ({ taskId, reportData, attachments }: { taskId: string, reportData: any, attachments: File[] }) =>
      submitReport(taskId, reportData, attachments),
    onSuccess: (newReport) => {
      // 更新缓存数据...
      queryClient.invalidateQueries({ queryKey: ['studentTasks', user?.id] });
      setIsSubmittingReport(false);
      setReportContent("");
      setAttachments([]);
    }
  });
  const publishAssignmentMutation = useMutation({
    mutationFn: publishAssignment,
    onSuccess: () => {
      // MODIFIED: 发布成功后，让教师任务列表缓存失效，自动刷新列表
      queryClient.invalidateQueries({ queryKey: ['teacherTasks'] });
      setIsPublishing(false);
      alert("任务发布成功！");
    },
    onError: (error: Error) => {
      console.error("发布任务失败:", error);
      // MODIFIED: 优化错误提示，显示后端返回的具体信息
      alert(`发布任务失败: ${error.message}`);
    }
  });

  const startExperimentMutation = useMutation({
    mutationFn: (taskId: string) => startExperimentTask(taskId),
    onSuccess: (sessionId) => {
      setSessionId(sessionId);
      setSimulationStarted(true);
    }
  });

  const handlePublishAssignment = () => {
    // MODIFIED: 增加数据校验
    if (!currentExperiment) {
      alert("错误：未选中任何实验。");
      return;
    }
    if (!newAssignment.classId) {
      alert("请选择要指派的班级。");
      return;
    }

    // MODIFIED: 根据选择是“单个学生”还是“全班”来构建学生ID列表
    const studentIds = newAssignment.studentId
      ? [newAssignment.studentId]
      : classStudentsMap[Number(newAssignment.classId)]?.map(s => s.id.toString()) || [];

    if (studentIds.length === 0) {
      alert("该班级下没有学生，无法指派。");
      return;
    }

    // MODIFIED: 整合所有需要提交的数据
    const assignmentData = {
      experimentId: currentExperiment.id,
      taskName: newAssignment.taskName,
      classId: newAssignment.classId,
      startTime: newAssignment.startTime,
      endTime: newAssignment.endTime,
      requirements: newAssignment.requirements,
      studentIds: studentIds,
    };

    // MODIFIED: 调用mutation来执行发布操作
    publishAssignmentMutation.mutate(assignmentData);
  };

  // 获取班级和学生数据
  useEffect(() => {
    if (user && (user.role === 'teacher' || user.role === 'admin')) {
      const fetchClassesAndStudents = async () => {
        setLoadingClasses(true);
        const token = getAuthToken();
        if (!token) {
          setLoadingClasses(false);
          return;
        }

        try {
          // 1. 获取所有班级数据
          const classesResponse = await fetch(`${API_BASE_URL}/admin/classes`, {
            headers: { "Authorization": `Bearer ${token}` }
          });

          if (!classesResponse.ok) throw new Error("获取班级列表失败");

          const classesResponseJson = await classesResponse.json();

          // 从响应中智能提取班级数组
          const classesArray = classesResponseJson?.data?.records || classesResponseJson?.data || [];

          // 安全检查，确保我们得到的是一个数组
          if (!Array.isArray(classesArray)) {
            console.error("获取到的班级数据不是一个数组:", classesArray);
            setLoadingClasses(false);
            return;
          }

          setClasses(classesArray);

          // 2. 并发获取每个班级的学生列表
          const classStudentsMap: { [key: number]: UserInfoDTO[] } = {};

          await Promise.all(
            // 使用修正后的 classesArray
            classesArray.map(async (cls: ClassDTO) => {
              try {
                const classDetailResponse = await fetch(`${API_BASE_URL}/classes/${cls.id}`, {
                  headers: { "Authorization": `Bearer ${token}` }
                });

                if (!classDetailResponse.ok) {
                  console.error(`获取班级 ${cls.id} 详情失败`);
                  return; // 单个请求失败不中断全部
                }

                const classDetailJson = await classDetailResponse.json();

                // 从班级详情中智能提取学生（members）数组
                const membersArray = classDetailJson?.data?.members || classDetailJson?.data || classDetailJson?.members || [];

                // 同样进行安全检查
                classStudentsMap[cls.id] = Array.isArray(membersArray) ? membersArray : [];

              } catch (err) {
                console.error(`处理班级 ${cls.id} 数据时出错:`, err);
              }
            })
          );

          setClassStudentsMap(classStudentsMap);

        } catch (err) {
          console.error("获取班级和学生数据失败:", err);
        } finally {
          setLoadingClasses(false);
        }
      };

      fetchClassesAndStudents();
    }
  }, [user]); // 依赖项保持不变

  useEffect(() => {
    if (!user) return;

    let filtered = experimentsData.experiments || [];

    if (searchTerm) {
      filtered = filtered.filter(
        (exp) =>
          exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((exp) => exp.category === categoryFilter)
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter((exp) => exp.difficulty === parseInt(difficultyFilter))
    }

    setFilteredExperiments(filtered);
    setTotalPages(experimentsData.totalPages);
  }, [experimentsData, searchTerm, categoryFilter, difficultyFilter, user]);

  // 启动仿真实验
  const handleStartSimulation = async (taskId: string) => {
    if (!simulationStarted) {
      try {
        await startExperimentMutation.mutateAsync(taskId);
      } catch (error) {
        console.error("启动实验失败:", error);
      }
    }
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  // 处理附件上传
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAttachments = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  // 移除附件
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 当选择任务时获取自动生成的报告内容
  useEffect(() => {
    const fetchAutoReportContent = async (taskId: string) => {
      try {
        const report = await getMyReport(taskId);
        setAutoReportContent(report.autoContent || "");
      } catch (error) {
        console.error("获取自动报告内容失败:", error);
        setAutoReportContent("");
      }
    };

    if (currentTask?.id) {
      fetchAutoReportContent(currentTask.id);
    }
  }, [currentTask]);

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

  const renderStarRating = (difficulty: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < difficulty ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )
  }

  const handleSelectExperiment = async (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    try {
      const detailedData = await getExperimentById(experiment.id);
      if (detailedData) {
        setSelectedExperiment(detailedData);
      }
    } catch (error) {
      console.error("获取实验详情失败:", error);
    }
  };

  const handleCreateExperiment = () => {
    createExperimentMutation.mutate({
      newExperiment,
      files: {
        simulationPackage,
        thumbnail: thumbnailFile
      }
    });
  };

  // 获取实验详情
  const getExperimentById = async (id: string): Promise<Experiment> => {
    const rawData = await fetchFromApi(`${API_BASE_URL}/experiments/${id}`);
    if (!rawData) {
      throw new Error(`无法找到ID为 ${id} 的实验`);
    }
    return normalizeExperiment(rawData);
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
    const tasks = responseData?.data?.records || responseData?.data || [];
    return Array.isArray(tasks) ? tasks : [];
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
    const tasks = responseData?.data?.records || responseData?.data || [];
    return Array.isArray(tasks) ? tasks : [];
  };

  const getCurrentStudentReport = (task: Assignment) => {
    if (!user) return null;
    return task.reports?.find(report => report.studentId === user.id);
  }

  // 加载错误处理
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

  // 加载中状态
  if (userLoading || experimentsLoading || studentTasksLoading || teacherTasksLoading) {
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
                  {/* 虚拟实验界面 - 集成仿真环境 */}
                  <div className="aspect-video bg-gray-700 rounded-lg mb-6 overflow-hidden">
                    {simulationStarted && selectedExperiment.simulationUrl ? (
                      <iframe
                        src={selectedExperiment.simulationUrl}
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center flex-col">
                        <FlaskConical className="w-16 h-16 text-blue-400 mb-4" />
                        <p className="text-gray-300 mb-4">准备启动虚拟实验环境</p>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStartSimulation(currentTask?.id || "")}
                          disabled={startExperimentMutation.isPending}
                        >
                          {startExperimentMutation.isPending ? "启动中..." : "启动实验"}
                        </Button>
                      </div>
                    )}
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
                                  <Dialog open={isSubmittingReport || isSavingDraft} onOpenChange={(open) => {
                                    if (!open) {
                                      setIsSubmittingReport(false);
                                      setIsSavingDraft(false);
                                    }
                                  }}>
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
                                        {/* 自动生成内容展示 */}
                                        {autoReportContent && (
                                          <div className="space-y-2">
                                            <Label>自动生成内容</Label>
                                            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm max-h-40 overflow-y-auto">
                                              {autoReportContent}
                                            </div>
                                          </div>
                                        )}

                                        <div className="space-y-2">
                                          <Label htmlFor="reportContent">报告内容</Label>
                                          <Textarea
                                            id="reportContent"
                                            value={reportContent}
                                            onChange={(e) => setReportContent(e.target.value)}
                                            placeholder="请输入实验报告内容..."
                                            className="min-h-[200px]"
                                          />
                                        </div>

                                        {/* 附件上传 */}
                                        <div className="space-y-2">
                                          <Label>附件</Label>
                                          <div className="flex items-center">
                                            <input
                                              type="file"
                                              id="attachment-upload"
                                              multiple
                                              onChange={handleAttachmentUpload}
                                              className="hidden"
                                            />
                                            <label
                                              htmlFor="attachment-upload"
                                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                                            >
                                              <Paperclip className="w-4 h-4 mr-1" />
                                              添加附件
                                            </label>
                                          </div>

                                          {/* 附件列表 */}
                                          {attachments.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                              {attachments.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm">
                                                  <div className="truncate max-w-xs">{file.name}</div>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-6 h-6"
                                                    onClick={() => removeAttachment(index)}
                                                  >
                                                    <Trash className="w-4 h-4 text-red-500" />
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <DialogFooter className="flex justify-between">
                                        <Button
                                          variant="secondary"
                                          onClick={() => { }}
                                        >
                                          保存草稿
                                        </Button>
                                        <div className="space-x-2">
                                          <Button variant="outline" onClick={() => {
                                            setIsSubmittingReport(false);
                                            setIsSavingDraft(false);
                                          }}>
                                            取消
                                          </Button>
                                          <Button
                                            onClick={() => submitReportMutation.mutate({
                                              taskId: currentTask.id,
                                              reportData: { content: reportContent },
                                              attachments
                                            })}
                                            disabled={submitReportMutation.isPending}
                                          >
                                            {submitReportMutation.isPending ? "提交中..." : "提交报告"}
                                          </Button>
                                        </div>
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
                                                  // 找到教师评分按钮的位置（在实验详情页面的侧边栏中）
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          asChild // 添加 asChild 属性
                                          disabled={report.status === "未提交"}
                                        >
                                          <Link href={`/virtual-lab/reports/${report.id}`}>
                                            {report.status === "已批改" ? "查看评分" : "评分"}
                                          </Link>
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
                                              onClick={() => { }}
                                            >
                                              提交评分
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
            <Dialog
              open={isCreating || isEditing}
              onOpenChange={(open) => {
                if (!open) {
                  setIsCreating(false);
                  setIsEditing(false);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  新建实验
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{isEditing ? "编辑实验" : "创建新实验"}</DialogTitle>
                  <DialogDescription>
                    填写以下表单来创建或编辑一个虚拟仿真实验。
                  </DialogDescription>
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
                    <Label htmlFor="package" className="text-right">
                      上传仿真包
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="package"
                        type="file"
                        accept=".zip"
                        onChange={(e) => handleFileUpload(e, setSimulationPackage)}
                      />
                      {simulationPackage && <p className="text-xs mt-1">已选择: {simulationPackage.name}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="thumbnail" className="text-right">
                      上传封面图
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="thumbnail"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setThumbnailFile)}
                      />
                      {thumbnailFile && <p className="text-xs mt-1">已选择: {thumbnailFile.name}</p>}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
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
                <Button variant="outline">
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
                已发布任务
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="library">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiments.map((experiment) => (
                <Card key={experiment.id} className="flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow">
                  <div>
                    <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden relative" onClick={() => handleSelectExperiment(experiment)}>
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
                    <div onClick={() => handleSelectExperiment(experiment)}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{experiment.title}</CardTitle>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">难度:</span>
                            {renderStarRating(experiment.difficulty)}
                          </div>
                        </div>
                        <CardDescription className="line-clamp-2">{experiment.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">

                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{experiment.duration} 分钟</span>
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
                        </div>
                      </CardContent>
                    </div>
                  </div>
                  <CardContent>
                    <div className="space-y-4">
                      {(user?.role === "teacher" || user?.role === "admin") ? (
                        <div className="flex justify-end gap-2 mt-4">
                          <Dialog open={isPublishing && currentExperiment?.id === experiment.id} onOpenChange={(open) => { if (!open) { setIsPublishing(false); setCurrentExperiment(null); } }}>
                            <DialogTrigger asChild>
                              {/* MODIFIED: 修复发布按钮的点击逻辑 */}
                              <Button variant="default" size="sm" onClick={(e) => {
                                e.stopPropagation(); // 阻止事件冒泡，防止触发卡片点击
                                setCurrentExperiment(experiment);
                                setNewAssignment({ // 预填表单
                                  taskName: experiment.title,
                                  classId: "", studentId: "", startTime: "", endTime: "",
                                  requirements: experiment.description
                                });
                                setIsPublishing(true);
                              }}>
                                <Send className="w-4 h-4 mr-1" />发布
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>发布实验任务: {experiment.title}</DialogTitle>
                                <DialogDescription>
                                  配置任务详情，并将此实验指派给指定班级或学生。
                                </DialogDescription>
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

                                {/* 班级选择 - 使用真实数据 */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="class" className="text-right">
                                    指派班级
                                  </Label>
                                  <Select
                                    value={newAssignment.classId}
                                    onValueChange={(value) => setNewAssignment({ ...newAssignment, classId: value, studentId: "" })}
                                    disabled={loadingClasses}
                                  >
                                    <SelectTrigger className="col-span-3">
                                      {loadingClasses ? (
                                        <span>加载班级中...</span>
                                      ) : classes.length === 0 ? (
                                        <span>暂无班级数据</span>
                                      ) : (
                                        <SelectValue placeholder="选择班级" />
                                      )}
                                    </SelectTrigger>
                                    <SelectContent>
                                      {classes.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                          {cls.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* 学生选择 - 使用真实数据 */}
                                {newAssignment.classId && (
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="student" className="text-right">
                                      指定学生
                                    </Label>
                                    <Select
                                      value={newAssignment.studentId}
                                      onValueChange={(value) => setNewAssignment({ ...newAssignment, studentId: value })}
                                      disabled={loadingClasses}
                                    >
                                      <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="选择学生 (可选)" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="">全班学生</SelectItem>
                                        {classStudentsMap[Number(newAssignment.classId)]?.map(student => (
                                          <SelectItem key={student.id} value={student.id.toString()}>
                                            {student.name}
                                          </SelectItem>
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
                                <Button onClick={handlePublishAssignment} disabled={publishAssignmentMutation.isPending}>
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
                                  setIsEditing(true);
                                  setNewExperiment({
                                    title: experiment.title,
                                    description: experiment.description,
                                    category: experiment.category,
                                    difficulty: experiment.difficulty,
                                    duration: experiment.duration,
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

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 0) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(i);
                          }}
                          isActive={i === currentPage}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </TabsContent>

          {user?.role === "teacher" && (
            <TabsContent value="published">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teacherTasks.length > 0 ? teacherTasks.map(task => (
                  <Card key={task.id} className="relative">
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
                      <CardTitle className="text-lg">{task.taskName}</CardTitle>
                      <CardDescription className="line-clamp-2">{task.requirements}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">开始: {new Date(task.startTime).toLocaleDateString()}</span>

                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">截止: {new Date(task.endTime).toLocaleDateString()}</span>
                          </div>
                          <Badge variant={task.status === "已批改" ? "default" : "secondary"} className="text-xs">
                            {task.status}
                          </Badge>
                        </div>

                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-2">班级: {task.className}</h4>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full mt-2"
                          onClick={() => {
                            // 找到对应的实验并设置选中
                            const exp = experimentsData.experiments.find(e => e.id === task.experimentId);
                            if (exp) setSelectedExperiment(exp);
                          }}
                        >
                          查看详情
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="col-span-full text-center py-12">
                    <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无已发布实验</h3>
                    <p className="text-gray-500">您还没有发布任何实验任务</p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {user?.role === "student" && (
            <TabsContent value="assigned">
              {studentTasks.length === 0 ? (
                <div className="text-center py-12">
                  <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无指派实验</h3>
                  <p className="text-gray-500">等待老师发布实验任务</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {studentTasks.map((task) => {
                    // 找到对应的实验
                    const experiment = experimentsData.experiments.find(e => e.id === task.experimentId);

                    return (
                      <Card
                        key={task.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          if (experiment) handleSelectExperiment(experiment);
                        }}
                      >
                        {experiment && (
                          <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <FlaskConical className="w-12 h-12 text-gray-400" />
                            </div>
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="text-lg">{task.taskName}</CardTitle>
                          {experiment && (
                            <CardDescription className="line-clamp-2">{experiment.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">截止: {new Date(task.endTime).toLocaleDateString()}</span>
                              </div>
                              <Badge variant={
                                task.status === "已批改" ? "default" :
                                  task.status === "已提交" ? "secondary" : "destructive"
                              }>
                                {task.status}
                              </Badge>
                            </div>

                            {experiment && (
                              <div className="flex items-center space-x-1 mt-2">
                                {getCategoryIcon(experiment.category)}
                                <span className="text-sm text-gray-600">{experiment.category}</span>
                              </div>
                            )}

                            <Button
                              className="w-full mt-4"
                              onClick={() => {
                                if (experiment) setSelectedExperiment(experiment);
                              }}
                            >
                              {task.status === "未开始" ? "开始实验" : "继续实验"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
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