"use client"

import {useState, useEffect, useCallback} from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  UserCog,
  GraduationCap,
  Send,
  Download, Minus,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// API基础URL配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1/teaching";
const USER_API_BASE_URL = process.env.NEXT_PUBLIC_USER_API_BASE_URL || "http://localhost:8080/api/v1";

// 项目状态类型
type ProjectStatus = "ACTIVE" | "COMPLETED" | "DRAFT";

// 任务优先级类型
type TaskPriority = "HIGH" | "MEDIUM" | "LOW";

// 任务状态类型
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "REVIEW";

// 后端DTO接口定义
interface UserInfoDTO {
  userId: number;
  id: number;
  username: string;
  realName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  role: "admin" | "teacher" | "student";
  classId?: number;
}

interface ProjectDTO {
  createdAt: string;
  id: number;
  title: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  creatorId: number;
  progress: number;
  tags?: string[];
}

interface ProjectDetailDTO extends ProjectDTO {
  tasks: ProjectTaskDTO[];
  teams: ProjectTeamDTO[];
  assignedStudents: UserInfoDTO[];
  progress: number;
  tags?: string[]; // Add progress field
}

interface ProjectTaskDTO {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: number | null;
  assignedToTeamId: number | null;
  dueDate: string;
  priority: TaskPriority;
  submissions: TaskSubmissionDTO[];
  assigneeType: "USER" | "TEAM";
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
  description: string;
  projectId: number;
  leaderId: number;
  createdAt: string;
  updatedAt: string;
  progress: number;
  tags?: string[];
  score: number | null;
  feedback: string | null;
  members: UserInfoDTO[];

}

interface CommentDTO {
  id: number;
  authorId: number;
  content: string;
  createdAt: string;
  replies: CommentDTO[];
  author?: { // 添加 author 属性
    id: number;
    realName: string;
  };
}

interface ClassDTO {
  id: number;
  name: string;
}
// 团队卡片组件
const TeamCard = ({
                    team,
                    user,
                    onGradeTeam
                  }: {
  team: ProjectTeamDTO;
  user: UserInfoDTO | null;
  onGradeTeam?: (team: ProjectTeamDTO) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<UserInfoDTO[]>([]);
  const [openAddMember, setOpenAddMember] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [studentsMap, setStudentsMap] = useState<{ [key: number]: UserInfoDTO[] }>({});

  // 获取团队成员
  const fetchTeamMembers = useCallback(async (teamId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/team-members/team/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const initialMembersData: UserInfoDTO[] = await response.json();
        const memberIdsToFetch = new Set<number>();
        const finalMembersMap = new Map<number, UserInfoDTO>();

        initialMembersData.forEach(member => {
          memberIdsToFetch.add(member.userId);
          finalMembersMap.set(member.userId, member);
        });

        await Promise.all(Array.from(memberIdsToFetch).map(async (memberId) => {
          try {
            const userResponse = await fetch(`${USER_API_BASE_URL}/me/${memberId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userResponse.ok) {
              const memberDetail = await userResponse.json();
              finalMembersMap.set(memberId, memberDetail);
            }
          } catch (err) {
            console.error(`获取成员 ${memberId} 详细信息失败:`, err);
          }
        }));

        setMembers(Array.from(finalMembersMap.values()));
      } else {
        console.error(`获取团队 ${teamId} 成员失败: ${response.status}`);
      }
    } catch (err) {
      console.error(`获取团队 ${teamId} 成员失败:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 一次性获取所有班级和学生数据
  const fetchClassesAndStudents = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("用户未登录");

      // 获取班级列表
      const classesResponse = await fetch(`${API_BASE_URL}/admin/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!classesResponse.ok) throw new Error("获取班级列表失败");
      const classesData = (await classesResponse.json()).data;
      const classesList: ClassDTO[] = classesData?.content || classesData?.records || [];
console.log('banji',classesList);
      // 获取所有班级的学生
      const studentsMap: { [key: number]: UserInfoDTO[] } = {};
      await Promise.all(classesList.map(async (cls) => {
        const classDetailResponse = await fetch(`${API_BASE_URL}/classes/${cls.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (classDetailResponse.ok) {
          studentsMap[cls.id] = ((await classDetailResponse.json()).data)?.members || [];
        }
      }));
console.log('xuesheng',studentsMap);
      setClasses(classesList);
      setStudentsMap(studentsMap);
    } catch (err) {
      console.error("获取班级和学生失败:", err);
    }
  };

  // 加载团队成员
  useEffect(() => {
    if (team.id) {
      fetchTeamMembers(team.id);
    }
  }, [team.id, fetchTeamMembers]);

  // 当打开添加成员弹窗时获取班级和学生数据
  useEffect(() => {
    if (openAddMember && user?.role === "teacher") {
      fetchClassesAndStudents();
    }
  }, [openAddMember, user?.role]);

  // 删除团队
  const handleDeleteTeam = async () => {
    if (!confirm("确定要删除这个团队吗？")) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/teams/${team.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        alert("团队删除成功");
        // 删除成功后刷新当前页面
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`团队删除失败: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error("删除团队失败:", err);
      alert("删除团队失败");
    } finally {
      setLoading(false);
    }
  };

  // 添加团队成员 - 使用正确的接口路径
  const handleAddMember = async () => {
    if (!selectedStudentId) {
      alert("请选择要添加的学生");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      // 使用正确的添加成员接口路径
      const response = await fetch(
          `${API_BASE_URL}/teams/${team.id}/members/${selectedStudentId}`,
          {
            method: "POST", // 添加成员是 POST 请求
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
      );

      if (response.ok) {
        alert("成员添加成功");
        fetchTeamMembers(team.id);
        setOpenAddMember(false);
        setSelectedClassId("");
        setSelectedStudentId("");
      } else {
        const errorData = await response.json();
        alert(`成员添加失败: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error("添加成员失败:", err);
      alert("添加成员失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除团队成员 - 使用正确的接口路径
  const handleRemoveMember = async (userId: number) => {
    if (!confirm("确定要移除这个成员吗？")) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      console.log('userid:', userId);
      console.log(team.id)
      // 使用删除成员接口路径
      const response = await fetch(
          `${API_BASE_URL}/team-members/${team.id}/${userId}`, // 直接使用用户ID
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          }
      );

      if (response.ok) {
        alert("成员移除成功");
        fetchTeamMembers(team.id);
      } else {
        const errorData = await response.json();
        alert(`成员移除失败: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error("移除成员失败:", err);
      alert("移除成员失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取当前班级的学生列表
  const currentStudents = selectedClassId
      ? studentsMap[parseInt(selectedClassId)] || []
      : [];

  const leaderId = team.leaderId || 0;
  const isMyTeam = user && members.some(m => m?.id === user?.id);

  return (
      <>
        <Card className={isMyTeam ? "ring-2 ring-blue-500 bg-blue-50/30" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                {team.name || "未命名团队"}
                {isMyTeam && <Badge className="ml-2">我的团队</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  {members.length}人
                </Badge>

                {user?.role === "teacher" && (
                    <div className="flex gap-2">
                      <Button
                          variant="destructive"
                          size="icon"
                          onClick={handleDeleteTeam}
                          disabled={loading}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>

                      <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onGradeTeam && onGradeTeam(team)}
                          disabled={team.score !== null || loading}
                      >
                        <Star className="w-3 h-3 text-yellow-500" />
                      </Button>
                    </div>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              {team.description || "无描述"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>团队进度</span>
                  <span>{team.progress || 0}%</span>
                </div>
                <Progress value={team.progress || 0} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">团队成员</p>

                  {user?.role === "teacher" && (
                      <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => setOpenAddMember(true)}
                          disabled={loading}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                  )}
                </div>

                <div className="space-y-1">
                  {loading ? (
                      <div className="flex justify-center py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                  ) : (
                      <>
                        {members.map(member => (
                            <div key={member.id} className="flex items-center justify-between group">
                              <div className="flex items-center space-x-2 text-sm">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback>
                                    {member.realName?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className={member.id === user?.id ? "font-medium text-blue-600" : ""}>
                            {member.id === user?.id
                                ? `我 (${member.realName || member.username})`
                                : member.realName || member.username}
                          </span>
                                {leaderId === member.id && (
                                    <Badge variant="outline" className="text-xs">组长</Badge>
                                )}
                              </div>

                              {user?.role === "teacher" && (
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => handleRemoveMember(member.id)}
                                      disabled={loading}
                                  >
                                    <Minus className="w-3 h-3 text-red-500" />
                                  </Button>
                              )}
                            </div>
                        ))}

                        {members.length === 0 && !loading && (
                            <p className="text-xs text-gray-500">暂无成员信息</p>
                        )}
                      </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm border-t pt-3">
                <div><span className="text-gray-500">组长ID</span> {leaderId}</div>
                <div><span className="text-gray-500">项目ID</span> {team.projectId || '0'}</div>
                <div><span className="text-gray-500">创建时间</span> {new Date(team.createdAt).toLocaleDateString()}</div>
                <div><span className="text-gray-500">更新时间</span> {new Date(team.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 添加成员弹窗 - 修复版本 */}
        <Dialog open={openAddMember} onOpenChange={setOpenAddMember}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加团队成员</DialogTitle>
              {/* 添加描述解决可访问性问题 */}
              <DialogDescription>
                从班级中选择学生添加到当前团队
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">选择班级</Label>
                <Select
                    value={selectedClassId || ""} // 确保值不为null
                    onValueChange={(newValue: string) => {
                      setSelectedClassId(newValue);
                      setSelectedStudentId(""); // 重置学生选择
                    }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择班级" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">选择学生</Label>
                <Select
                    value={selectedStudentId || ""} // 确保值不为null
                    onValueChange={(newValue: string) => setSelectedStudentId(newValue)}
                    disabled={!selectedClassId}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择学生" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentStudents.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.realName || s.username}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                  variant="outline"
                  onClick={() => setOpenAddMember(false)}
              >
                取消
              </Button>
              <Button
                  onClick={handleAddMember}
                  disabled={!selectedStudentId || loading}
              >
                添加成员
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
  );
};

// 我的团队信息卡片组件
const MyTeamCard = ({ teams, user }: { teams: ProjectTeamDTO[]; user: UserInfoDTO | null }) => {
  const [loadingTeams, setLoadingTeams] = useState<Record<number, boolean>>({});
  const [teamMembersMap, setTeamMembersMap] = useState<Record<number, UserInfoDTO[]>>({});

  // 获取团队成员
  const fetchTeamMembers = useCallback(async (teamId: number) => {
    setLoadingTeams(prev => ({ ...prev, [teamId]: true }));
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/team-members/team/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const initialMembersData: UserInfoDTO[] = await response.json();
        const memberIdsToFetch = new Set<number>();
        const finalMembersMap = new Map<number, UserInfoDTO>();

        initialMembersData.forEach(member => {
          memberIdsToFetch.add(member.userId);
          finalMembersMap.set(member.userId, member);
        });

        await Promise.all(Array.from(memberIdsToFetch).map(async (memberId) => {
          try {
            const userResponse = await fetch(`${USER_API_BASE_URL}/me/${memberId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userResponse.ok) {
              const memberDetail = await userResponse.json();
              finalMembersMap.set(memberId, memberDetail);
            }
          } catch (err) {
            console.error(`获取成员 ${memberId} 详细信息失败:`, err);
          }
        }));

        setTeamMembersMap(prev => ({ ...prev, [teamId]: Array.from(finalMembersMap.values()) }));

      } else {
        console.error(`获取团队 ${teamId} 成员失败: ${response.status}`);
      }
    } catch (err) {
      console.error(`获取团队 ${teamId} 成员失败:`, err);
    } finally {
      setLoadingTeams(prev => ({ ...prev, [teamId]: false }));
    }
  }, []);

  // 加载所有团队的成员
  useEffect(() => {
    teams.forEach(team => {
      if (team.id) {
        fetchTeamMembers(team.id);

      }
    });
  }, [teams, fetchTeamMembers]);

  return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
            我的团队信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
              <p className="text-gray-500">您目前没有加入任何团队。</p>
          ) : (
              <div className="space-y-6">
                {teams.map(team => {
                  const members = teamMembersMap[team.id] || [];
                  const loading = loadingTeams[team.id] || false;
                  return (
                      <div key={team.id} className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-800">{team.name}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">团队名称:</span>
                            <span className="ml-2 text-blue-700">{team.name}</span>
                          </div>
                          <div>
                            <span className="font-medium">团队进度:</span>
                            <span className="ml-2 text-blue-700">{team.progress}%</span>
                          </div>
                          <div>
                            <span className="font-medium">团队成员:</span>
                            <div className="ml-2 mt-1 flex flex-wrap gap-1">
                              {loading ? (
                                  <div className="flex justify-center w-full py-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                  </div>
                              ) : (
                                  members.map(member => (
                                      <Badge
                                          key={member.id}
                                          variant="outline"
                                          className="text-xs bg-blue-100 text-blue-800"
                                      >
                                        {member.id === user?.id ? "我" : member.realName}
                                      </Badge>
                                  ))
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">团队组长:</span>
                            <span className="ml-2 text-blue-700">
                            {members.find(m => m.id === team.leaderId)?.realName || "未指定"}
                          </span>
                          </div>
                        </div>

                        {team.score !== null && (
                            <div className="pt-2 border-t border-blue-200">
                              <div className="flex items-center space-x-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm font-medium">
                团队评分: {team.score + "/100"}
            </span>
                              </div>
                              {team.feedback !== null && (
                                  <div className="mt-2 text-sm">
                                    <span className="font-medium">教师评语:</span>
                                    <p className="mt-1 text-gray-700"> {team.feedback || "无评语"}</p>
                                  </div>

                              )}
                            </div>
                        )}
                      </div>
                  );
                })}
              </div>
          )}
        </CardContent>
      </Card>
  );
};
export default function TrainingProjectsPage() {
  const [names, setNames] = useState<Record<number, string>>({}); // { [userId]: realName }
  const [projectTags, setProjectTags] = useState<string>('');
  const [user, setUser] = useState<UserInfoDTO | null>(null);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDetailDTO | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showSubmitTask, setShowSubmitTask] = useState(false);
  const [showGradeTeam, setShowGradeTeam] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [currentTeamForGrade, setCurrentTeamForGrade] = useState<ProjectTeamDTO | null>(null);

  const handleOpenGradeTeamDialog = useCallback((team: ProjectTeamDTO) => {
    setCurrentTeamForGrade(team);
    setShowGradeTeam(true);
  }, []);
  const [currentTeamForTaskAssignment, setCurrentTeamForTaskAssignment] = useState<ProjectTeamDTO | null>(null);
  const [currentTaskForSubmission, setCurrentTaskForSubmission] = useState<ProjectTaskDTO | null>(null);
  const [currentTaskForEdit, setCurrentTaskForEdit] = useState<ProjectTaskDTO | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // 当currentTaskForEdit变化时，初始化assigneeType和selectedAssigneeId
  useEffect(() => {
    if (currentTaskForEdit) {
      setAssigneeType(currentTaskForEdit.assigneeType || 'USER');
      if (currentTaskForEdit.assigneeType === 'USER') {
        setSelectedAssigneeId(currentTaskForEdit.assigneeId);
      } else if (currentTaskForEdit.assigneeType === 'TEAM') {
        setSelectedAssigneeId(currentTaskForEdit.assignedToTeamId);
      }
    } else {
      setAssigneeType('USER');
      setSelectedAssigneeId(null);
    }
  }, [currentTaskForEdit]);
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [classMembers, setClassMembers] = useState<UserInfoDTO[]>([]);
  const [assigneeType, setAssigneeType] = useState<"USER" | "TEAM">("USER"); // 新增状态：分配类型
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(null); // 新增状态：选中的分配人/团队ID
  const [classStudents, setClassStudents] = useState<{[key: number]: UserInfoDTO[]}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [teamMembers, setTeamMembers] = useState<number[]>([]);
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<number | null>(null);
  const [projectProgress, setProjectProgress] = useState<number | null>(null); // 新增项目进度状态
  const [studentTeamsProgresses, setStudentTeamsProgresses] = useState<Record<number, number>>({}); // 新增学生团队进度状态，支持多个团队
  const [creatorNames, setCreatorNames] = useState<Record<number, string>>({});
  const router = useRouter();
  const [userTeams, setUserTeams] = useState<ProjectTeamDTO[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTaskDTO[]>([]);
  const [teamMembersMap, setTeamMembersMap] = useState<Record<number, UserInfoDTO[]>>({});
  const [loadingTeams, setLoadingTeams] = useState<Record<number, boolean>>({});
  const [allUsers, setAllUsers] = useState<UserInfoDTO[]>([]);
  const [allTeams, setAllTeams] = useState<ProjectTeamDTO[]>([]);
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
        console.log("当前用户信息:", currentUser);

        const token = localStorage.getItem("accessToken");

        // 根据角色获取项目
        let projectsUrl = `${API_BASE_URL}/projects`;
        if (currentUser.role === 'teacher') {
          projectsUrl = `${API_BASE_URL}/projects/creator/${currentUser.id}`;
        } else if (currentUser.role === 'student') {
          projectsUrl = `${API_BASE_URL}/projects/student/${currentUser.id}`;
        }

        const projectsResponse = await fetch(projectsUrl, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!projectsResponse.ok) {
          throw new Error("获取项目列表失败");
        }

        let projectsData = await projectsResponse.json();
        console.log("获取的项目列表数据:", projectsData);

        // =================== 新增部分：获取项目进度 ===================
        const projectsWithProgress = await Promise.all(
            projectsData.map(async (project: ProjectDTO) => {
              try {
                const progressResponse = await fetch(`${API_BASE_URL}/projects/${project.id}/progress`, {
                  headers: {
                    "Authorization": `Bearer ${token}`
                  }
                });

                if (progressResponse.ok) {
                  const progressData = await progressResponse.json();
                  console.log(`项目 ${project.id} 进度:`, progressData);
                  return { ...project, progress: progressData || 0 };
                } else {
                  console.error(`获取项目 ${project.id} 进度失败: ${progressResponse.status}`);
                  return { ...project, progress: 0 };
                }
              } catch (err) {
                console.error(`获取项目 ${project.id} 进度失败:`, err);
                return { ...project, progress: 0 };
              }
            })
        );
        setProjects(projectsWithProgress);
        // =================== 新增部分结束 ===================

        // =================== 新增部分：获取创建者信息 ===================
        // 创建映射表存储创建者名字
        // 提取所有唯一的创建者ID
        const creatorIds = projectsData.map((project: ProjectDTO) => project.creatorId);
        const uniqueCreatorIds = Array.from(new Set(creatorIds));

        // 并行获取每个创建者的信息
        await Promise.all(
            uniqueCreatorIds.map(async (creatorId) => {
              try {
                console.log(`获取创建者信息: creatorId=${creatorId}`);
                const creatorResponse = await fetch(`${USER_API_BASE_URL}/me/${creatorId}`, {
                  headers: {
                    "Authorization": `Bearer ${token}`
                  }
                });

                if (creatorResponse.ok) {
                  const creatorData: UserInfoDTO = await creatorResponse.json();
                  console.log(`创建者 ${creatorId} 信息:`, creatorData);
                  names[creatorId as number] = creatorData.realName;
                } else {
                  console.error(`获取创建者 ${creatorId} 信息失败: ${creatorResponse.status}`);
                  names[creatorId as number] = "未知用户";
                }
              } catch (err) {
                console.error(`获取创建者 ${creatorId} 信息失败:`, err);
                names[creatorId as number] = "未知用户";
              }
            })
        );

        setCreatorNames(names);
        console.log("创建者名称映射:", names);
        // =================== 新增部分结束 ===================

        // if (currentUser.role === 'teacher') {
        // 获取所有班级数据
        const classesResponse = await fetch(`${API_BASE_URL}/admin/classes`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!classesResponse.ok) {
          throw new Error("获取班级列表失败");
        }

        let classesData = await classesResponse.json();
        console.log("获取的班级列表数据:", classesData.data.records);
        classesData=classesData.data.records;
        // 确保 classesData 是一个数组
        if (!Array.isArray(classesData)) {
          console.warn("classesData 不是一个数组，将其设置为空数组。");
          classesData = [];
        }
        setClasses(classesData);

        // 获取每个班级的详细信息（包括学生）
        const classStudentsMap: { [key: number]: UserInfoDTO[] } = {};
        console.log("Before Promise.all, classesData:", classesData);
        await Promise.all(classesData.map(async (cls: ClassDTO) => {
          console.log("Inside map for class:", cls.id);
          try {
            const classDetailResponse = await fetch(`${API_BASE_URL}/classes/${cls.id}`, {
              headers: {
                "Authorization": `Bearer ${token}`
              }
            });

            if (!classDetailResponse.ok) {
              console.error(`获取班级 ${cls.id} 详情失败`);
              return;
            }

            const classDetail = await classDetailResponse.json();
            console.log(`班级 ${cls.id} 详情:`, classDetail);

            // 使用新的数据结构
            classStudentsMap[cls.id] = classDetail.data.members || [];
          } catch (err) {
            console.error(`获取班级 ${cls.id} 详情失败:`, err);
          }
        }));

        setClassStudents(classStudentsMap);
        console.log("所有班级学生数据:", classStudentsMap);

        // 如果班级列表不为空，默认选择第一个班级
        if (classesData.length > 0) {
          setSelectedClassId(classesData[0].id);
        }
        // }

        // 获取所有团队数据
        const allTeamsResponse = await fetch(`${API_BASE_URL}/teams`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!allTeamsResponse.ok) {
          console.error("获取所有团队失败");
        } else {
          const allTeamsData = await allTeamsResponse.json();
          setAllTeams(allTeamsData);
          console.log("所有团队数据:", allTeamsData);
        }
      } catch (err: any) {
        console.error("初始化数据失败:", err);
        setError(err.message || "初始化数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [router]);

  // 根据选择的班级更新班级成员列表
  useEffect(() => {
    if (selectedClassId && classStudents[selectedClassId]) {
      setClassMembers(classStudents[selectedClassId]);
    } else if (user?.role === 'student' && user?.classId && classStudents[user.classId]) {
      // 如果是学生，并且有班级ID，则设置班级成员为自己班级的成员
      setClassMembers(classStudents[user.classId]);
    } else {
      // 如果没有选择班级，或者没有班级学生数据，清空班级成员
      setClassMembers([]);
    }
  }, [selectedClassId, classStudents, user]);

//获取团队成员
  const fetchTeamMembers = async (teamId: number) => {
    try {
      setLoadingTeams(prev => ({ ...prev, [teamId]: true }));
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE_URL}/team-members/team/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const members = await response.json();
        setTeamMembersMap(prev => ({ ...prev, [teamId]: members }));
      } else {
        console.error(`获取团队 ${teamId} 成员失败: ${response.status}`);
      }
    } catch (err) {
      console.error(`获取团队 ${teamId} 成员失败:`, err);
    } finally {
      setLoadingTeams(prev => ({ ...prev, [teamId]: false }));
    }
  };

  // 获取项目详情
  const fetchProjectDetails = async (projectId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      console.log(`获取项目详情: projectId=${projectId}`);

      // 1. 获取项目基础信息
      const projectResponse = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!projectResponse.ok) {
        throw new Error("获取项目详情失败");
      }

      const projectDetail = await projectResponse.json();
      console.log("项目基础信息:", projectDetail);


      // 2. 获取项目任务
      const tasksResponse = await fetch(
          `${API_BASE_URL}/tasks/project/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
      );

      let tasks = [];
      if (tasksResponse.ok) {
        tasks = await tasksResponse.json();
        console.log("项目任务:", tasks);
        setProjectTasks(tasks);

          // --- Start of new code for assignee names ---
          const assigneeIdsToFetch = new Set<number>();
          tasks.forEach((task: ProjectTaskDTO) => {
            if (task.assigneeType === "USER" && task.assigneeId !== null && !names[task.assigneeId]) {
              assigneeIdsToFetch.add(task.assigneeId);
            }
          });

          if (assigneeIdsToFetch.size > 0) {
            const fetchedAssigneeNames: Record<number, string> = {};
            await Promise.all(
                Array.from(assigneeIdsToFetch).map(async (assigneeId) => {
                  try {
                    const userResponse = await fetch(`${USER_API_BASE_URL}/me/${assigneeId}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (userResponse.ok) {
                      const userData: UserInfoDTO = await userResponse.json();
                      fetchedAssigneeNames[assigneeId] = userData.realName;
                    } else {
                      console.error(`获取任务分配人 ${assigneeId} 详细信息失败: ${userResponse.status}`);
                      fetchedAssigneeNames[assigneeId] = "未知用户";
                    }
                  } catch (err) {
                    console.error(`获取任务分配人 ${assigneeId} 详细信息失败:`, err);
                    fetchedAssigneeNames[assigneeId] = "未知用户";
                  }
                })
            );
            setNames(prevNames => ({ ...prevNames, ...fetchedAssigneeNames }));
            console.log("任务分配人名称映射:", fetchedAssigneeNames);
          }
          // --- End of new code for assignee names ---

         
      }

      // 3. 获取项目评论
      const commentsResponse = await fetch(
          `${API_BASE_URL}/project-discussions/project/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
      );

      let commentsData = [];
      if (commentsResponse.ok) {
        commentsData = await commentsResponse.json();
        console.log("项目评论:", commentsData);

        // Fetch user details for each comment
        const commentsWithUserDetails = await Promise.all(
            commentsData.map(async (comment: any) => {
              try {
                const userResponse = await fetch(`${USER_API_BASE_URL}/me/${comment.userId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (userResponse.ok) {

                  const userData = await userResponse.json();
                  console.log(userData);
                  return { ...comment, author: { id: userData.id, realName: userData.realName || userData.username } };
                } else {
                  console.warn(`Failed to fetch user details for userId ${comment.userId}:`, userResponse.statusText);
                  return { ...comment, author: { id: comment.userId, realName: '未知用户' } };
                }
              } catch (error) {
                console.error(`Error fetching user details for userId ${comment.userId}:`, error);
                return { ...comment, author: { id: comment.userId, realName: '未知用户' } };
              }
            })
        );
        setComments(commentsWithUserDetails);
      }

      // =================== 关键修复部分开始 ===================
      // 4. 获取团队信息（使用独立API调用）
      console.log("获取项目团队列表...");
      const teamsResponse = await fetch(
          `${API_BASE_URL}/teams/project/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
      );

      let teams: ProjectTeamDTO[] = [];
      if (teamsResponse.ok) {
        teams = await teamsResponse.json();
        console.log("项目团队列表:", teams);
      } else {
        console.warn("获取团队列表失败:", teamsResponse.status);
      }

      // 5. 为每个团队获取成员信息
      console.log("获取团队成员信息...");
      const teamsWithMembers = await Promise.all(
          teams.map(async (team: any) => {
            try {
              console.log(`获取团队 ${team.id} 的成员...`);
              const membersResponse = await fetch(
                  `${API_BASE_URL}/team-members/team/${team.id}`,
                  { headers: { Authorization: `Bearer ${token}` } }
              );

              let members: UserInfoDTO[] = [];
              if (membersResponse.ok) {
                members = await membersResponse.json();
                console.log(`团队 ${team.id} 成员:`, members);
              } else {
                console.warn(`获取团队 ${team.id} 成员失败: ${membersResponse.status}`);
              }

              // 返回完整的团队对象，确保包含所有必要字段
              return {
                // 核心字段
                id: team.id || 0,
                name: team.name || "未命名团队",
                description: team.description || "无描述",
                projectId: team.projectId || projectId,
                leaderId: team.leaderId || 0,

                // 状态字段
                progress: team.progress || 0,
                score: team.score !== undefined ? team.score : null,
                feedback: team.feedback !== undefined ? team.feedback : null,

                // 时间字段
                createdAt: team.createdAt || new Date().toISOString(),
                updatedAt: team.updatedAt || new Date().toISOString(),

                // 成员数据
                members: members || [],

                // 保留原始数据
                ...team
              } as ProjectTeamDTO;
            } catch (err) {
              console.error(`获取团队 ${team.id} 成员失败:`, err);
              return {
                ...team,
                id: team.id || 0,
                name: team.name || "未命名团队",
                members: []
              } as ProjectTeamDTO;
            }
          })
      );
      console.log("带成员的团队列表:", teamsWithMembers);

      // 6. 获取团队评分信息
      console.log("获取团队评分信息...");
      const teamsWithMembersAndGrades = await Promise.all(
          teamsWithMembers.map(async (team: ProjectTeamDTO) => {
            try {
              console.log(`获取团队 ${team.id} 的评分...`);
              const gradesResponse = await fetch(
                  `${API_BASE_URL}/teams/${team.id}/grades`,
                  { headers: { Authorization: `Bearer ${token}` } }
              );

              if (gradesResponse.ok) {
                const gradeData = await gradesResponse.json();
                console.log(`团队 ${team.id} 评分:`, gradeData);
                // 确保 gradeData 是一个数组且包含至少一个元素
                if (Array.isArray(gradeData) && gradeData.length > 0) {
                  const latestGrade = gradeData[0]; // 假设第一个元素是最新或最相关的评分
                  return { ...team, score: Number(latestGrade.finalScore) || null, feedback: latestGrade.feedback || null   };
                } else {
                  // If no grade data, explicitly set score to null and feedback to null
                  return { ...team, score: null, feedback: null };
                }
              } else {
                console.warn(`获取团队 ${team.id} 评分失败: ${gradesResponse.status}`);
                // If fetching grades failed, explicitly set score to null and feedback to null
                return { ...team, score: null, feedback: null };
              }
            } catch (err) {
              console.error(`获取团队 ${team.id} 评分失败:`, err);
              return team; // 返回原始团队信息
            }
          })
      );
      // =================== 关键修复部分结束 ===================

      // 7. 获取用户团队信息 (This identifies which teams the user is part of)
      const userTeamsRawData = await fetchUserTeam(projectId);
      console.log("userTeamsRawData", userTeamsRawData);

      const userTeamIds = new Set(userTeamsRawData.map((team: any) => team.id));

      // 8. 获取所有团队的进度信息，并更新到 teamsWithMembersAndGrades 中
      const teamsWithProgress = await Promise.all(
          teamsWithMembersAndGrades.map(async (team: ProjectTeamDTO) => {
            try {
              const teamProgressResponse = await fetch(`${API_BASE_URL}/teams/${team.id}/progress`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (teamProgressResponse.ok) {
                const teamProgressData = await teamProgressResponse.json();
                console.log(`团队 ${team.id} 进度:`, teamProgressData);
                return { ...team, progress: teamProgressData }; // Update the team object with progress
              } else {
                console.warn(`获取团队 ${team.id} 进度失败:`, teamProgressResponse.status);
                return team; // Return original team if progress fetch fails
              }
            } catch (err) {
              console.error(`获取团队 ${team.id} 进度失败:`, err);
              return team; // Return original team if error
            }
          })
      );
      console.log("带进度的团队列表:", teamsWithProgress);

      // 过滤出用户所属的团队
      const userSpecificTeams = teamsWithProgress.filter((team: ProjectTeamDTO) =>
          userTeamIds.has(team.id)
      );
      setUserTeams(userSpecificTeams); // Set the state with user-specific teams and their progress

      // 9. 获取项目总进度
      const projectProgressResponse = await fetch(`${API_BASE_URL}/projects/${projectId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (projectProgressResponse.ok) {
        const progressData = await projectProgressResponse.json();
        console.log(progressData);
        setProjectProgress(progressData);
        console.log("项目总进度:", progressData);
      } else {
        console.warn("获取项目总进度失败:", projectProgressResponse.status);
        setProjectProgress(null);
      }

      // 10. 创建完整的项目对象
      const completeProject: ProjectDetailDTO = {
        ...projectDetail,
        tasks,
        teams: teamsWithProgress, // 使用带成员、评分和进度的团队列表
        comments: commentsData,
        assignedStudents: projectDetail.assignedStudents || [],
        progress: projectProgress || 0, // 将项目总进度添加到 completeProject
        tags: typeof projectDetail.tags === 'string'
            ? (projectDetail.tags as string).split(',').map(tag => tag.trim())
            : projectDetail.tags || []
      };

      console.log("完整项目详情:", completeProject);
      setSelectedProject(completeProject);
    } catch (err: any) {
      console.error("获取项目详情失败:", err);
      setError(err.message || "获取项目详情失败");
    } finally {
      setLoading(false);
    }

  };


  // Helper function to upload a single file
  const uploadFile = async (file: File): Promise<string> => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("用户未登录");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userName", user?.realName || "unknown"); // Assuming user is available in scope
    formData.append("description", `Task submission attachment for ${currentTaskForSubmission?.title || ""}`);
    formData.append("fileName", file.name);
    formData.append("resourceType", "TASK_ATTACHMENT"); // Or determine based on file type

    try {
      const response = await fetch(`http://localhost:8080/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`文件上传失败: ${errorText}`);
      }

      const result = await response.text(); // Assuming the backend returns a string URL or identifier
      // You might need to parse the result if it's JSON and extract the URL
      // For now, assuming the result string itself is the URL or a success message
      console.log("文件上传成功响应:", result);
      // Depending on your backend, you might need to extract the actual file URL from the result
      // For this example, let's assume the backend returns the objectKey directly or a simple success message
      // If it returns a JSON object, you'll need to parse it: const data = await response.json(); return data.fileUrl;
      return result; // Placeholder: return a meaningful identifier or URL from the backend response
    } catch (error) {
      console.error("文件上传过程中发生错误:", error);
      throw error;
    }
  };
  // 创建项目
  const handleCreateProject = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      // 获取表单值
      const title = (document.getElementById('title') as HTMLInputElement)?.value || "新项目";
      const description = (document.getElementById('description') as HTMLTextAreaElement)?.value || "项目描述";
      const startDate = (document.getElementById('startDate') as HTMLInputElement)?.value || "";
      const endDate = (document.getElementById('endDate') as HTMLInputElement)?.value || "";
      const tags = projectTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).join(',');

      // 检查用户是否登录
      if (!user) {
        throw new Error("用户未登录，无法创建项目");
      }

      // 创建项目请求体
      const projectData = {
        title,
        description,
        creatorId: user.id,
        startDate,
        endDate,
        tags
      };

      console.log("创建项目请求体:", projectData);

      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "创建项目失败");
      }

      const newProject = await response.json();
      console.log("创建的项目响应数据:", newProject);

      // 在前端补充创建者信息
      const createdProject = {
        ...newProject,
        creator: {
          id: user.id,
          realName: user.realName,
          username: user.username,
          avatarUrl: user.avatarUrl
        }
      };

      setProjects([...projects, createdProject]);
      setShowCreateProject(false);
    } catch (err: any) {
      console.error("创建项目失败:", err);
      setError(err.message || "创建项目失败");
    } finally {
      setLoading(false);
    }
  };

  // 创建团队
  // 修改后的创建团队逻辑
  const handleCreateTeam = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      // 获取表单值
      const teamName = (document.getElementById('teamName') as HTMLInputElement)?.value || "新团队";
      const teamLeader = (document.getElementById('teamLeader') as HTMLSelectElement)?.value || "";

      // 检查是否选择了组长
      if (!teamLeader) {
        throw new Error("请选择团队组长");
      }

      // 创建团队请求体
      const teamData = {
        name: teamName,
        leaderId: parseInt(teamLeader),
        projectId: selectedProject.id,
        memberIds: teamMembers
      };

      console.log("创建团队请求体:", teamData);

      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(teamData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "创建团队失败");
      }

      const newTeam = await response.json();
      console.log("创建的团队响应数据:", newTeam);

      // 更新项目详情中的团队列表
      const updatedProject = {
        ...selectedProject,
        teams: [...(selectedProject.teams || []), newTeam]
      };

      setSelectedProject(updatedProject);
      setShowCreateTeam(false);
      setTeamMembers([]); // 重置选择的成员

      // 更新用户团队信息
      await fetchUserTeam(selectedProject.id);
    } catch (err: any) {
      console.error("创建团队失败:", err);
      setError(err.message || "创建团队失败");
    } finally {
      setLoading(false);
    }
  };

  // 创建任务
  const handleCreateTask = async () => {
    if (!selectedProject) return;

    const taskTitle = (document.getElementById("taskTitle") as HTMLInputElement).value;
    const taskDescription = (document.getElementById("taskDescription") as HTMLTextAreaElement).value;
    const taskDueDate = (document.getElementById("taskDueDate") as HTMLInputElement).value;
    const taskPriority = (document.getElementById("taskPriority") as HTMLSelectElement).value as TaskPriority;
    // const taskAssigneeId = (document.getElementById("taskAssignee") as HTMLSelectElement).value;

    if (!taskTitle || !taskDueDate || !taskPriority) {
      setError("请填写所有必填项");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          title: taskTitle,
          description: taskDescription,
          dueDate: taskDueDate,
          priority: taskPriority,
          assigneeType: assigneeType,
          ...(assigneeType === "USER" && { assigneeId: selectedAssigneeId }),
          ...(assigneeType === "TEAM" && { assignedToTeamId: selectedAssigneeId }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "创建任务失败");
      }

      const newTask = await response.json();
      console.log("新任务创建成功:", newTask);

      // 重新获取项目详情以更新任务列表
      fetchProjectDetails(selectedProject.id);
      setShowCreateTask(false);
      setError("");
    } catch (err: any) {
      console.error("创建任务失败:", err);
      setError(err.message || "创建任务失败");
    } finally {
      setLoading(false);
    }
  };

  // 更新任务
  const handleUpdateTask = async () => {
    if (!selectedProject || !currentTaskForEdit) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      // 获取表单值
      const title = (document.getElementById('taskTitle') as HTMLInputElement)?.value || currentTaskForEdit.title;
      const description = (document.getElementById('taskDescription') as HTMLTextAreaElement)?.value || currentTaskForEdit.description;
      const dueDate = (document.getElementById('taskDueDate') as HTMLInputElement)?.value || currentTaskForEdit.dueDate;
      const priority = (document.getElementById('taskPriority') as HTMLSelectElement)?.value || currentTaskForEdit.priority;

      const response = await fetch(`${API_BASE_URL}/tasks/${currentTaskForEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          title: title,
          description: description,
          dueDate: dueDate,
          priority: priority,
          assigneeType: assigneeType,
          ...(assigneeType === "USER" && { assigneeId: selectedAssigneeId }),
          ...(assigneeType === "TEAM" && { assigneeId: selectedAssigneeId }),
        })
      });

      if (!response.ok) {
        throw new Error("更新任务失败");
      }

      const updatedTask = await response.json();
      console.log("更新的任务响应数据:", updatedTask);

      const updatedTasks = (selectedProject.tasks || []).map(task =>
          task.id === currentTaskForEdit.id ? updatedTask : task
      );

      const updatedProject = {
        ...selectedProject,
        tasks: updatedTasks
      };

      setSelectedProject(updatedProject);
      setShowEditTask(false);
      setCurrentTaskForEdit(null);
    } catch (err: any) {
      console.error("更新任务失败:", err);
      setError(err.message || "更新任务失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: number) => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      console.log(`删除任务: taskId=${taskId}`);
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("删除任务失败");
      }

      console.log("删除任务成功");

      const updatedTasks = (selectedProject.tasks || []).filter(task => task.id !== taskId);
      const updatedProject = {
        ...selectedProject,
        tasks: updatedTasks
      };

      setSelectedProject(updatedProject);
    } catch (err: any) {
      console.error("删除任务失败:", err);
      setError(err.message || "删除任务失败");
    } finally {
      setLoading(false);
    }
  };

  // 提交任务
  const handleSubmitTask = async () => {
    if (!currentTaskForSubmission || !user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      // 获取表单值
      const content = (document.getElementById('submissionContent') as HTMLTextAreaElement)?.value || "";

      if (!content.trim()) {
        throw new Error("请填写任务完成说明");
      }

      // 提交任务请求体
      const submissionData: TaskSubmissionDTO = {
        id: currentTaskForSubmission.id, // 临时ID，实际应由后端生成
        userId: user.id,
        content,
        attachments: [] as string[], // 这里简化处理，实际应用中需要处理文件上传
        submittedAt: new Date().toISOString(),
      };

      // Upload files if any
      if (selectedFiles.length > 0) {
        setLoading(true); // Show loading during file upload
        try {
          const uploadedAttachmentUrls = await Promise.all(
              selectedFiles.map(file => uploadFile(file))
          );
          submissionData.attachments = uploadedAttachmentUrls;
        } catch (uploadError) {
          console.error("文件上传失败:", uploadError);
          setError(`文件上传失败: ${(uploadError as Error).message}`);
          setLoading(false);
          return; // Stop submission if file upload fails
        }
      }



      if (selectedProject) {
        const updatedTasks = (selectedProject.tasks || []).map(task => {
          if (task.id === currentTaskForSubmission.id) {
            // 提交成功后，更新任务状态为 DONE，并添加新的提交记录
            return {
              ...task,
              status: "DONE" as TaskStatus, // 或者根据实际情况设置为 REVIEW
              submissions: [...(task.submissions || []), submissionData], // 添加新的提交记录
            };
          }
          return task;
        });

        // 调用API更新任务状态
        const updateStatusResponse = await fetch(`${API_BASE_URL}/tasks/${currentTaskForSubmission.id}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({status: "DONE"}) , // 将任务状态更新为 DONE
        });

        if (!updateStatusResponse.ok) {
          const errorData = await updateStatusResponse.json();
          throw new Error(errorData.message || "更新任务状态失败");
        }

        console.log("任务状态更新成功");

        const updatedProject = {
          ...selectedProject,
          tasks: updatedTasks
        };

        setSelectedProject(updatedProject);
      }

      setShowSubmitTask(false);
      setCurrentTaskForSubmission(null);
      setSelectedFiles([]); // Clear selected files after successful submission
    } catch (err: any) {
      console.error("提交任务失败:", err);
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
      const token = localStorage.getItem("accessToken");

      console.log("添加评论内容:", newCommentContent);
      const response = await fetch(`${API_BASE_URL}/project-discussions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: selectedProject.id,
          userId: user.id,
          content: newCommentContent,
          createdAt: new Date().toISOString(),
          createdBy: user.realName || user.username
        })
      });

      if (!response.ok) {
        throw new Error("添加评论失败");
      }

      const newComment = await response.json();
      console.log("添加的评论响应数据:", newComment);

      // 确保新评论包含完整的作者信息，以便前端正确显示
      const commentWithAuthor = {
        ...newComment,
        author: {
          id: user.id,
          realName: user.realName,
          username: user.username,
          avatarUrl: user.avatarUrl,
        },
      };

      setComments([...comments, commentWithAuthor]);
      setNewCommentContent('');
    } catch (err: any) {
      console.error("添加评论失败:", err);
      setError(err.message || "添加评论失败");
    } finally {
      setLoading(false);
    }
  };

  // 评分团队
  const submitTeamGrade = async () => {
    if (!currentTeamForGrade || !user || !selectedProject) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      // 获取表单值
      const score = parseFloat((document.getElementById('teamScore') as HTMLInputElement)?.value || "0");
      const feedback = (document.getElementById('teamFeedback') as HTMLTextAreaElement)?.value || "";

      // 评分请求体
      const gradeData = {
        projectId: selectedProject.id,
        teamId: currentTeamForGrade.id,
        teacherId: user.id,
        score,
        feedback
      };

      console.log("团队评分请求体:", gradeData);

      const response = await fetch(`${API_BASE_URL}/projects/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(gradeData)
      });
      console.log("评分回应",response);

      if (!response.ok) {
        throw new Error("评分失败");
      }

      // 检查Content-Type，确保只有在响应包含JSON时才尝试解析
      const contentType = response.headers.get("content-type");
      let updatedTeam = null;
      if (contentType && contentType.includes("application/json")) {
        updatedTeam = await response.json();
      } else if (response.status === 200 || response.status === 204) {
        // 如果状态码是200或204但没有JSON，则认为成功，不尝试解析
        console.log("评分成功，但响应体为空或非JSON。");
      } else {
        throw new Error("评分失败：非预期的响应格式");
      }

      // 如果updatedTeam为空，则使用currentTeamForGrade作为基础，避免后续操作报错
      if (!updatedTeam) {
        updatedTeam = { ...currentTeamForGrade, score: gradeData.score, feedback: gradeData.feedback };
      }
      console.log("团队评分响应数据:", updatedTeam);

      // 更新团队列表
      const updatedTeams = (selectedProject.teams || []).map(team =>
          team.id === currentTeamForGrade.id ? updatedTeam : team
      );

      const updatedProject = {
        ...selectedProject,
        teams: updatedTeams
      };

      setSelectedProject(updatedProject);
      setShowGradeTeam(false);
      setCurrentTeamForGrade(null);
    } catch (err: any) {
      console.error("评分失败:", err);
      setError(err.message || "评分失败");
    } finally {
      setLoading(false);
    }
  };

  // 指派任务给团队
  // 修改后的指派任务逻辑
  const handleAssignTaskToTeam = async () => {
    if (!currentTeamForTaskAssignment || !selectedTaskForAssignment) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      console.log(`指派任务: taskId=${selectedTaskForAssignment} 给团队 teamId=${currentTeamForTaskAssignment.id}`);
      const response = await fetch(`${API_BASE_URL}/tasks/${selectedTaskForAssignment}/assign-to-team/${currentTeamForTaskAssignment.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "指派任务失败");
      }

      console.log("指派任务成功");

      // 更新任务状态
      const updatedTasks = (selectedProject?.tasks || []).map(task => {
        if (task.id === selectedTaskForAssignment) {
          return {
            ...task,
            assignedToTeamId: currentTeamForTaskAssignment.id,
            assigneeId: null // 清除个人分配
          };
        }
        return task;
      });

      if (selectedProject) {
        const updatedProject = {
          ...selectedProject,
          tasks: updatedTasks
        };
        setSelectedProject(updatedProject);
      }

      setShowAssignTask(false);
      setSelectedTaskForAssignment(null);
      setCurrentTeamForTaskAssignment(null);
    } catch (err: any) {
      console.error("指派任务失败:", err);
      setError(err.message || "指派任务失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取用户团队信息（根据用户角色）
  const fetchUserTeam = async (projectId: number) => {
    if (!user) return null;

    try {
      const token = localStorage.getItem("accessToken");

      // 学生：获取当前项目中的团队
      if (user.role === "student") {
        // 获取用户在项目中的团队ID
        const response = await fetch(
            `${API_BASE_URL}/team-members/user/${user.id}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (!response.ok) return [];
        const data = await response.json();
        console.log("用户团队信息", data);

        if (!Array.isArray(data) || data.length === 0) {
          return []; // 如果没有团队成员数据，返回空数组
        }

        // 提取所有团队ID
        const teamIds = data.map((item: any) => item.teamId).filter(Boolean);

        // 并行获取所有团队的详细信息
        const teams = await Promise.all(
            teamIds.map(async (teamId: number) => {
              try {
                const teamResponse = await fetch(
                    `${API_BASE_URL}/teams/${teamId}`,
                    {
                      headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (teamResponse.ok) {
                  return await teamResponse.json();
                } else {
                  console.warn(`获取团队 ${teamId} 详情失败: ${teamResponse.status}`);
                  return null; // 返回 null 或其他标识，表示获取失败
                }
              } catch (error) {
                console.error(`获取团队 ${teamId} 详情时发生错误:`, error);
                return null;
              }
            })
        );

        // 过滤掉获取失败的团队（null 值）
        return teams.filter(Boolean); // 返回包含所有团队的数组

        return []; // 返回空数组表示没有加入团队
      }
      // 教师：获取项目下的所有团队
      else if (user.role === "teacher") {
        const response = await fetch(
            `${API_BASE_URL}/teams/project/${projectId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (!response.ok) return [];

        return await response.json(); // 返回所有团队数组
      }

      return [];
    } catch (error) {
      console.error("获取团队信息失败:", error);
      return [];
    }
  };


  // 获取用户团队
  const getUserTeam = (project: ProjectDetailDTO) => {
    if (!user) return null;
    return project.teams?.find(team =>
        team.members.some(member => member.id === user.id)
    );
  };

  // 处理团队成员选择
  const handleMemberSelect = (memberId: number) => {
    if (teamMembers.includes(memberId)) {
      setTeamMembers(teamMembers.filter(id => id !== memberId));
    } else {
      setTeamMembers([...teamMembers, memberId]);
    }
  };

  // 根据班级ID获取班级成员
  const getClassStudentsForDisplay = (classId: number) => {
    return classStudents[classId] || [];
  };

  // 判断用户是否是组长
  const isTeamLeader = (team: ProjectTeamDTO) => {
    return user && team.leaderId === user.id;
  };
// 获取学生可见的任务
  const fetchTasksForStudent = async (projectId: number) => {
    if (!user) return [];

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
          `${API_BASE_URL}/teaching/tasks/project/${projectId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
      );

      if (response.ok) {
        const tasks = await response.json();
        setProjectTasks(tasks);

          // --- Start of new code for assignee names ---
          const assigneeIdsToFetch = new Set<number>();
          tasks.forEach((task: ProjectTaskDTO) => {
            if (task.assigneeType === "USER" && task.assigneeId !== null && !names[task.assigneeId]) {
              assigneeIdsToFetch.add(task.assigneeId);
            }
          });

          if (assigneeIdsToFetch.size > 0) {
            const fetchedAssigneeNames: Record<number, string> = {};
            await Promise.all(
                Array.from(assigneeIdsToFetch).map(async (assigneeId) => {
                  try {
                    const userResponse = await fetch(`${USER_API_BASE_URL}/me/${assigneeId}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (userResponse.ok) {
                      const userData: UserInfoDTO = await userResponse.json();
                      fetchedAssigneeNames[assigneeId] = userData.realName;
                    } else {
                      console.error(`获取任务分配人 ${assigneeId} 详细信息失败: ${userResponse.status}`);
                      fetchedAssigneeNames[assigneeId] = "未知用户";
                    }
                  } catch (err) {
                    console.error(`获取任务分配人 ${assigneeId} 详细信息失败:`, err);
                    fetchedAssigneeNames[assigneeId] = "未知用户";
                  }
                })
            );
            setNames(prevNames => ({ ...prevNames, ...fetchedAssigneeNames }));
            console.log("任务分配人名称映射:", fetchedAssigneeNames);
          }
          // --- End of new code for assignee names ---

        
        // 获取用户团队
        const team = await fetchUserTeam(projectId);
        const isLeader = team ? isTeamLeader(team) : false;

      }
      return [];
    } catch (error) {
      console.error("获取任务失败:", error);
      return [];
    }
  };
  // 获取任务（修改后）
  const getVisibleTasksForStudent = () => {
    if (!user || !selectedProject) return [];



    // 学生可以看到所有任务，不再过滤
    return selectedProject.tasks || [];
  };

  if (!user) {
    return <div className="flex justify-center items-center h-screen">加载中...</div>;
  }

  // 在项目详情页
  if (selectedProject) {


    // 学生可以看到所有任务
    const visibleTasks = user.role === "student"
        ? getVisibleTasksForStudent() // 返回所有任务
        : selectedProject.tasks || [];

    const completedTasks = visibleTasks.filter(task => task.status === "DONE").length;
    const totalTasks = visibleTasks.length;

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
                  {selectedProject.tags && selectedProject.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedProject.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                  )}
                  {projectProgress !== null && (
                      <div className="mb-4">
                        <Label htmlFor="project-progress" className="text-lg font-semibold">项目总进度</Label>
                        <Progress value={projectProgress} className="w-full" id="project-progress" />
                        <span className="text-sm text-gray-600">{projectProgress}% 完成</span>
                      </div>
                  )}
                  {/*{Object.keys(studentTeamsProgresses).length > 0 && (*/}
                  {/*    <div className="mb-4">*/}
                  {/*      <Label className="text-lg font-semibold">我的团队进度</Label>*/}
                  {/*      {Object.entries(studentTeamsProgresses).map(([teamId, progress]) => {*/}
                  {/*        const team = selectedProject?.teams.find(t => t.id === parseInt(teamId));*/}
                  {/*        return (*/}
                  {/*            <div key={teamId} className="mb-2">*/}
                  {/*              <div className="flex justify-between items-center">*/}
                  {/*                <span className="text-base font-medium text-gray-800">{team ? team.name : `团队 ${teamId}`}</span>*/}
                  {/*                <span className="text-sm text-gray-600">{progress}% 完成</span>*/}
                  {/*              </div>*/}
                  {/*              <Progress value={progress} className="w-full" />*/}
                  {/*            </div>*/}
                  {/*        );*/}
                  {/*      })}*/}
                  {/*    </div>*/}
                  {/*)}*/}
                </div>
                <div className="flex flex-col items-end space-y-2">
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
                {/*<div className="flex items-center text-sm text-gray-500">*/}
                {/*  <Clock className="w-4 h-4 mr-1" />*/}
                {/*  项目进度: {selectedProject.progress}%*/}
                {/*</div>*/}
                <div className="flex items-center text-sm text-gray-500">
                  <Target className="w-4 h-4 mr-1" />
                  任务完成: {completedTasks}/{totalTasks}
                </div>
                {user?.role === "student" && userTeams.length > 0 && (
                    <div className="flex items-center text-sm text-green-600">
                      <UserCheck className="w-4 h-4 mr-1" />
                      我的团队:
                      {userTeams.map((team) => (
                          <span key={team.id} className="ml-1">{team.name}</span>
                      ))}
                    </div>
                )}
              </div>

              {/*<div className="space-y-2">*/}
              {/*  /!*<div className="flex justify-between text-sm">*!/*/}
              {/*  /!*  <span>项目总进度</span>*!/*/}
              {/*  /!*  <span>{selectedProject.progress}%</span>*!/*/}
              {/*  /!*</div>*!/*/}
              {/*  <Progress value={selectedProject.progress} className="h-2" />*/}

              {/*  /!* 仅当用户是学生且团队时显示团队进度 *!/*/}
              {/*  {user?.role === "student" && userTeam && (*/}
              {/*      <>*/}
              {/*        <div className="flex justify-between text-sm">*/}
              {/*          <span>我的团队进度</span>*/}
              {/*          <span className="text-blue-600">{userTeam.progress}%</span>*/}
              {/*        </div>*/}
              {/*        <Progress value={userTeam.progress} className="h-2" />*/}
              {/*      </>*/}
              {/*  )}*/}
              {/*</div>*/}
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
                            <span className="ml-2">{names[selectedProject.creatorId] || '未知'}</span>
                          </div>
                          <div>
                            <span className="font-medium">参与团队:</span>
                            <span className="ml-2">{selectedProject.teams?.length || 0} 个</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {user?.role === "student" && userTeams.length > 0 && (
                        <div className="space-y-6">
                          <MyTeamCard teams={userTeams} user={user} />
                        </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>项目统计</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/*  <div className="flex justify-between">*/}
                        {/*    <span>总进度</span>*/}
                        {/*    <span className="font-semibold">{selectedProject.progress}%</span>*/}
                        {/*  </div>*/}
                        <div className="flex justify-between">
                          <span>团队数量</span>
                          <span className="font-semibold">{selectedProject.teams?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>任务数量</span>
                          <span className="font-semibold">{totalTasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>已完成任务</span>
                          <span className="font-semibold text-green-600">{completedTasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>讨论数量</span>
                          <span className="font-semibold">{comments.length}</span>
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
                      {(user.role === "admin" || user.role === "teacher") && (


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
                                  <Label>选择班级</Label>
                                  <select
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                      value={selectedClassId || ""}
                                      onChange={(e) => {
                                        const classId = parseInt(e.target.value);
                                        setSelectedClassId(classId);
                                      }}
                                  >
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>
                                          {cls.name}
                                        </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                                  <Label>班级学生列表</Label>
                                  <div className="mt-1 space-y-2">
                                    {selectedClassId && classStudents[selectedClassId]?.map(member => (
                                        <div key={member.id} className="flex items-center space-x-2">
                                          <input
                                              type="checkbox"
                                              id={`member-${member.id}`}
                                              checked={teamMembers.includes(member.id)}
                                              onChange={() => handleMemberSelect(member.id)}
                                          />
                                          <label htmlFor={`member-${member.id}`} className="text-sm">
                                            {member.realName} {member.classId && `(${member.classId})`}
                                          </label>
                                        </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="teamLeader">团队组长</Label>
                                  <select
                                      id="teamLeader"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                  >
                                    <option value="">请选择团队组长</option>
                                    {teamMembers.map(memberId => {
                                      // 直接从当前班级成员中查找
                                      const member = classStudents[selectedClassId || 0]?.find(m => m.id === memberId);
                                      return member ? (
                                          <option key={member.id} value={member.id}>
                                            {member.realName}
                                          </option>
                                      ) : null;
                                    })}
                                  </select>
                                </div>

                                <div>
                                  <Label>已选团队成员 ({teamMembers.length})</Label>
                                  <div className="mt-1 space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                                    {teamMembers.map(memberId => {
                                      // 直接从当前班级成员中查找
                                      const member = classStudents[selectedClassId || 0]?.find(m => m.id === memberId);
                                      return member ? (
                                          <div key={member.id} className="flex items-center space-x-2">
                                            <Avatar className="w-6 h-6">
                                              <AvatarFallback>{member.realName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm">{member.realName}</span>
                                          </div>
                                      ) : null;
                                    })}
                                  </div>
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
                    {(selectedProject?.teams || []).map(team => (
                        team ? <TeamCard key={team.id} team={team} user={user} onGradeTeam={handleOpenGradeTeamDialog} /> : null
                    ))}
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
                      {(user.role === "admin" || user.role === "teacher") && (
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
                                <div>
                                  <Label htmlFor="taskAssignee">分配给</Label>
                                  <select
                                      id="assigneeType"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                                      value={assigneeType}
                                      onChange={(e) => {
                                        setAssigneeType(e.target.value as "USER" | "TEAM");
                                        setSelectedAssigneeId(null); // Reset selected assignee when type changes
                                      }}
                                  >
                                    <option value="USER">个人</option>
                                    <option value="TEAM">团队</option>
                                  </select>

                                  {assigneeType === "USER" && (
                                      <select
                                          id="taskAssignee"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                          value={selectedAssigneeId || ""}
                                          onChange={(e) => setSelectedAssigneeId(Number(e.target.value))}
                                      >
                                        <option value="">不分配</option>
                                        {classMembers.map(member => (
                                            <option key={member.id} value={member.id}>
                                              {member.realName}
                                            </option>
                                        ))}
                                      </select>
                                  )}

                                  {assigneeType === "TEAM" && (
                                      <select
                                          id="taskAssigneeTeam"
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                          value={selectedAssigneeId || ""}
                                          onChange={(e) => setSelectedAssigneeId(Number(e.target.value))}
                                      >
                                        <option value="">不分配</option>
                                        {selectedProject?.teams?.map(team => (
                                            <option key={team.id} value={team.id}>
                                              {team.name}
                                            </option>
                                        ))}
                                      </select>
                                  )}
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

                      {visibleTasks.map(task => {
                        const isMyTask = task.assigneeType === "USER" && task.assigneeId === user?.id;
                        const isTeamTask = task.assigneeType === "TEAM" && task.assigneeId && userTeams.some(team => team.id === task.assigneeId);
                        const canSubmit = isMyTask || (task.assigneeType === "TEAM" && task.assigneeId && userTeams.some(team => team.id === task.assigneeId && isTeamLeader(team)));
                        const mySubmission = task.submissions?.find(sub => sub.userId === user?.id);

                        // 获取负责人信息
                        let displayAssigneeName = "未分配";
                        if (task.assigneeType === "USER" && task.assigneeId) {
                          const assignee = classMembers.find(m => m.id === task.assigneeId);
                          displayAssigneeName = assignee ? (assignee.realName || assignee.username) : "未分配";
                        } else if (task.assigneeType === "TEAM" && task.assigneeId) {
                          const assignedTeam = selectedProject?.teams?.find(t => t.id === task.assigneeId);
                          displayAssigneeName = assignedTeam ? assignedTeam.name : "未分配团队";
                        }

                        // New function for downloading student reports
                        const handleDownloadStudentReport = async (task: ProjectTaskDTO) => {
                          try {
                            console.log("--------------------");
                            const token = localStorage.getItem("accessToken");
                            if (!token) {
                              toast({
                                title: "错误",
                                description: "用户未登录，无法下载报告。",
                                variant: "destructive",
                              });
                              return;
                            }
                            let fileName;
                            console.log(task);
                            if (task.assigneeType === "USER") {
                              // 根据task的assigneeId来获取用户的realname来展示
                              console.log(task.assigneeId)
                              const userName = names[task.assigneeId as number] || "未知用户";

                              fileName = `${task.title}_${userName}.doc`;
                              console.log(fileName);
                            } else if (task.assigneeType === "TEAM") {

                              // 根据task的assignedToTeamId来获取团队的name来展示
                              const team = allTeams.find(t => t.id === task.assigneeId);
                              const teamName = team ? team.name : "未知团队";
                              fileName = `${task.title}_${teamName}.doc`;
                              console.log(fileName);
                            } else {
                              fileName = `${task.title}.doc`;
                              console.log(fileName);
                            }

                            const localFilePath = `D://Downloads/${fileName}`; // Generic path for download

                            const response = await fetch(
                                `http://localhost:8080/download?fileName=${fileName}&localFilePath=${localFilePath}`,
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                            );

                            if (response.ok) {
                              alert(`下载成功！学生报告 ${fileName} 已开始下载。`);
                            } else {
                              const errorText = await response.text();
                              alert({
                                title: "下载失败",
                                description: `下载学生报告失败: ${errorText}`,
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            console.error("下载学生报告时发生错误:", error);
                            alert({
                              title: "错误",
                              description: `下载学生报告时发生错误: ${(error as Error).message}`,
                              variant: "destructive",
                            });
                          }
                        };



                        return (
                            <div
                                key={task.id}
                                className={`flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 ${
                                    (isMyTask && user?.role === "student") ? "bg-blue-50 border-blue-200" : ""
                                } ${(isTeamTask && user?.role === "student") ? "bg-green-50 border-green-200" : ""}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className={`font-medium ${task.status === "DONE" ? "line-through text-gray-500" : ""}`}>
                                    {task.title}
                                  </h3>

                                  {(isMyTask && user?.role === "student") && (
                                      <Badge variant="default" className="text-xs">
                                        我的任务
                                      </Badge>
                                  )}

                                  {(isTeamTask && user?.role === "student") && (
                                      <Badge variant="secondary" className="text-xs">
                                        团队任务
                                      </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>截止: {new Date(task.dueDate).toLocaleDateString()}</span>
                                  {(task.assigneeType === "USER" && task.assigneeId) || (task.assigneeType === "TEAM" && task.assigneeId) ? (
                                      <span>
              负责人: {displayAssigneeName}
            </span>
                                  ) : null}

                                </div>

                                {/* 提交区域 */}
                                {user?.role === "teacher" ? (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      {task.status === "DONE" ? (
                                          <div className="flex items-center space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDownloadStudentReport(task)}
                                            >
                                              <Download className="w-4 h-4 mr-1" />
                                              下载学生报告
                                            </Button>
                                            {/*<span className="text-xs text-green-600">*/}
                                            {/*    已提交 {task.submissions.length} 份报告*/}
                                            {/*</span>*/}
                                          </div>
                                      ) : (
                                          <div className="text-xs text-gray-500 mt-2">
                                            暂无学生报告
                                          </div>
                                      )}
                                    </div>
                                ) : (
                                    canSubmit && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                          {mySubmission ? (
                                              <div className="bg-green-50 p-3 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center">
                                                    <Check className="w-4 h-4 text-green-600 mr-2" />
                                                    <span className="text-sm font-medium text-green-700">已提交</span>
                                                  </div>
                                                  <span className="text-xs text-gray-500">
                                                            {new Date(mySubmission.submittedAt).toLocaleString()}
                                                        </span>
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
                                                  {task.status === "DONE" || task.status === "REVIEW" ? "重新提交" : "提交任务"}
                                                </Button>
                                                <span className={`text-xs ${task.status === "DONE" || task.status === "REVIEW" ? "text-green-600" : "text-red-600"}`}>
                                                        {task.status === "DONE" ? "已提交" : "未提交"}
                                                    </span>
                                              </div>
                                          )}
                                        </div>
                                    )
                                )}
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <Badge variant={task.status === "DONE" ? "default" : "secondary"}>
                                  {task.status === "DONE" ? "已提交" : "未提交"}
                                </Badge>

                                <div className="flex space-x-1">
                                  {(user.role === "admin" || user.role === "teacher") && (
                                      <>
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
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteTask(task.id)}
                                        >
                                          <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                      </>
                                  )}
                                </div>
                              </div>
                            </div>
                        );
                      })}

                      {visibleTasks.length === 0 && (
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
                            // 使用 authorId 查找作者信息
                            // const author = classMembers.find(m => m.id === comment.authorId);

                            return (
                                <div key={comment.id} className="flex items-start space-x-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback>
                                      {comment.author?.realName?.charAt(0).toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 bg-gray-100 p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">
                      {comment.author?.realName || "未知用户"}
                    </span>
                                      <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
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
                      <Button
                          onClick={handleAddComment}
                          disabled={!newCommentContent.trim() || loading}
                      >
                        <Send className="w-4 h-4 mr-2" />
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
                  <Label htmlFor="submissionAttachments">上传附件（命名要求：任务名_团队名（个人名））</Label>
                  <Input
                      id="submissionAttachments"
                      type="file"
                      multiple
                      className="mt-1"
                      onChange={e => {
                        if (e.target.files) {
                          setSelectedFiles(Array.from(e.target.files));
                        }
                      }}
                  />
                  <p className="text-xs text-gray-500 mt-1">支持PDF、Word、图片等格式</p>
                  {selectedFiles.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">已选择文件:</p>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                          {selectedFiles.map((file, index) => (
                              <li key={index} className="flex justify-between items-center">
                                {file.name}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                    }}
                                >
                                  移除
                                </Button>
                              </li>
                          ))}
                        </ul>
                      </div>
                  )}
                </div>
                <Button onClick={handleSubmitTask} disabled={loading}>
                  {currentTaskForSubmission?.status === "DONE" || currentTaskForSubmission?.status === "REVIEW" ? "重新提交" : "提交任务"}
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
                  <Label htmlFor="taskTitle">任务标题</Label>
                  <Input
                      id="taskTitle"
                      defaultValue={currentTaskForEdit?.title}
                      placeholder="输入任务标题"
                  />
                </div>
                <div>
                  <Label htmlFor="taskDescription">任务描述</Label>
                  <Textarea
                      id="taskDescription"
                      defaultValue={currentTaskForEdit?.description}
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
                        defaultValue={currentTaskForEdit?.dueDate}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taskPriority">优先级</Label>
                    <select
                        id="taskPriority"
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
                  <Label htmlFor="assigneeType">分配给</Label>
                  <select
                      id="assigneeType"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                      value={assigneeType}
                      onChange={(e) => {
                        setAssigneeType(e.target.value as "USER" | "TEAM");
                        setSelectedAssigneeId(null); // 重置选择的分配对象
                      }}
                  >
                    <option value="USER">个人</option>
                    <option value="TEAM">团队</option>
                  </select>

                  {assigneeType === "USER" && (
                      <select
                          id="selectedAssigneeId"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={selectedAssigneeId || ''}
                          onChange={(e) => setSelectedAssigneeId(Number(e.target.value))}
                      >
                        <option value="">选择用户</option>
                        {classMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.realName}
                            </option>
                        ))}
                      </select>
                  )}

                  {assigneeType === "TEAM" && (
                      <select
                          id="selectedAssigneeId"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={selectedAssigneeId || ''}
                          onChange={(e) => setSelectedAssigneeId(Number(e.target.value))}
                      >
                        <option value="">选择团队</option>
                        {(selectedProject?.teams || []).map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                        ))}
                      </select>
                  )}
                </div>
                <Button onClick={handleUpdateTask} disabled={loading}>
                  保存更改
                </Button>
              </div>
            </DialogContent>
          </Dialog>


          {/* 团队评分对话框 */}
          <Dialog open={showGradeTeam} onOpenChange={setShowGradeTeam}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>团队评分: {currentTeamForGrade?.name}</DialogTitle>
                <DialogDescription>为团队项目评分</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="teamScore">评分 (0-100)</Label>
                  <Input
                      id="teamScore"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="输入分数"
                  />
                </div>
                <div>
                  <Label htmlFor="teamFeedback">评语</Label>
                  <Textarea
                      id="teamFeedback"
                      placeholder="输入评语..."
                      rows={4}
                  />
                </div>
                <Button onClick={submitTeamGrade} disabled={loading}>
                  提交评分
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* 指派任务对话框 */}
          <Dialog open={showAssignTask} onOpenChange={setShowAssignTask}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>指派任务给团队: {currentTeamForTaskAssignment?.name}</DialogTitle>
                <DialogDescription>选择要指派的任务</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>选择任务</Label>
                  <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={selectedTaskForAssignment || ""}
                      onChange={(e) => setSelectedTaskForAssignment(parseInt(e.target.value))}
                  >
                    <option value="">请选择任务</option>
                    {(selectedProject?.tasks || []).filter(task => !task.assignedToTeamId).map(task => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleAssignTaskToTeam} disabled={!selectedTaskForAssignment || loading}>
                  指派任务
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
                {user ? `参与实训项目 - 当前参与 ${projects.length} 个项目` : "加载中..."}
              </p>
            </div>
            {(user.role === "admin" || user.role === "teacher") && (
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

                      <div>
                        <Label htmlFor="tags">项目标签 (逗号分隔)</Label>
                        <Input
                            id="tags"
                            placeholder="例如: React, Next.js, TypeScript"
                            value={projectTags}
                            onChange={(e) => setProjectTags(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateProject} disabled={loading}>
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
                  placeholder="搜索项目名称或描述..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
              />
            </div>
          </div>

          {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
          ) : error ? (
              <div className="text-center py-12 text-red-500">
                <h3 className="text-lg font-medium">加载失败</h3>
                <p className="text-sm">{error}</p>
                <Button className="mt-4" onClick={() => window.location.reload()}>
                  重新加载
                </Button>
              </div>
          ) : projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.filter(project =>
                    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    project.description.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(project => (
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
                              {/* 显示创建者名字 */}
                              {creatorNames[project.creatorId as keyof typeof creatorNames] ?? "加载中..."}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(project.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
          ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <Users className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">暂无项目</h3>
                  <p className="text-sm">请创建新项目或联系管理员</p>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}