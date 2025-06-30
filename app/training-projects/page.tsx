"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Search,
  Users,
  Calendar,
  Clock,
  MessageSquare,
  Star,
  ArrowLeft,
  UserCheck,
  Target,
  BookOpen,
  FileText,
  Check,
  Trash2,
} from "lucide-react"


interface User {
  id: string
  name: string
  email: string
  role: "student" | "teacher" | "admin"
}

interface Project {
  id: string
  title: string
  description: string
  status: "active" | "completed" | "draft"
  progress: number
  dueDate: string
  createdBy: string
  teams: Team[]
  tasks: Task[]
  discussions: Discussion[]
  category: string
  difficulty: "初级" | "中级" | "高级"
  skills: string[]
}

interface Team {
  id: string
  name: string
  members: string[]
  progress: number
  score?: number
  feedback?: string
  leader?: string
  createdAt: string
}

interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  dueDate: string
  assignedTo?: string[]
  priority: "high" | "medium" | "low"
  submissions: Submission[] // 学生提交的任务内容
}

interface Submission {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: string
  attachments?: string[]
}

interface Discussion {
  id: string
  author: string
  content: string
  timestamp: string
  replies: Discussion[]
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export default function TrainingProjectsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showJoinTeam, setShowJoinTeam] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false) // 新增：任务创建弹窗状态
  const [currentProjectForTask, setCurrentProjectForTask] = useState<Project | null>(null) // 新增：当前操作的项目
  const [showSubmitTask, setShowSubmitTask] = useState(false) // 新增：任务提交弹窗状态
  const [currentTaskForSubmission, setCurrentTaskForSubmission] = useState<Task | null>(null) // 新增：当前操作的任务
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    dueDate: "",
    category: "",
    difficulty: "初级" as const,
    tasks: [] as Array<{ // 新增任务数组
      title: string;
      description: string;
      dueDate: string;
      priority: "high" | "medium" | "low";
    }>
  })
  const [newTeam, setNewTeam] = useState({
    name: "",
    members: [] as string[],
  })
  const [newTask, setNewTask] = useState({ // 新增：新任务表单状态
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as "high" | "medium" | "low",
    assignedTo: [] as string[],
  })
  const [newSubmission, setNewSubmission] = useState({ // 新增：任务提交表单状态
    content: "",
    attachments: [] as string[],
  })
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const router = useRouter()

  const handleAddComment = () => {
    if (!newCommentContent.trim() || !user) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      author: user.name,
      content: newCommentContent.trim(),
      timestamp: new Date().toLocaleString(),
    };

    setComments((prevComments) => [...prevComments, newComment]);
    setNewCommentContent('');
  };

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    const currentUser = JSON.parse(userData)
    setUser(currentUser)

    // 模拟项目数据 - 确保当前用户参与项目
    const allProjects: Project[] = [
      {
        id: "1",
        title: "Web开发实践项目",
        description: "使用React和Node.js开发一个完整的Web应用，包括用户认证、数据管理、响应式设计等核心功能",
        status: "active",
        progress: 65,
        dueDate: "2024-02-15",
        createdBy: "teacher1",
        category: "前端开发",
        difficulty: "中级",
        skills: ["React", "Node.js", "数据库", "API设计"],
        teams: [
          {
            id: "t1",
            name: "前端开发组",
            members: [currentUser.id, "张三", "李四"], // 确保当前用户在团队中
            progress: 70,
            leader: currentUser.id,
            createdAt: "2024-01-05",
            score: 85,
            feedback: "团队协作良好，代码质量较高，需要加强测试覆盖率",
          },
          {
            id: "t2",
            name: "后端架构组",
            members: ["王五", "赵六"],
            progress: 60,
            leader: "王五",
            createdAt: "2024-01-06",
          },
          {
            id: "t6",
            name: "全栈开发组",
            members: ["钱七", "孙八", "周九", "吴十"],
            progress: 55,
            leader: "钱七",
            createdAt: "2024-01-08",
          },
        ],
        tasks: [
          {
            id: "task1",
            title: "需求分析与原型设计",
            description: "完成项目需求分析文档和UI原型设计",
            completed: true,
            dueDate: "2024-01-10",
            assignedTo: [currentUser.id, "张三"],
            priority: "high",
            submissions: []
          },
          {
            id: "task2",
            title: "数据库设计",
            description: "设计数据库结构和API接口",
            completed: true,
            dueDate: "2024-01-15",
            assignedTo: ["王五", "赵六"],
            priority: "high",
            submissions: []
          },
          {
            id: "task3",
            title: "前端界面开发",
            description: "实现响应式用户界面",
            completed: false,
            dueDate: "2024-02-01",
            assignedTo: [currentUser.id, "李四"],
            priority: "medium",
            submissions: []
          },
          {
            id: "task4",
            title: "后端API开发",
            description: "实现RESTful API接口",
            completed: false,
            dueDate: "2024-02-05",
            assignedTo: ["王五"],
            priority: "high",
            submissions: []
          },
          {
            id: "task5",
            title: "系统集成测试",
            description: "进行前后端集成测试",
            completed: false,
            dueDate: "2024-02-10",
            assignedTo: ["张三", "赵六"],
            priority: "medium",
            submissions: []
          },
        ],
        discussions: [
          {
            id: "d1",
            author: currentUser.name,
            content: "关于用户界面设计，我觉得应该采用更简洁的风格，提升用户体验",
            timestamp: "2024-01-08 10:30",
            replies: [
              {
                id: "d1-r1",
                author: "张三",
                content: "同意，我们可以参考一些优秀的设计案例",
                timestamp: "2024-01-08 11:15",
                replies: [],
              },
            ],
          },
        ],
      },
      {
        id: "2",
        title: "数据库设计与优化项目",
        description: "设计并实现一个高性能的学生管理系统数据库，包括索引优化、查询优化等",
        status: "active",
        progress: 30,
        dueDate: "2024-03-01",
        createdBy: "teacher1",
        category: "数据库",
        difficulty: "中级",
        skills: ["MySQL", "数据建模", "性能优化", "SQL"],
        teams: [
          {
            id: "t3",
            name: "数据建模组",
            members: ["陈一", "林二", "黄三"],
            progress: 35,
            leader: "陈一",
            createdAt: "2024-01-10",
          },
          {
            id: "t7",
            name: "性能优化组",
            members: [currentUser.id, "郑四"], // 当前用户也参与这个项目
            progress: 25,
            leader: currentUser.id,
            createdAt: "2024-01-12",
          },
        ],
        tasks: [
          {
            id: "task6",
            title: "ER图设计",
            description: "绘制完整的实体关系图",
            completed: false,
            dueDate: "2024-01-20",
            assignedTo: ["陈一", "林二"],
            priority: "high",
            submissions: []
          },
          {
            id: "task7",
            title: "数据库表结构设计",
            description: "设计详细的表结构和约束",
            completed: false,
            dueDate: "2024-01-25",
            assignedTo: ["黄三"],
            priority: "high",
            submissions: []
          },
          {
            id: "task8",
            title: "索引策略设计",
            description: "制定数据库索引优化策略",
            completed: false,
            dueDate: "2024-02-01",
            assignedTo: [currentUser.id, "郑四"],
            priority: "medium",
            submissions: []
          },
        ],
        discussions: [],
      },
      {
        id: "3",
        title: "移动应用开发项目",
        description: "开发一个跨平台的移动学习应用，支持在线课程、作业提交、成绩查询等功能",
        status: "active",
        progress: 45,
        dueDate: "2024-04-01",
        createdBy: "teacher2",
        category: "移动开发",
        difficulty: "高级",
        skills: ["React Native", "Flutter", "移动UI", "API集成"],
        teams: [
          {
            id: "t4",
            name: "UI设计组",
            members: ["何五", "许六", "邓七"],
            progress: 50,
            leader: "何五",
            createdAt: "2024-01-15",
            score: 78,
            feedback: "设计创意不错，但需要更多考虑用户体验",
          },
          {
            id: "t5",
            name: "功能开发组",
            members: ["冯八", "唐九"],
            progress: 40,
            leader: "冯八",
            createdAt: "2024-01-16",
          },
          {
            id: "t8",
            name: "测试优化组",
            members: ["韩十", "曹十一", "严十二"],
            progress: 35,
            leader: "韩十",
            createdAt: "2024-01-18",
          },
        ],
        tasks: [
          {
            id: "task9",
            title: "应用原型设计",
            description: "设计移动应用的交互原型",
            completed: true,
            dueDate: "2024-01-25",
            assignedTo: ["何五", "许六"],
            priority: "high",
            submissions: []
          },
          {
            id: "task10",
            title: "核心功能开发",
            description: "实现课程浏览和作业提交功能",
            completed: false,
            dueDate: "2024-02-15",
            assignedTo: ["冯八", "唐九"],
            priority: "high",
            submissions: []
          },
        ],
        discussions: [],
      },
      {
        id: "4",
        title: "人工智能应用开发",
        description: "基于机器学习技术开发智能推荐系统，实现个性化学习内容推荐",
        status: "active",
        progress: 20,
        dueDate: "2024-05-01",
        createdBy: "teacher3",
        category: "人工智能",
        difficulty: "高级",
        skills: ["Python", "机器学习", "数据分析", "算法"],
        teams: [
          {
            id: "t9",
            name: "算法研究组",
            members: ["沈十三", "韩十四", "杨十五"],
            progress: 25,
            leader: "沈十三",
            createdAt: "2024-01-20",
          },
          {
            id: "t10",
            name: "数据处理组",
            members: ["朱十六", "秦十七"],
            progress: 15,
            leader: "朱十六",
            createdAt: "2024-01-22",
          },
        ],
        tasks: [
          {
            id: "task11",
            title: "数据收集与预处理",
            description: "收集并清洗训练数据",
            completed: false,
            dueDate: "2024-02-10",
            assignedTo: ["朱十六", "秦十七"],
            priority: "high",
            submissions: []
          },
          {
            id: "task12",
            title: "推荐算法设计",
            description: "设计并实现推荐算法",
            completed: false,
            dueDate: "2024-03-01",
            assignedTo: ["沈十三", "韩十四"],
            priority: "high",
            submissions: []
          },
        ],
        discussions: [],
      },
    ]

    // 根据用户角色过滤项目
    if (currentUser.role === "student") {
      // 学生只能看到自己参与的项目
      const studentProjects = allProjects.filter((project) =>
          project.teams.some((team) => team.members.includes(currentUser.id)),
      )
      console.log("Student projects:", studentProjects) // 调试用
      setProjects(studentProjects)
    } else {
      // 教师和管理员可以看到所有项目
      setProjects(allProjects)
    }
  }, [router])

  const handleCreateProject = () => {
    // 将表单中的任务转换为Task对象
    const tasks = newProject.tasks.map(task => ({
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: task.title,
      description: task.description,
      completed: false,
      dueDate: task.dueDate,
      priority: task.priority,
      assignedTo: [],
      submissions: []
    }));

    const project: Project = {
      id: Date.now().toString(),
      title: newProject.title,
      description: newProject.description,
      status: "draft",
      progress: 0,
      dueDate: newProject.dueDate,
      createdBy: user?.id || "",
      category: newProject.category,
      difficulty: newProject.difficulty,
      skills: [],
      teams: [],
      tasks: tasks,
      discussions: [],
    }
    setProjects([...projects, project])
    setNewProject({
      title: "",
      description: "",
      dueDate: "",
      category: "",
      difficulty: "初级",
      tasks: []
    })
    setShowCreateProject(false)
  }

  const handleCreateTeam = () => {
    if (!selectedProject || !user) return

    const team: Team = {
      id: Date.now().toString(),
      name: newTeam.name,
      members: user.role === "student" ? [user.id] : newTeam.members,
      progress: 0,
      leader: user.role === "student" ? user.id : newTeam.members[0],
      createdAt: new Date().toISOString().split("T")[0],
    }

    const updatedProject = {
      ...selectedProject,
      teams: [...selectedProject.teams, team],
    }

    setProjects(projects.map((p) => (p.id === selectedProject.id ? updatedProject : p)))
    setSelectedProject(updatedProject)
    setNewTeam({ name: "", members: [] })
    setShowCreateTeam(false)
  }

  const handleJoinTeam = (teamId: string) => {
    if (!selectedProject || !user) return

    const updatedProject = {
      ...selectedProject,
      teams: selectedProject.teams.map((team) =>
          team.id === teamId ? { ...team, members: [...team.members, user.id] } : team,
      ),
    }

    setProjects(projects.map((p) => (p.id === selectedProject.id ? updatedProject : p)))
    setSelectedProject(updatedProject)
    setShowJoinTeam(false)
  }

  // 新增：创建新任务
  const handleCreateTask = () => {
    if (!currentProjectForTask || !user) return

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description,
      completed: false,
      dueDate: newTask.dueDate,
      priority: newTask.priority,
      assignedTo: newTask.assignedTo,
      submissions: []
    }

    const updatedProject = {
      ...currentProjectForTask,
      tasks: [...currentProjectForTask.tasks, task],
    }

    setProjects(projects.map(p => p.id === currentProjectForTask.id ? updatedProject : p))

    // 如果当前选中的项目是这个项目，更新它
    if (selectedProject && selectedProject.id === currentProjectForTask.id) {
      setSelectedProject(updatedProject)
    }

    setNewTask({
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      assignedTo: []
    })
    setShowCreateTask(false)
    setCurrentProjectForTask(null)
  }

  // 新增：提交任务
  const handleSubmitTask = () => {
    if (!currentTaskForSubmission || !user || !selectedProject) return

    const submission: Submission = {
      id: `sub-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      content: newSubmission.content,
      timestamp: new Date().toLocaleString(),
      attachments: newSubmission.attachments
    }

    const updatedTasks = selectedProject.tasks.map(task => {
      if (task.id === currentTaskForSubmission.id) {
        return {
          ...task,
          submissions: [...task.submissions, submission]
        }
      }
      return task
    })

    const updatedProject = {
      ...selectedProject,
      tasks: updatedTasks
    }

    setProjects(projects.map(p => p.id === selectedProject.id ? updatedProject : p))
    setSelectedProject(updatedProject)

    setNewSubmission({ content: "", attachments: [] })
    setShowSubmitTask(false)
    setCurrentTaskForSubmission(null)
  }

  // 新增：标记任务为完成
  const handleCompleteTask = (taskId: string) => {
    if (!selectedProject || !user) return

    const updatedTasks = selectedProject.tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: true
        }
      }
      return task
    })

    const updatedProject = {
      ...selectedProject,
      tasks: updatedTasks
    }

    setProjects(projects.map(p => p.id === selectedProject.id ? updatedProject : p))
    setSelectedProject(updatedProject)
  }

  // 新增：添加任务到项目表单
  const addTaskToProject = () => {
    setNewProject({
      ...newProject,
      tasks: [
        ...newProject.tasks,
        {
          title: "",
          description: "",
          dueDate: "",
          priority: "medium"
        }
      ]
    });
  };

  // 新增：从项目表单中移除任务
  const removeTaskFromProject = (index: number) => {
    const updatedTasks = [...newProject.tasks];
    updatedTasks.splice(index, 1);
    setNewProject({
      ...newProject,
      tasks: updatedTasks
    });
  };

  // 新增：更新项目表单中的任务
  const updateTaskInProject = (index: number, field: string, value: string) => {
    const updatedTasks = [...newProject.tasks];
    updatedTasks[index] = {
      ...updatedTasks[index],
      [field]: value
    };
    setNewProject({
      ...newProject,
      tasks: updatedTasks
    });
  };

  const getUserTeam = (project: Project) => {
    if (!user) return null
    return project.teams.find((team) => team.members.includes(user.id))
  }

  const canJoinTeam = (team: Team) => {
    return user && !team.members.includes(user.id) && team.members.length < 4
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "初级":
        return "bg-green-100 text-green-800"
      case "中级":
        return "bg-yellow-100 text-yellow-800"
      case "高级":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredProjects = projects.filter(
      (project) =>
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!user) {
    return <div>Loading...</div>
  }

  if (selectedProject) {
    const userTeam = getUserTeam(selectedProject)
    const completedTasks = selectedProject.tasks.filter((task) => task.completed).length
    const totalTasks = selectedProject.tasks.length

    return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center mb-6">
              <Button variant="ghost" onClick={() => setSelectedProject(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回项目列表
              </Button>
            </div>

            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedProject.title}</h1>
                  <p className="text-gray-600 mb-4">{selectedProject.description}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge className={getDifficultyColor(selectedProject.difficulty)}>{selectedProject.difficulty}</Badge>
                  <Badge variant="outline">{selectedProject.category}</Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Badge variant={selectedProject.status === "active" ? "default" : "secondary"}>
                  {selectedProject.status === "active" ? "进行中" : "已完成"}
                </Badge>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  截止日期: {selectedProject.dueDate}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  项目进度: {selectedProject.progress}%
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Target className="w-4 h-4 mr-1" />
                  任务完成: {completedTasks}/{totalTasks}
                </div>
                {userTeam && (
                    <div className="flex items-center text-sm text-green-600">
                      <UserCheck className="w-4 h-4 mr-1" />
                      我的团队: {userTeam.name}
                    </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>项目总进度</span>
                  <span>{selectedProject.progress}%</span>
                </div>
                <Progress value={selectedProject.progress} className="h-2" />

                {userTeam && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>我的团队进度</span>
                        <span className="text-blue-600">{userTeam.progress}%</span>
                      </div>
                      <Progress value={userTeam.progress} className="h-2" />
                    </>
                )}
              </div>

              {selectedProject.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">技能要求:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {skill}
                          </Badge>
                      ))}
                    </div>
                  </div>
              )}
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">项目概览</TabsTrigger>
                <TabsTrigger value="teams">团队管理</TabsTrigger>
                <TabsTrigger value="tasks">任务列表</TabsTrigger>
                <TabsTrigger value="discussions">讨论区</TabsTrigger>
                {user.role === "teacher" && <TabsTrigger value="grading">评分管理</TabsTrigger>}
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>项目详情</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{selectedProject.description}</p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">项目类别:</span>
                            <span className="ml-2">{selectedProject.category}</span>
                          </div>
                          <div>
                            <span className="font-medium">难度等级:</span>
                            <span className="ml-2">{selectedProject.difficulty}</span>
                          </div>
                          <div>
                            <span className="font-medium">创建时间:</span>
                            <span className="ml-2">2024-01-05</span>
                          </div>
                          <div>
                            <span className="font-medium">参与团队:</span>
                            <span className="ml-2">{selectedProject.teams.length} 个</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {userTeam && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
                              我的团队信息
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">团队名称:</span>
                                  <span className="ml-2 text-blue-700">{userTeam.name}</span>
                                </div>
                                <div>
                                  <span className="font-medium">团队进度:</span>
                                  <span className="ml-2 text-blue-700">{userTeam.progress}%</span>
                                </div>
                                <div>
                                  <span className="font-medium">团队成员:</span>
                                  <div className="ml-2 mt-1 flex flex-wrap gap-1">
                                    {userTeam.members.map((member, index) => (
                                        <Badge key={index} variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                          {member === user.id ? "我" : member}
                                        </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium">创建时间:</span>
                                  <span className="ml-2 text-blue-700">{userTeam.createdAt}</span>
                                </div>
                              </div>

                              {userTeam.leader && (
                                  <div className="text-sm">
                                    <span className="font-medium">团队组长:</span>
                                    <span className="ml-2 text-blue-700">
                                {userTeam.leader === user.id ? "我" : userTeam.leader}
                              </span>
                                  </div>
                              )}

                              {userTeam.score && (
                                  <div className="pt-2 border-t border-blue-200">
                                    <div className="flex items-center space-x-2">
                                      <Star className="w-4 h-4 text-yellow-500" />
                                      <span className="text-sm font-medium">团队评分: {userTeam.score}/100</span>
                                    </div>
                                    {userTeam.feedback && (
                                        <div className="mt-2 text-sm">
                                          <span className="font-medium">教师评语:</span>
                                          <p className="mt-1 text-gray-700">{userTeam.feedback}</p>
                                        </div>
                                    )}
                                  </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                    )}
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>项目统计</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span>总进度</span>
                          <span className="font-semibold">{selectedProject.progress}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>团队数量</span>
                          <span className="font-semibold">{selectedProject.teams.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>任务数量</span>
                          <span className="font-semibold">{selectedProject.tasks.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>已完成任务</span>
                          <span className="font-semibold text-green-600">{completedTasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>讨论数量</span>
                          <span className="font-semibold">{selectedProject.discussions.length}</span>
                        </div>
                        {userTeam && (
                            <div className="pt-2 border-t">
                              <div className="flex justify-between">
                                <span>我的团队进度</span>
                                <span className="font-semibold text-blue-600">{userTeam.progress}%</span>
                              </div>
                            </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>最近活动</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>任务"需求分析"已完成</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>新成员加入团队</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>讨论区有新回复</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="teams">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">团队管理</h2>
                    <div className="flex space-x-2">
                      {user.role === "student" && !userTeam && (
                          <>
                            <Dialog open={showJoinTeam} onOpenChange={setShowJoinTeam}>
                              <DialogTrigger asChild>
                                <Button variant="outline">
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  加入团队
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>加入团队</DialogTitle>
                                  <DialogDescription>选择一个团队加入</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {selectedProject.teams
                                      .filter((team) => canJoinTeam(team))
                                      .map((team) => (
                                          <div
                                              key={team.id}
                                              className="flex items-center justify-between p-3 border rounded-lg"
                                          >
                                            <div>
                                              <h4 className="font-medium">{team.name}</h4>
                                              <p className="text-sm text-gray-500">成员: {team.members.length}/4</p>
                                              <p className="text-sm text-gray-500">进度: {team.progress}%</p>
                                            </div>
                                            <Button size="sm" onClick={() => handleJoinTeam(team.id)}>
                                              加入
                                            </Button>
                                          </div>
                                      ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
                              <DialogTrigger asChild>
                                <Button>
                                  <Plus className="w-4 h-4 mr-2" />
                                  创建团队
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>创建新团队</DialogTitle>
                                  <DialogDescription>为项目创建一个新的团队</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="teamName">团队名称</Label>
                                    <Input
                                        id="teamName"
                                        value={newTeam.name}
                                        onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                                        placeholder="输入团队名称"
                                    />
                                  </div>
                                  <Button onClick={handleCreateTeam} className="w-full">
                                    创建团队
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                      )}
                      {user.role === "teacher" && (
                          <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
                            <DialogTrigger asChild>
                              <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                创建团队
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>创建新团队</DialogTitle>
                                <DialogDescription>为项目创建一个新的团队</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="teamName">团队名称</Label>
                                  <Input
                                      id="teamName"
                                      value={newTeam.name}
                                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                                      placeholder="输入团队名称"
                                  />
                                </div>
                                <Button onClick={handleCreateTeam} className="w-full">
                                  创建团队
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedProject.teams.map((team) => {
                      const isMyTeam = user && team.members.includes(user.id)
                      return (
                          <Card key={team.id} className={isMyTeam ? "ring-2 ring-blue-500 bg-blue-50/30" : ""}>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {team.name}
                                  {isMyTeam && (
                                      <Badge className="ml-2" variant="default">
                                        我的团队
                                      </Badge>
                                  )}
                                </div>
                                <Badge variant="outline">
                                  <Users className="w-3 h-3 mr-1" />
                                  {team.members.length}/4
                                </Badge>
                              </CardTitle>
                              <CardDescription>创建于 {team.createdAt}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between text-sm mb-2">
                                    <span>团队进度</span>
                                    <span>{team.progress}%</span>
                                  </div>
                                  <Progress value={team.progress} />
                                </div>

                                {team.leader && (
                                    <div className="text-sm">
                                      <span className="font-medium">团队组长:</span>
                                      <span className="ml-2 text-blue-600">
                                  {team.leader === user.id ? "我" : team.leader}
                                </span>
                                    </div>
                                )}

                                <div>
                                  <p className="text-sm font-medium mb-2">团队成员 ({team.members.length}/4)</p>
                                  <div className="space-y-1">
                                    {team.members.map((member, index) => (
                                        <div key={index} className="flex items-center space-x-2 text-sm">
                                          <Avatar className="w-6 h-6">
                                            <AvatarFallback className="text-xs">
                                              {(member === user.id ? user.name : member).charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span
                                              className={member === user.id ? "font-medium text-blue-600" : "text-gray-700"}
                                          >
                                      {member === user.id ? `我 (${user.name})` : member}
                                    </span>
                                          {team.leader === member && (
                                              <Badge variant="outline" className="text-xs">
                                                组长
                                              </Badge>
                                          )}
                                        </div>
                                    ))}
                                    {team.members.length < 4 && (
                                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                                          <div className="w-6 h-6 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                                            <Plus className="w-3 h-3" />
                                          </div>
                                          <span>还可加入 {4 - team.members.length} 人</span>
                                        </div>
                                    )}
                                  </div>
                                </div>

                                {team.score && (
                                    <div className="flex items-center space-x-2">
                                      <Star className="w-4 h-4 text-yellow-500" />
                                      <span className="text-sm font-medium">评分: {team.score}/100</span>
                                    </div>
                                )}

                                {team.feedback && (
                                    <div className="text-sm text-gray-600">
                                      <p className="font-medium">教师评语:</p>
                                      <p className="mt-1">{team.feedback}</p>
                                    </div>
                                )}

                                {user.role === "student" && !isMyTeam && canJoinTeam(team) && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full bg-transparent"
                                        onClick={() => handleJoinTeam(team.id)}
                                    >
                                      加入团队
                                    </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tasks">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>任务列表</CardTitle>
                        <CardDescription>项目相关的所有任务和分工</CardDescription>
                      </div>
                      {user.role === "teacher" && (
                          <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
                            <DialogTrigger asChild>
                              <Button size="sm">
                                <Plus className="w-4 h-4 mr-1" />
                                添加任务
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>创建新任务</DialogTitle>
                                <DialogDescription>为项目添加新任务</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="taskTitle">任务标题</Label>
                                  <Input
                                      id="taskTitle"
                                      value={newTask.title}
                                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                      placeholder="输入任务标题"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="taskDescription">任务描述</Label>
                                  <Textarea
                                      id="taskDescription"
                                      value={newTask.description}
                                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                      placeholder="输入任务详细描述"
                                      rows={3}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="taskDueDate">截止日期</Label>
                                    <Input
                                        id="taskDueDate"
                                        type="date"
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="taskPriority">优先级</Label>
                                    <select
                                        id="taskPriority"
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                      <option value="high">高优先级</option>
                                      <option value="medium">中优先级</option>
                                      <option value="low">低优先级</option>
                                    </select>
                                  </div>
                                </div>
                                <Button onClick={handleCreateTask} className="w-full">
                                  创建任务
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedProject.tasks.map((task) => {
                        const isMyTask = task.assignedTo?.includes(user.id)
                        const mySubmission = task.submissions?.find(sub => sub.userId === user.id)

                        return (
                            <div
                                key={task.id}
                                className={`flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 ${
                                    isMyTask ? "bg-blue-50 border-blue-200" : ""
                                }`}
                            >
                              <input
                                  type="checkbox"
                                  checked={task.completed}
                                  className="w-4 h-4 mt-1"
                                  onChange={() => handleCompleteTask(task.id)}
                                  disabled={user.role !== "student" || !isMyTask}
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className={`font-medium ${task.completed ? "line-through text-gray-500" : ""}`}>
                                    {task.title}
                                  </h3>
                                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                    {task.priority === "high"
                                        ? "高优先级"
                                        : task.priority === "medium"
                                            ? "中优先级"
                                            : "低优先级"}
                                  </Badge>
                                  {isMyTask && (
                                      <Badge variant="default" className="text-xs">
                                        我的任务
                                      </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>截止: {task.dueDate}</span>
                                  {task.assignedTo && task.assignedTo.length > 0 && (
                                      <span>
                                  负责人:{" "}
                                        {task.assignedTo
                                            .map((assignee) => (assignee === user.id ? "我" : assignee))
                                            .join(", ")}
                                </span>
                                  )}
                                </div>

                                {/* 学生提交区域 */}
                                {user.role === "student" && isMyTask && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      {mySubmission ? (
                                          <div className="bg-green-50 p-3 rounded-lg">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center">
                                                <Check className="w-4 h-4 text-green-600 mr-2" />
                                                <span className="text-sm font-medium text-green-700">已提交</span>
                                              </div>
                                              <span className="text-xs text-gray-500">{mySubmission.timestamp}</span>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-700">{mySubmission.content}</p>
                                            {mySubmission.attachments && mySubmission.attachments.length > 0 && (
                                                <div className="mt-2">
                                                  <p className="text-xs font-medium text-gray-600">附件:</p>
                                                  <div className="flex flex-wrap gap-1 mt-1">
                                                    {mySubmission.attachments.map((file, index) => (
                                                        <a
                                                            key={index}
                                                            href={file}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:underline"
                                                        >
                                                          <FileText className="w-3 h-3 inline mr-1" />
                                                          附件{index + 1}
                                                        </a>
                                                    ))}
                                                  </div>
                                                </div>
                                            )}
                                          </div>
                                      ) : (
                                          <div className="flex items-center space-x-2">
                                            <Dialog open={showSubmitTask} onOpenChange={setShowSubmitTask}>
                                              <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                      setCurrentTaskForSubmission(task)
                                                      setShowSubmitTask(true)
                                                    }}
                                                >
                                                  <FileText className="w-4 h-4 mr-1" />
                                                  提交任务
                                                </Button>
                                              </DialogTrigger>
                                              <DialogContent>
                                                <DialogHeader>
                                                  <DialogTitle>提交任务: {currentTaskForSubmission?.title}</DialogTitle>
                                                  <DialogDescription>请填写任务完成情况</DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                  <div>
                                                    <Label htmlFor="submissionContent">任务完成说明</Label>
                                                    <Textarea
                                                        id="submissionContent"
                                                        value={newSubmission.content}
                                                        onChange={(e) => setNewSubmission({ ...newSubmission, content: e.target.value })}
                                                        placeholder="描述你的任务完成情况..."
                                                        rows={4}
                                                    />
                                                  </div>
                                                  <div>
                                                    <Label htmlFor="submissionAttachments">上传附件</Label>
                                                    <Input
                                                        id="submissionAttachments"
                                                        type="file"
                                                        multiple
                                                        className="mt-1"
                                                        // 简化处理，实际应用中需要处理文件上传
                                                        onChange={(e) => {
                                                          if (e.target.files) {
                                                            const files = Array.from(e.target.files).map(file => URL.createObjectURL(file))
                                                            setNewSubmission({ ...newSubmission, attachments: files })
                                                          }
                                                        }}
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">支持PDF、Word、图片等格式</p>
                                                  </div>
                                                  <Button onClick={handleSubmitTask} className="w-full">
                                                    提交任务
                                                  </Button>
                                                </div>
                                              </DialogContent>
                                            </Dialog>
                                            <span className="text-xs text-red-600">未提交</span>
                                          </div>
                                      )}
                                    </div>
                                )}
                              </div>
                              <Badge variant={task.completed ? "default" : "secondary"}>
                                {task.completed ? "已完成" : "进行中"}
                              </Badge>
                            </div>
                        )
                      })}

                      {selectedProject.tasks.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>暂无任务</p>
                          </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="discussions">
                <Card>
                  <CardHeader>
                    <CardTitle>讨论区</CardTitle>
                    <CardDescription>在这里发表你的评论和看法</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comments.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>暂无评论，快来发表第一条评论吧！</p>
                          </div>
                      ) : (
                          comments.map((comment) => (
                              <div key={comment.id} className="flex items-start space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback>{comment.author.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-gray-100 p-3 rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-gray-800">{comment.author}</span>
                                    <span className="text-xs text-gray-500">{comment.timestamp}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{comment.content}</p>
                                </div>
                              </div>
                          ))
                      )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold mb-3">发表评论</h3>
                      <Textarea
                          placeholder="输入你的评论..."
                          value={newCommentContent}
                          onChange={(e) => setNewCommentContent(e.target.value)}
                          rows={4}
                          className="mb-3"
                      />
                      <Button onClick={handleAddComment} disabled={!newCommentContent.trim()}>
                        发表评论
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {user.role === "teacher" && (
                  <TabsContent value="grading">
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">团队评分管理</h2>
                      {selectedProject.teams.map((team) => (
                          <Card key={team.id}>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                {team.name}
                                <Badge variant="outline">进度: {team.progress}%</Badge>
                              </CardTitle>
                              <CardDescription>
                                成员: {team.members.length}人 | 创建于: {team.createdAt}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`score-${team.id}`}>评分 (0-100)</Label>
                                  <Input
                                      id={`score-${team.id}`}
                                      type="number"
                                      min="0"
                                      max="100"
                                      defaultValue={team.score || ""}
                                      placeholder="输入评分"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`feedback-${team.id}`}>评语</Label>
                                  <Textarea
                                      id={`feedback-${team.id}`}
                                      defaultValue={team.feedback || ""}
                                      placeholder="输入评语"
                                      rows={3}
                                  />
                                </div>
                              </div>
                              <Button className="mt-4">保存评分</Button>
                            </CardContent>
                          </Card>
                      ))}
                    </div>
                  </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">实训项目</h1>
              <p className="text-gray-600">
                {user.role === "student"
                    ? `参与实训项目 - 当前参与 ${filteredProjects.length} 个项目`
                    : "管理和参与实训项目"}
              </p>
            </div>
            {user.role === "teacher" && (
                <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      创建项目
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>创建新项目</DialogTitle>
                      <DialogDescription>创建一个新的实训项目</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="title">项目标题</Label>
                          <Input
                              id="title"
                              value={newProject.title}
                              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                              placeholder="输入项目标题"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">项目类别</Label>
                          <Input
                              id="category"
                              value={newProject.category}
                              onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                              placeholder="如：前端开发"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">项目描述</Label>
                        <Textarea
                            id="description"
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                            placeholder="输入项目描述"
                            rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="dueDate">截止日期</Label>
                          <Input
                              id="dueDate"
                              type="date"
                              value={newProject.dueDate}
                              onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="difficulty">难度等级</Label>
                          <select
                              id="difficulty"
                              value={newProject.difficulty}
                              onChange={(e) => setNewProject({ ...newProject, difficulty: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="初级">初级</option>
                            <option value="中级">中级</option>
                            <option value="高级">高级</option>
                          </select>
                        </div>
                      </div>

                      {/* 新增：任务添加区域 */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium">项目任务</h3>
                          <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={addTaskToProject}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            添加任务
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {newProject.tasks.map((task, index) => (
                              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-start mb-3">
                                  <span className="font-medium">任务 #{index + 1}</span>
                                  <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeTaskFromProject(index)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <Label htmlFor={`taskTitle-${index}`}>任务标题</Label>
                                    <Input
                                        id={`taskTitle-${index}`}
                                        value={task.title}
                                        onChange={(e) => updateTaskInProject(index, "title", e.target.value)}
                                        placeholder="输入任务标题"
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor={`taskDescription-${index}`}>任务描述</Label>
                                    <Textarea
                                        id={`taskDescription-${index}`}
                                        value={task.description}
                                        onChange={(e) => updateTaskInProject(index, "description", e.target.value)}
                                        placeholder="输入任务详细描述"
                                        rows={2}
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor={`taskDueDate-${index}`}>截止日期</Label>
                                      <Input
                                          id={`taskDueDate-${index}`}
                                          type="date"
                                          value={task.dueDate}
                                          onChange={(e) => updateTaskInProject(index, "dueDate", e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`taskPriority-${index}`}>优先级</Label>
                                      <select
                                          id={`taskPriority-${index}`}
                                          value={task.priority}
                                          onChange={(e) => updateTaskInProject(index, "priority", e.target.value)}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                      >
                                        <option value="high">高优先级</option>
                                        <option value="medium">中优先级</option>
                                        <option value="low">低优先级</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                          ))}

                          {newProject.tasks.length === 0 && (
                              <div className="text-center py-4 text-gray-500 border-2 border-dashed rounded-lg">
                                <p>暂无任务，点击"添加任务"按钮创建</p>
                              </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateProject} className="w-full">
                        创建项目
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
            )}
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                  placeholder="搜索项目名称、描述或类别..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
              />
            </div>
          </div>

          {user.role === "student" && filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Users className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">暂无参与的项目</h3>
                  <p className="text-sm">请联系老师将您加入到项目团队中去</p>
                </div>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const userTeam = getUserTeam(project)
              const completedTasks = project.tasks.filter((task) => task.completed).length
              const totalTasks = project.tasks.length

              return (
                  <Card
                      key={project.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 relative"
                      onClick={() => setSelectedProject(project)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge variant={project.status === "active" ? "default" : "secondary"}>
                            {project.status === "active" ? "进行中" : project.status === "completed" ? "已完成" : "草稿"}
                          </Badge>
                          <Badge className={getDifficultyColor(project.difficulty)}>{project.difficulty}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {project.category}
                        </Badge>
                        {userTeam && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              我的团队
                            </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>项目进度</span>
                            <span>{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>

                        {userTeam && (
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span>我的团队进度</span>
                                <span className="text-blue-600">{userTeam.progress}%</span>
                              </div>
                              <Progress value={userTeam.progress} className="h-2" />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {project.teams.length} 个团队
                          </div>
                          <div className="flex items-center">
                            <Target className="w-4 h-4 mr-1" />
                            {completedTasks}/{totalTasks} 任务
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {project.dueDate}
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {project.discussions.length} 讨论
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {project.teams.slice(0, 3).map((team, index) => (
                                <Avatar key={index} className="w-6 h-6 border-2 border-white">
                                  <AvatarFallback className="text-xs">{team.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            ))}
                            {project.teams.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                                  +{project.teams.length - 3}
                                </div>
                            )}
                          </div>

                          {userTeam && userTeam.score && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm font-medium">{userTeam.score}</span>
                              </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              )
            })}
          </div>
        </div>
      </div>
  )
}