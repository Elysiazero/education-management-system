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
  ChevronDown,
  Edit,
} from "lucide-react"

// API基础URL配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1/teaching";

// 项目状态类型
type ProjectStatus = "ACTIVE" | "COMPLETED" | "DRAFT";

// 任务优先级类型
type TaskPriority = "HIGH" | "MEDIUM" | "LOW";

// 任务状态类型
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "REVIEW";

// 后端DTO接口定义
interface UserInfoDTO {
  id: number;
  username: string;
  realName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
}

interface ProjectDTO {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  creator: UserInfoDTO;
  progress: number;
}

interface ProjectDetailDTO extends ProjectDTO {
  tasks: ProjectTaskDTO[];
  teams: ProjectTeamDTO[];
  assignedStudents: UserInfoDTO[];
}

interface ProjectTaskDTO {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: number | null;
  dueDate: string;
  priority: TaskPriority;
  submissions: TaskSubmissionDTO[];
}

interface TaskSubmissionDTO {
  id: number;
  userId: number;
  content: string;
  attachments: string[];
  submittedAt: string;
}

interface ProjectTeamDTO {
  id: number;
  name: string;
  projectId: number;
  leaderId: number;
  members: UserInfoDTO[];
  progress: number;
  score: number | null;
  feedback: string | null;
}

interface CommentDTO {
  id: number;
  authorId: number;
  content: string;
  createdAt: string;
  replies: CommentDTO[];
}

interface ClassDTO {
  id: number;
  name: string;
}

export default function TrainingProjectsPage() {
  const [user, setUser] = useState<UserInfoDTO | null>(null);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDetailDTO | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showSubmitTask, setShowSubmitTask] = useState(false);
  const [currentTaskForSubmission, setCurrentTaskForSubmission] = useState<ProjectTaskDTO | null>(null);
  const [currentTaskForEdit, setCurrentTaskForEdit] = useState<ProjectTaskDTO | null>(null);
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [classMembers, setClassMembers] = useState<UserInfoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  // 初始化数据
  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        setLoading(true);

        // 获取当前用户信息
        const userData = localStorage.getItem("user");
        if (!userData) {
          router.push("/login");
          return;
        }
        const currentUser = JSON.parse(userData);
        setUser(currentUser);
        console.log(currentUser);
        // 获取项目列表
        const userId=currentUser.id;
        const projectsResponse = await fetch(`${API_BASE_URL}/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (!projectsResponse.ok) {
          throw new Error('获取项目列表失败');
        }

        const projectsData: ProjectDTO[] = await projectsResponse.json();
        setProjects(projectsData);

        // 获取班级列表
        const classesResponse = await fetch(`${API_BASE_URL}/admin/classes`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (classesResponse.ok) {
          const classesData: ClassDTO[] = await classesResponse.json();
          setClasses(classesData);
        }

        // 获取班级成员（用户列表）
        let classId;
        const usersResponse = await fetch(`${API_BASE_URL}/classes/${classId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (usersResponse.ok) {
          const usersData: UserInfoDTO[] = await usersResponse.json();
          setClassMembers(usersData);
        }

      } catch (err: any) {
        setError(err.message || "初始化数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [router]);

  // 获取项目详情
  const fetchProjectDetails = async (projectId: number) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('获取项目详情失败');
      }

      const projectDetails: ProjectDetailDTO = await response.json();
      setSelectedProject(projectDetails);

      // 获取项目讨论
      const discussionsResponse = await fetch(`${API_BASE_URL}/project-discussions/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (discussionsResponse.ok) {
        const discussionsData: CommentDTO[] = await discussionsResponse.json();
        setComments(discussionsData);
      }

    } catch (err: any) {
      setError(err.message || "获取项目详情失败");
    } finally {
      setLoading(false);
    }
  };

  // 创建项目
  const handleCreateProject = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: selectedProject?.title,
          description: selectedProject?.description,
          coverUrl: selectedProject?.coverUrl,
          startDate: selectedProject?.startDate,
          endDate: selectedProject?.endDate
        })
      });

      if (!response.ok) {
        throw new Error('创建项目失败');
      }

      const newProject: ProjectDTO = await response.json();
      setProjects([...projects, newProject]);
      setShowCreateProject(false);

    } catch (err: any) {
      setError(err.message || "创建项目失败");
    } finally {
      setLoading(false);
    }
  };

  // 创建团队
  const handleCreateTeam = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedProject?.teams[0]?.name,
          description: selectedProject?.teams[0]?.name,
          projectId: selectedProject.id,
          leaderId: selectedProject?.teams[0]?.leaderId
        })
      });

      if (!response.ok) {
        throw new Error('创建团队失败');
      }

      const newTeam: ProjectTeamDTO = await response.json();

      // 添加团队成员
      for (const member of selectedProject.teams[0].members) {
        await fetch(`${API_BASE_URL}/team-members`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            teamId: newTeam.id,
            userId: member.id
          })
        });
      }

      // 更新项目详情
      if (selectedProject) {
        const updatedProject = {
          ...selectedProject,
          teams: [...selectedProject.teams, newTeam]
        };
        setSelectedProject(updatedProject);
      }

      setShowCreateTeam(false);

    } catch (err: any) {
      setError(err.message || "创建团队失败");
    } finally {
      setLoading(false);
    }
  };

  // 创建任务
  const handleCreateTask = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: selectedProject?.tasks[0]?.title,
          description: selectedProject?.tasks[0]?.description,
          projectId: selectedProject.id,
          assignedToUserId: selectedProject?.tasks[0]?.assigneeId,
          dueDate: selectedProject?.tasks[0]?.dueDate
        })
      });

      if (!response.ok) {
        throw new Error('创建任务失败');
      }

      const newTask: ProjectTaskDTO = await response.json();

      // 更新项目详情
      if (selectedProject) {
        const updatedProject = {
          ...selectedProject,
          tasks: [...selectedProject.tasks, newTask]
        };
        setSelectedProject(updatedProject);
      }

      setShowCreateTask(false);

    } catch (err: any) {
      setError(err.message || "创建任务失败");
    } finally {
      setLoading(false);
    }
  };

  // 更新任务状态
  const handleUpdateTaskStatus = async (taskId: number, status: TaskStatus) => {
    if (!selectedProject) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('更新任务状态失败');
      }

      // 更新本地任务状态
      if (selectedProject) {
        const updatedTasks = selectedProject.tasks.map(task =>
            task.id === taskId ? { ...task, status } : task
        );

        const updatedProject = {
          ...selectedProject,
          tasks: updatedTasks
        };

        setSelectedProject(updatedProject);
      }

    } catch (err: any) {
      setError(err.message || "更新任务状态失败");
    } finally {
      setLoading(false);
    }
  };

  // 提交任务
  const handleSubmitTask = async () => {
    if (!currentTaskForSubmission || !user) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/tasks/${currentTaskForSubmission.id}/submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: currentTaskForSubmission.description,
          attachments: []
        })
      });

      if (!response.ok) {
        throw new Error('提交任务失败');
      }

      const newSubmission: TaskSubmissionDTO = await response.json();

      // 更新本地任务状态
      if (selectedProject) {
        const updatedTasks = selectedProject.tasks.map(task => {
          if (task.id === currentTaskForSubmission.id) {
            return {
              ...task,
              submissions: [...task.submissions, newSubmission]
            };
          }
          return task;
        });

        const updatedProject = {
          ...selectedProject,
          tasks: updatedTasks
        };

        setSelectedProject(updatedProject);
      }

      setShowSubmitTask(false);
      setCurrentTaskForSubmission(null);

    } catch (err: any) {
      setError(err.message || "提交任务失败");
    } finally {
      setLoading(false);
    }
  };

  // 添加评论
  const handleAddComment = async () => {
    if (!newCommentContent.trim() || !user || !selectedProject) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/project-discussions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          userId: user.id,
          message: newCommentContent
        })
      });

      if (!response.ok) {
        throw new Error('添加评论失败');
      }

      const newComment: CommentDTO = await response.json();
      setComments([...comments, newComment]);
      setNewCommentContent('');

    } catch (err: any) {
      setError(err.message || "添加评论失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取用户团队
  const getUserTeam = (project: ProjectDetailDTO) => {
    if (!user) return null;
    return project.teams.find(team =>
        team.members.some(member => member.id === user.id)
    );
  };

  // 获取难度颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "初级": return "bg-green-100 text-green-800";
      case "中级": return "bg-yellow-100 text-yellow-800";
      case "高级": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "HIGH": return "bg-red-100 text-red-800";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800";
      case "LOW": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // 过滤项目
  const filteredProjects = projects.filter(project =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return <div>Loading...</div>;
  }

  if (selectedProject) {
    const userTeam = getUserTeam(selectedProject);
    const completedTasks = selectedProject.tasks.filter(task => task.status === "DONE").length;
    const totalTasks = selectedProject.tasks.length;

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
                  <Badge className={getDifficultyColor("中级")}>中级</Badge>
                  <Badge variant="outline">项目</Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Badge variant={selectedProject.status === "ACTIVE" ? "default" : "secondary"}>
                  {selectedProject.status === "ACTIVE" ? "进行中" : "已完成"}
                </Badge>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  截止日期: {selectedProject.endDate}
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
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">项目概览</TabsTrigger>
                <TabsTrigger value="teams">团队管理</TabsTrigger>
                <TabsTrigger value="tasks">任务列表</TabsTrigger>
                <TabsTrigger value="discussions">讨论区</TabsTrigger>
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
                            <span className="font-medium">开始日期:</span>
                            <span className="ml-2">{selectedProject.startDate}</span>
                          </div>
                          <div>
                            <span className="font-medium">截止日期:</span>
                            <span className="ml-2">{selectedProject.endDate}</span>
                          </div>
                          <div>
                            <span className="font-medium">创建人:</span>
                            <span className="ml-2">{selectedProject.creator.realName}</span>
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
                                          {member.id === user.id ? "我" : member.realName}
                                        </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-medium">团队组长:</span>
                                  <span className="ml-2 text-blue-700">
                                {userTeam.members.find(m => m.id === userTeam.leaderId)?.realName || "未指定"}
                              </span>
                                </div>
                              </div>

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
                          <span className="font-semibold">{comments.length}</span>
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
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="teams">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">团队管理</h2>
                    <div className="flex space-x-2">
                      <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            创建团队
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>创建新团队</DialogTitle>
                            <DialogDescription>为项目创建一个新的团队</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="teamName">团队名称</Label>
                              <Input
                                  id="teamName"
                                  placeholder="输入团队名称"
                              />
                            </div>

                            <div>
                              <Label htmlFor="teamLeader">团队组长</Label>
                              <select
                                  id="teamLeader"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              >
                                <option value="">请选择团队组长</option>
                                {classMembers.map(member => (
                                    <option key={member.id} value={member.id}>
                                      {member.realName}
                                    </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <Label>团队成员</Label>
                              <div className="mt-1 space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                                {classMembers.map(member => (
                                    <div key={member.id} className="flex items-center space-x-2">
                                      <input
                                          type="checkbox"
                                          id={`member-${member.id}`}
                                      />
                                      <label htmlFor={`member-${member.id}`} className="text-sm">
                                        {member.realName}
                                      </label>
                                    </div>
                                ))}
                              </div>
                            </div>

                            <Button onClick={handleCreateTeam} className="w-full">
                              创建团队
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedProject.teams.map(team => {
                      const isMyTeam = user && team.members.some(m => m.id === user.id);

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
                              <CardDescription>项目ID: {team.projectId}</CardDescription>
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

                                <div>
                                  <p className="text-sm font-medium mb-2">团队成员 ({team.members.length}/4)</p>
                                  <div className="space-y-1">
                                    {team.members.map(member => (
                                        <div key={member.id} className="flex items-center space-x-2 text-sm">
                                          <Avatar className="w-6 h-6">
                                            <AvatarFallback className="text-xs">
                                              {member.realName.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className={member.id === user?.id ? "font-medium text-blue-600" : "text-gray-700"}>
                                      {member.id === user?.id ? `我 (${member.realName})` : member.realName}
                                    </span>
                                          {team.leaderId === member.id && (
                                              <Badge variant="outline" className="text-xs">
                                                组长
                                              </Badge>
                                          )}
                                        </div>
                                    ))}
                                  </div>
                                </div>

                                {team.score !== null && (
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
                              </div>
                            </CardContent>
                          </Card>
                      );
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
                                  placeholder="输入任务标题"
                              />
                            </div>
                            <div>
                              <Label htmlFor="taskDescription">任务描述</Label>
                              <Textarea
                                  id="taskDescription"
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
                                />
                              </div>
                              <div>
                                <Label htmlFor="taskPriority">优先级</Label>
                                <select
                                    id="taskPriority"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                  <option value="HIGH">高优先级</option>
                                  <option value="MEDIUM">中优先级</option>
                                  <option value="LOW">低优先级</option>
                                </select>
                              </div>
                            </div>
                            <Button onClick={handleCreateTask} className="w-full">
                              创建任务
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedProject.tasks.map(task => {
                        const isMyTask = task.assigneeId === user?.id;
                        const mySubmission = task.submissions.find(sub => sub.userId === user?.id);

                        return (
                            <div
                                key={task.id}
                                className={`flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 ${
                                    isMyTask ? "bg-blue-50 border-blue-200" : ""
                                }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className={`font-medium ${task.status === "DONE" ? "line-through text-gray-500" : ""}`}>
                                    {task.title}
                                  </h3>
                                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                    {task.priority === "HIGH"
                                        ? "高优先级"
                                        : task.priority === "MEDIUM"
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
                                  {task.assigneeId && (
                                      <span>
                                  负责人: {classMembers.find(m => m.id === task.assigneeId)?.realName || "未指定"}
                                </span>
                                  )}
                                </div>

                                {/* 学生提交区域 */}
                                {user && task.assigneeId === user.id && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      {mySubmission ? (
                                          <div className="bg-green-50 p-3 rounded-lg">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center">
                                                <Check className="w-4 h-4 text-green-600 mr-2" />
                                                <span className="text-sm font-medium text-green-700">已提交</span>
                                              </div>
                                              <span className="text-xs text-gray-500">{mySubmission.submittedAt}</span>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-700">{mySubmission.content}</p>
                                          </div>
                                      ) : (
                                          <div className="flex items-center space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  setCurrentTaskForSubmission(task);
                                                  setShowSubmitTask(true);
                                                }}
                                            >
                                              <FileText className="w-4 h-4 mr-1" />
                                              提交任务
                                            </Button>
                                            <span className="text-xs text-red-600">未提交</span>
                                          </div>
                                      )}
                                    </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <Badge variant={task.status === "DONE" ? "default" : "secondary"}>
                                  {task.status === "DONE" ? "已完成" : "进行中"}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setCurrentTaskForEdit(task);
                                      setShowEditTask(true);
                                    }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                        );
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
                          comments.map(comment => {
                            const author = classMembers.find(m => m.id === comment.authorId) || user;
                            return (
                                <div key={comment.id} className="flex items-start space-x-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback>{author?.realName.charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 bg-gray-100 p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-gray-800">{author?.realName}</span>
                                      <span className="text-xs text-gray-500">{comment.createdAt}</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                  </div>
                                </div>
                            );
                          })
                      )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold mb-3">发表评论</h3>
                      <Textarea
                          placeholder="输入你的评论..."
                          value={newCommentContent}
                          onChange={e => setNewCommentContent(e.target.value)}
                          rows={4}
                          className="mb-3"
                      />
                      <Button onClick={handleAddComment} disabled={!newCommentContent.trim() || loading}>
                        发表评论
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* 提交任务对话框 */}
          <Dialog open={showSubmitTask} onOpenChange={setShowSubmitTask}>
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
                  />
                  <p className="text-xs text-gray-500 mt-1">支持PDF、Word、图片等格式</p>
                </div>
                <Button onClick={handleSubmitTask} disabled={loading}>
                  提交任务
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* 编辑任务对话框 */}
          <Dialog open={showEditTask} onOpenChange={setShowEditTask}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>编辑任务</DialogTitle>
                <DialogDescription>修改任务信息</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editTaskTitle">任务标题</Label>
                  <Input
                      id="editTaskTitle"
                      defaultValue={currentTaskForEdit?.title}
                      placeholder="输入任务标题"
                  />
                </div>
                <div>
                  <Label htmlFor="editTaskDescription">任务描述</Label>
                  <Textarea
                      id="editTaskDescription"
                      defaultValue={currentTaskForEdit?.description}
                      placeholder="输入任务详细描述"
                      rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editTaskDueDate">截止日期</Label>
                    <Input
                        id="editTaskDueDate"
                        type="date"
                        defaultValue={currentTaskForEdit?.dueDate}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editTaskPriority">优先级</Label>
                    <select
                        id="editTaskPriority"
                        defaultValue={currentTaskForEdit?.priority || "MEDIUM"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="HIGH">高优先级</option>
                      <option value="MEDIUM">中优先级</option>
                      <option value="LOW">低优先级</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>分配成员</Label>
                  <div className="mt-1 space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {classMembers.map(member => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <input
                              type="checkbox"
                              id={`edit-assign-${member.id}`}
                              defaultChecked={currentTaskForEdit?.assigneeId === member.id}
                          />
                          <label htmlFor={`edit-assign-${member.id}`} className="text-sm">
                            {member.realName}
                          </label>
                        </div>
                    ))}
                  </div>
                </div>
                <Button disabled={loading}>
                  保存更改
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">实训项目</h1>
              <p className="text-gray-600">
                {user ? `参与实训项目 - 当前参与 ${filteredProjects.length} 个项目` : "加载中..."}
              </p>
            </div>
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
                          placeholder="输入项目标题"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">项目类别</Label>
                      <Input
                          id="category"
                          placeholder="如：前端开发"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">项目描述</Label>
                    <Textarea
                        id="description"
                        placeholder="输入项目描述"
                        rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="startDate">开始日期</Label>
                      <Input
                          id="startDate"
                          type="date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">截止日期</Label>
                      <Input
                          id="endDate"
                          type="date"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateProject} disabled={loading}>
                    创建项目
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                  placeholder="搜索项目名称或描述..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
              />
            </div>
          </div>

          {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Users className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">暂无项目</h3>
                  <p className="text-sm">请创建新项目或联系管理员</p>
                </div>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map(project => {
                  return (
                      <Card
                          key={project.id}
                          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 relative"
                          onClick={() => fetchProjectDetails(project.id)}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start mb-2">
                            <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge variant={project.status === "ACTIVE" ? "default" : "secondary"}>
                                {project.status === "ACTIVE" ? "进行中" : "已完成"}
                              </Badge>
                              <Badge className={getDifficultyColor("中级")}>中级</Badge>
                            </div>
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

                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {project.progress}% 完成
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {project.endDate}
                              </div>
                              <div className="flex items-center">
                                <Target className="w-4 h-4 mr-1" />
                                {project.creator.realName}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  );
                })}
              </div>
          )}
        </div>
      </div>
  );
}