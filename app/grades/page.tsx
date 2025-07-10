"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Bar } from "recharts"
import {
  Search,
  TrendingUp,
  TrendingDown,
  Award,
  BookOpen,
  Download,
  Eye,
  Star,
  Target,
  Brain,
  CheckCircle,
  Users,
  FlaskConical,
  Filter,
  Plus,
  Edit,
  AlertTriangle,
  Clock,
  FileText,
  Bell,
  Lightbulb,
  BarChart3,
  BarChart, Share2,
} from "lucide-react"
import { undefined } from "zod";
import { Textarea } from "@/components/ui/textarea";

interface PerformanceCluster {
  clusterId: number;
  name: string;
  description: string;
  students: string[];
  averageScore: number;
  characteristics: string[];
  recommendations: string[];
}

interface TrendPrediction {
  date: string;
  predictedScore: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
}

interface User {
  id: string
  name: string
  email: string
  role: "student" | "teacher" | "admin"
}

interface Grade {
  createdAt: string;
  sourceType: string;
  id: string
  studentId: string
  studentName: string
  assignmentId: string
  assignmentName: string
  projectId?: string
  projectName?: string
  autoScore: number
  manualScore?: number
  finalScore: number
  submissionDate: string
  gradedDate?: string
  feedback?: string
  criteria: GradingCriteria[]
  status: "pending" | "graded" | "reviewed" | "late"
  teamId?: string
  teamName?: string
  isTeamProject?: boolean
  trend?: "up" | "down" | "stable"
  experimentId?: string;
  experimentName?: string;
  experimentDescription?: string;
  experimentDeadline?: string;
  isExperiment?: boolean;
}

interface GradingCriteria {
  id: string
  name: string
  description: string
  maxPoints: number
  earnedPoints: number
  feedback?: string
}

interface StudentAnalytics {
  studentId: string
  studentName: string
  averageScore: number
  totalAssignments: number
  completedAssignments: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  progressTrend: { date: string; score: number }[]
}

interface GradeAlert {
  id: string
  studentId: string
  studentName: string
  type: "decline" | "failing" | "below_average" | "missing_assignment"
  severity: "low" | "medium" | "high" | "critical"
  message: string
  createdAt: string
  status: "active" | "acknowledged" | "resolved" | "ignored"
  suggestions: string[]
}

interface Project {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  startDate: string;
  endDate: string;
  status: "ongoing" | "completed" | "upcoming";
}

interface Team {
  teamId: string;
  name: string;
  members: { userId: string; userName: string; role: string }[];
}

interface ClassInfo {
  id: string;
  name: string;
  student_ids: string[];
}
interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (grades: Grade[], analytics: StudentAnalytics) => boolean;
  severity: "low" | "medium" | "high" | "critical";
  suggestions: string[];
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1/teaching"
const USER_API_BASE_URL = process.env.NEXT_PUBLIC_USER_API_BASE_URL || "http://localhost:8080/api/v1"

export default function GradesPage() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: "declining-performance",
      name: "成绩持续下降",
      description: "学生最近3次成绩呈下降趋势",
      condition: (grades, analytics) => {
        const studentGrades = grades
          .filter(g => g.finalScore > 0)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        if (studentGrades.length < 3) return false;

        const lastThree = studentGrades.slice(-3);
        return lastThree[0].finalScore > lastThree[1].finalScore &&
          lastThree[1].finalScore > lastThree[2].finalScore;
      },
      severity: "medium",
      suggestions: [
        "安排一对一辅导",
        "检查学习方法和习惯",
        "提供额外练习材料"
      ]
    },
    {
      id: "failing-grade",
      name: "不及格风险",
      description: "学生最近成绩低于60分",
      condition: (grades, analytics) => {
        const latestGrade = [...grades]
          .filter(g => g.finalScore > 0)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        return latestGrade?.finalScore < 60;
      },
      severity: "high",
      suggestions: [
        "立即安排辅导",
        "联系家长沟通",
        "制定补救计划"
      ]
    },
    // 添加更多预警规则...
  ]);
  // 在组件状态中添加以下状态
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [focusArea, setFocusArea] = useState<string>("all");
  const [recommendations, setRecommendations] = useState<
    Array<{
      title: string;
      description: string;
      priority: "High" | "Medium" | "Low";
      resources?: string[]; // Add the optional 'resources' array property
    }>
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<User | null>(null)
  const [grades, setGrades] = useState<Grade[]>([])
  const [filteredGrades, setFilteredGrades] = useState<Grade[]>([])
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([])
  const [experimentProgress, setExperimentProgress] = useState<any>(null)
  const [alerts, setAlerts] = useState<GradeAlert[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // 在组件中添加新的状态
  const [performanceClusters, setPerformanceClusters] = useState<PerformanceCluster[]>([]);
  const [trendPredictions, setTrendPredictions] = useState<TrendPrediction[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [showGradeDialog, setShowGradeDialog] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [classInfo, setClassInfo] = useState<ClassInfo[]>([]); // New state
  const [studentRealNamesMap, setStudentRealNamesMap] = useState<Map<string, string>>(new Map()); // New state


  const router = useRouter()
  // 添加生成建议的处理函数
  const handleGenerateRecommendations = async (studentIdToAnalyze: string) => {
    if (!studentIdToAnalyze) {
      setError("必须提供一个学生ID来进行分析。");
      return;
    }

    const selectedStudent = analytics.find(a => a.studentId === studentIdToAnalyze);
    if (!selectedStudent) {
      setError("未找到该学生的分析数据。");
      return;
    }

    setIsGenerating(true);
    setRecommendations([]); // 清空上次结果
    setError(null);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("认证已过期，请重新登录。");
      setIsGenerating(false);
      return;
    }

    // 1. 准备要发送给后端的数据
    const requestBody = {
      studentId: selectedStudent.studentId,
      studentName: selectedStudent.studentName,
      averageScore: selectedStudent.averageScore,
      completionRate: (selectedStudent.completedAssignments / selectedStudent.totalAssignments) * 100,
      strengths: selectedStudent.strengths,
      weaknesses: selectedStudent.weaknesses,
      recentGrades: grades
        .filter(g => g.studentId === selectedStudent.studentId && g.status === "graded")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(g => ({
          assignmentName: g.assignmentName || g.projectName || g.experimentName,
          finalScore: g.finalScore
        }))
    };

    try {
      // 2. 调用新的后端API
      const response = await fetch(`http://localhost:8080/api/v1/admin/analysis/generate-recommendations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`AI建议服务请求失败，状态码: ${response.status}`);
      }

      const result = await response.json();

      if (result.code === 200 && result.data) {
        // 3. 解析AI返回的JSON字符串
        try {
          const parsedData = JSON.parse(result.data);
          // 从解析出的对象中，提取 recommendations 数组
          // 添加 || [] 是一个好习惯，防止当 recommendations 不存在时程序出错
          setRecommendations(parsedData.recommendations || parsedData.suggestions || []);
        } catch (jsonError) {
          console.error("解析AI响应JSON失败:", jsonError);
          throw new Error("AI返回的建议格式不正确。");
        }
      } else {
        throw new Error(result.message || "获取AI建议失败。");
      }

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };
  const generateAlerts = () => {
    if (!grades.length || !analytics.length) return [];

    const newAlerts: GradeAlert[] = [];

    analytics.forEach(student => {
      const studentGrades = grades.filter(g => g.studentId === student.studentId);

      alertRules.forEach(rule => {
        if (rule.condition(studentGrades, student)) {
          newAlerts.push({
            id: `${student.studentId}-${rule.id}-${Date.now()}`,
            studentId: student.studentId,
            studentName: student.studentName,
            type: rule.id.includes('declining') ? 'decline' :
              rule.id.includes('failing') ? 'failing' : 'below_average',
            severity: rule.severity,
            message: `${student.studentName}同学触发预警: ${rule.name}`,
            createdAt: new Date().toISOString(),
            status: "active",
            suggestions: rule.suggestions
          });
        }
      });

      // 检查缺交作业
      const missingAssignments = student.totalAssignments - student.completedAssignments;
      if (missingAssignments > 2) {
        newAlerts.push({
          id: `${student.studentId}-missing-assignments-${Date.now()}`,
          studentId: student.studentId,
          studentName: student.studentName,
          type: "missing_assignment",
          severity: missingAssignments > 4 ? "high" : "medium",
          message: `${student.studentName}同学有${missingAssignments}次作业未提交`,
          createdAt: new Date().toISOString(),
          status: "active",
          suggestions: [
            "联系学生了解原因",
            "提醒补交作业",
            "必要时联系家长"
          ]
        });
      }
    });

    return newAlerts;
  };
  useEffect(() => {
    if (grades.length > 0 && analytics.length > 0) {
      const generatedAlerts = generateAlerts();
      setAlerts(generatedAlerts);
    }
  }, [grades, analytics]);
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, status: "acknowledged" } : alert
    ));
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, status: "resolved" } : alert
    ));
  };

  const handleIgnoreAlert = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, status: "ignored" } : alert
    ));
  };

  // 更新生成个性化建议的函数
  const generatePersonalizedRecommendations = (studentId: string) => {
    // Find the student's analytics data
    const studentAnalytics = analytics.find(a => a.studentId === studentId);
    if (!studentAnalytics) return [];

    // Get the student's grades
    const studentGrades = grades.filter(g => g.studentId === studentId);

    // Calculate performance metrics
    const averageScore = studentAnalytics.averageScore;
    const completionRate = (studentAnalytics.completedAssignments / studentAnalytics.totalAssignments) * 100;
    const latestTrend = studentAnalytics.progressTrend.length > 1
      ? studentAnalytics.progressTrend.slice(-1)[0].score - studentAnalytics.progressTrend[0].score
      : 0;

    // Performance categories
    const performanceLevel = averageScore >= 85 ? "优秀" :
      averageScore >= 70 ? "良好" :
        averageScore >= 60 ? "及格" : "待提高";

    // Generate base recommendations based on performance level
    let recommendations: string[] = [];

    if (performanceLevel === "优秀") {
      recommendations.push(
        "继续保持优秀表现，可以尝试挑战更高难度的学习内容",
        "参与学科竞赛或研究项目，拓展知识边界",
        "帮助其他同学学习，教学相长",
        "担任学习小组的领导者，培养领导能力",
        "撰写学习博客或笔记，分享知识"
      );
    } else if (performanceLevel === "良好") {
      recommendations.push(
        "巩固优势科目，保持稳定发挥",
        "针对薄弱环节进行专项练习",
        "多与老师交流，获取更高层次的学习建议",
        "建立错题本，分析常见错误类型",
        "制定每周学习计划，合理安排时间"
      );
    } else if (performanceLevel === "及格") {
      recommendations.push(
        "制定详细的学习计划，合理安排时间",
        "加强基础知识的理解和记忆",
        "多做练习题，提高解题速度和准确率",
        "课前预习教材内容，提高课堂效率",
        "课后及时复习，巩固学习内容"
      );
    } else {
      recommendations.push(
        "从基础知识点开始系统复习",
        "寻求老师或同学的帮助，解决学习中的困惑",
        "增加学习时间，提高学习效率",
        "每天安排固定时间用于基础知识复习",
        "完成基础练习后再挑战复杂题目"
      );
    }

    // Add trend-based recommendations
    if (latestTrend > 5) {
      recommendations.push(
        "进步明显，继续保持当前的学习方法",
        "总结近期的有效学习方法，形成习惯",
        "设定更高但可实现的学习目标"
      );
    } else if (latestTrend < -5) {
      recommendations.push(
        "近期成绩有所下滑，建议分析原因并调整学习方法",
        "考虑与老师预约一对一辅导",
        "检查近期学习状态和生活作息"
      );
    }

    // Add completion rate recommendations
    if (completionRate < 80) {
      recommendations.push(
        "提高作业完成率，按时提交所有作业",
        "合理安排时间，优先完成学习任务",
        "使用任务清单管理作业提交时间"
      );
    }

    // Analyze by assignment type
    const projectGrades = studentGrades.filter(g => g.isTeamProject);
    const experimentGrades = studentGrades.filter(g => g.isExperiment);

    if (projectGrades.length > 0) {
      const projectAvg = projectGrades.reduce((sum, g) => sum + g.finalScore, 0) / projectGrades.length;
      if (projectAvg >= 85) {
        recommendations.push(
          "优秀的团队协作能力，可以尝试担任团队领导角色",
          "参与更复杂的项目，挑战自我",
          "总结团队协作经验，提升项目管理能力"
        );
      } else if (projectAvg < 70) {
        recommendations.push(
          "提高团队沟通效率，明确分工",
          "学习项目管理工具和方法，提高项目执行能力",
          "提前规划项目进度，避免最后匆忙完成"
        );
      }
    }

    if (experimentGrades.length > 0) {
      const experimentAvg = experimentGrades.reduce((sum, g) => sum + g.finalScore, 0) / experimentGrades.length;
      if (experimentAvg >= 85) {
        recommendations.push(
          "出色的实验能力，可以尝试设计创新性实验",
          "撰写更详细的实验报告，提高科研写作能力",
          "帮助其他同学完成实验任务"
        );
      } else if (experimentAvg < 70) {
        recommendations.push(
          "实验前充分预习，明确实验目的和步骤",
          "实验后认真分析数据，提高实验报告质量",
          "参考优秀实验报告，改进自己的报告"
        );
      }
    }

    // Add personalized feedback from strengths/weaknesses
    if (studentAnalytics.strengths.length > 0) {
      recommendations.push(
        `基于你的优势领域（${studentAnalytics.strengths.join("、")}），可以进一步发挥这些长处`,
        `在${studentAnalytics.strengths[0]}方面继续保持领先优势`
      );
    }

    if (studentAnalytics.weaknesses.length > 0) {
      recommendations.push(
        `需要特别关注以下方面：${studentAnalytics.weaknesses.join("、")}`,
        `针对${studentAnalytics.weaknesses[0]}，建议进行专项训练`,
        `制定${studentAnalytics.weaknesses[0]}的改进计划`
      );
    }

    // Add general study tips
    recommendations.push(
      "定期复习所学知识，避免遗忘",
      "保持积极的学习态度，遇到困难不轻易放弃",
      "合理规划时间，平衡学习和休息",
      "使用番茄工作法提高学习效率",
      "建立学习小组，互相监督和讨论"
    );

    // Remove duplicates and limit to 10 recommendations
    return [...new Set(recommendations)].slice(0, 15);
  };

  // 添加智能分析函数
  const analyzeStudentPerformance = () => {
    if (grades.length === 0 || analytics.length === 0) return;

    // 1. 成绩趋势预测
    const predictTrends = () => {
      const studentGrades = grades
        .filter(g => g.finalScore > 0)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      if (studentGrades.length < 3) return [];

      // 简单线性回归预测 (实际应用中可以使用更复杂的模型)
      const x = studentGrades.map((_, i) => i);
      const y = studentGrades.map(g => g.finalScore);

      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.map((xi, i) => xi * y[i]).reduce((a, b) => a + b, 0);
      const sumXX = x.map(xi => xi * xi).reduce((a, b) => a + b, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // 预测未来3个时间点的成绩
      const predictions: TrendPrediction[] = [];
      for (let i = 1; i <= 3; i++) {
        const nextX = x.length + i - 1;
        const predictedY = slope * nextX + intercept;

        predictions.push({
          date: new Date(new Date().setMonth(new Date().getMonth() + i)).toISOString().split('T')[0],
          predictedScore: Math.min(100, Math.max(0, Math.round(predictedY))),
          confidence: 0.8 - i * 0.1, // 置信度随预测时间递减
          lowerBound: Math.min(100, Math.max(0, Math.round(predictedY * 0.9))),
          upperBound: Math.min(100, Math.max(0, Math.round(predictedY * 1.1))),
        });
      }

      return predictions;
    };

    // 2. 学生表现聚类分析
    const clusterStudents = () => {
      const students = analytics.map(a => ({
        id: a.studentId,
        name: a.studentName,
        average: a.averageScore,
        trend: a.progressTrend.length > 1
          ? (a.progressTrend[a.progressTrend.length - 1].score - a.progressTrend[0].score)
          : 0,
        completion: (a.completedAssignments / a.totalAssignments) || 0
      }));

      // 简单K-means聚类 (实际应用中可以使用更复杂的算法)
      const k = 3; // 分为3组
      const centroids = [
        { average: 90, trend: 5, completion: 0.95 }, // 优秀组初始中心
        { average: 75, trend: 0, completion: 0.8 },  // 中等组初始中心
        { average: 60, trend: -5, completion: 0.6 }  // 需提升组初始中心
      ];

      let clusters: Array<{ students: typeof students; centroid: typeof centroids[0] }> =
        Array(k).fill(null).map((_, i) => ({ students: [], centroid: centroids[i] }));

      // 分配学生到最近的簇
      students.forEach(student => {
        let minDistance = Infinity;
        let bestCluster = 0;

        for (let i = 0; i < k; i++) {
          const dist = Math.sqrt(
            Math.pow(student.average - clusters[i].centroid.average, 2) +
            Math.pow(student.trend - clusters[i].centroid.trend, 2) +
            Math.pow(student.completion - clusters[i].centroid.completion, 2)
          );

          if (dist < minDistance) {
            minDistance = dist;
            bestCluster = i;
          }
        }

        clusters[bestCluster].students.push(student);
      });

      // 更新簇中心
      clusters = clusters.map(cluster => {
        if (cluster.students.length === 0) return cluster;

        const newCentroid = {
          average: cluster.students.reduce((sum, s) => sum + s.average, 0) / cluster.students.length,
          trend: cluster.students.reduce((sum, s) => sum + s.trend, 0) / cluster.students.length,
          completion: cluster.students.reduce((sum, s) => sum + s.completion, 0) / cluster.students.length
        };

        return { ...cluster, centroid: newCentroid };
      });

      // 格式化聚类结果
      return clusters.map((cluster, i) => {
        let name, description, characteristics, recommendations;

        if (i === 0) {
          name = "优秀表现组";
          description = "成绩优异且稳定的学生";
          characteristics = ["高分保持", "进步趋势明显", "作业完成率高"];
          recommendations = [
            "提供更高阶的学习材料",
            "鼓励参加竞赛或研究项目",
            "培养领导能力，帮助其他同学"
          ];
        } else if (i === 1) {
          name = "中等表现组";
          description = "成绩中等且有提升空间的学生";
          characteristics = ["成绩稳定", "有小幅进步", "基本完成作业"];
          recommendations = [
            "加强基础知识的巩固",
            "提供更多练习机会",
            "定期检查学习进度"
          ];
        } else {
          name = "需提升表现组";
          description = "成绩较低或退步的学生";
          characteristics = ["成绩偏低", "可能有退步趋势", "作业完成率低"];
          recommendations = [
            "制定个性化学习计划",
            "加强基础知识补习",
            "增加师生沟通频率",
            "提供更多学习资源"
          ];
        }

        return {
          clusterId: i,
          name,
          description,
          students: cluster.students.map(s => s.id),
          averageScore: cluster.centroid.average,
          characteristics,
          recommendations
        };
      });
    };

    // 执行分析
    setTrendPredictions(predictTrends());
    setPerformanceClusters(clusterStudents());
  };

  // 在useEffect中添加分析调用
  useEffect(() => {
    if (grades.length > 0 && analytics.length > 0) {
      analyzeStudentPerformance();
    }
  }, [grades, analytics]);

  const renderAnalyticsContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 成绩趋势预测 */}
      <Card>
        <CardHeader>
          <CardTitle>成绩趋势预测</CardTitle>
          <CardDescription>基于历史数据的未来成绩预测</CardDescription>
        </CardHeader>
        <CardContent>
          {trendPredictions.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    ...grades
                      .filter(g => g.finalScore > 0)
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((g, i) => ({
                        date: new Date(g.createdAt).toLocaleDateString('zh-CN'),
                        score: g.finalScore,
                        type: '实际'
                      })),
                    ...trendPredictions.map(p => ({
                      date: new Date(p.date).toLocaleDateString('zh-CN'),
                      score: p.predictedScore,
                      type: '预测',
                      lower: p.lowerBound,
                      upper: p.upperBound
                    }))
                  ]}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="成绩"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lower"
                    name="预测下限"
                    stroke="#82ca9d"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="upper"
                    name="预测上限"
                    stroke="#82ca9d"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              需要至少3次成绩数据才能进行趋势预测
            </div>
          )}
        </CardContent>
      </Card>

      {/* 学生表现聚类 */}
      <Card>
        <CardHeader>
          <CardTitle>学生表现分组</CardTitle>
          <CardDescription>基于学习表现的学生分组分析</CardDescription>
        </CardHeader>
        <CardContent>
          {performanceClusters.length > 0 ? (
            <div className="space-y-6">
              <div className="flex space-x-2">
                {performanceClusters.map(cluster => (
                  <Button
                    key={cluster.clusterId}
                    variant={selectedCluster === cluster.clusterId ? "default" : "outline"}
                    onClick={() => setSelectedCluster(
                      selectedCluster === cluster.clusterId ? null : cluster.clusterId
                    )}
                  >
                    {cluster.name} ({cluster.students.length}人)
                  </Button>
                ))}
              </div>

              {selectedCluster !== null ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">分组描述</h4>
                    <p>{performanceClusters[selectedCluster].description}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">平均成绩</h4>
                    <Progress
                      value={performanceClusters[selectedCluster].averageScore}
                      className="h-2"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      {Math.round(performanceClusters[selectedCluster].averageScore)}%
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">主要特征</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {performanceClusters[selectedCluster].characteristics.map((char, i) => (
                        <li key={i}>{char}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">教学建议</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {performanceClusters[selectedCluster].recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">学生名单</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {performanceClusters[selectedCluster].students.map(studentId => {
                        const student = analytics.find(a => a.studentId === studentId);
                        return (
                          <Badge key={studentId} variant="outline" className="truncate">
                            {student?.studentName || studentId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  请点击上方按钮查看具体分组详情
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              正在分析学生表现数据...
            </div>
          )}
        </CardContent>
      </Card>


      {/* 个性化教学建议生成器 */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-500" />
            个性化教学建议生成
          </CardTitle>
          <CardDescription>基于AI分析的教学策略建议</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Student and Focus Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student-select">选择目标学生</Label>
                <Select
                  value={selectedStudentId}
                  onValueChange={setSelectedStudentId}
                >
                  <SelectTrigger id="student-select">
                    <SelectValue placeholder="选择学生" />
                  </SelectTrigger>
                  <SelectContent>
                    {analytics.map(student => (
                      <SelectItem
                        key={student.studentId}
                        value={student.studentId}
                        className="flex items-center"
                      >
                        <div className="flex items-center">
                          <span className="font-medium">{student.studentName}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            ({student.averageScore}% 平均分)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focus-select">选择关注领域</Label>
                <Select
                  value={focusArea}
                  onValueChange={setFocusArea}
                >
                  <SelectTrigger id="focus-select">
                    <SelectValue placeholder="全部领域" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部领域</SelectItem>
                    <SelectItem value="knowledge">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-2" />
                        知识掌握
                      </div>
                    </SelectItem>
                    <SelectItem value="skills">
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-2" />
                        技能应用
                      </div>
                    </SelectItem>
                    <SelectItem value="habits">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        学习习惯
                      </div>
                    </SelectItem>
                    <SelectItem value="engagement">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        课堂参与
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={() => handleGenerateRecommendations(selectedStudentId)}
                  disabled={!selectedStudentId || isGenerating}
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {isGenerating ? "生成中..." : "生成建议"}
                </Button>
              </div>
            </div>

            {/* Recommendations Display */}
            <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px]">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  <p className="text-gray-600">正在生成个性化建议...</p>
                </div>
              ) : recommendations.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-lg">
                      {analytics.find(s => s.studentId === selectedStudentId)?.studentName} 的教学建议
                    </h4>
                    <Badge variant="outline" className="flex items-center">
                      <span className="mr-1">共</span>
                      {recommendations.length}
                      <span className="ml-1">条建议</span>
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1 mr-3">
                            {rec.priority === 'High' ? (
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                            ) : rec.priority === 'Medium' ? (
                              <Clock className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{rec.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                            {rec.resources && Array.isArray(rec.resources) && rec.resources.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">推荐资源:</p>
                                <div className="flex flex-wrap gap-2">
                                  {rec.resources.map((resource, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-xs px-2 py-1"
                                    >
                                      {resource}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <Lightbulb className="w-10 h-10 text-gray-400 mb-3" />
                  <h4 className="font-medium text-gray-700">未生成建议</h4>
                  <p className="text-gray-500 text-sm mt-1">
                    请选择学生并点击"生成建议"按钮获取个性化教学策略
                  </p>
                </div>
              )}
            </div>

            {/*/!* Action Buttons *!/*/}
            {/*{recommendations.length > 0 && (*/}
            {/*    <div className="flex justify-end space-x-3">*/}
            {/*      <Button variant="outline">*/}
            {/*        <Download className="w-4 h-4 mr-2" />*/}
            {/*        导出建议*/}
            {/*      </Button>*/}
            {/*      <Button>*/}
            {/*        <Share2 className="w-4 h-4 mr-2" />*/}
            {/*        分享给学生*/}
            {/*      </Button>*/}
            {/*    </div>*/}
            {/*)}*/}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const userData = localStorage.getItem("user")
        if (!userData) {
          router.push("/login")
          return
        }

        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)

        // 初始化空数据
        setAlerts([])
        setAnalytics([])

        const token = localStorage.getItem("accessToken")
        if (!token) {
          console.error("No authentication token found.")
          router.push("/login")
          return
        }

        if (parsedUser.role === "student") {
          await fetchStudentData(parsedUser.id)
        } else if (parsedUser.role === "teacher") {
          await fetchClassAndStudentData(token);
        } else {
          // Fallback for other roles or no specific role handling
          setGrades([])
          setFilteredGrades([])
          setAnalytics([])
        }
      } catch (err) {
        console.error("Failed to fetch data:", err)
        setError("加载数据失败，请稍后重试")
      } finally {
        setLoading(false)
      }
    }
    const fetchClassAndStudentData = async (token: string) => {
      try {
        // 1. 获取老师的所有班级ID
        const classResponse = await fetch(`${API_BASE_URL}/admin/classes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!classResponse.ok) {
          throw new Error(`Failed to fetch teacher's classes: ${classResponse.statusText}`);
        }

        const classData = await classResponse.json();
        console.log("Class data:", classData);

        // 解析班级ID列表
        let classIds: string[] = [];
        if (Array.isArray(classData)) {
          classIds = classData.map(cls => cls.id);
        } else if (classData.data && Array.isArray(classData.data)) {
          classIds = classData.data.map((cls: { id: any }) => cls.id);
        } else if (classData.data?.records && Array.isArray(classData.data.records)) {
          classIds = classData.data.records.map((cls: { id: any }) => cls.id);
        } else if (classData.records && Array.isArray(classData.records)) {
          classIds = classData.records.map((cls: { id: any }) => cls.id);
        } else {
          console.error('未预期的班级数据结构:', classData);
          throw new Error('无法解析班级数据: 数据结构不符合预期');
        }

        console.log('提取的classIds:', classIds);

        // 3. 获取每个班级的学生列表和成绩数据
        const allStudentIds = new Set<string>();
        const realNamesMap = new Map<string, string>();
        const allGrades: Grade[] = [];
        const allAnalytics: StudentAnalytics[] = [];

        for (const classId of classIds) {
          try {
            const classDetailResponse = await fetch(`${API_BASE_URL}/classes/${classId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (classDetailResponse.ok) {
              const classDetail = await classDetailResponse.json();
              console.log(`Class ${classId} detail:`, classDetail);

              // 解析学生ID列表
              let studentIds: string[] = [];
              if (Array.isArray(classDetail.data.members)) {
                studentIds = classDetail.data.members.map((s: { id: any }) => s.id);
              }

              // 添加到总学生集合
              studentIds.forEach(id => allStudentIds.add(id));

              // 获取每个学生的详细信息、项目和成绩
              for (const studentId of studentIds) {
                try {
                  // 获取学生真实姓名
                  const studentDetailResponse = await fetch(`${USER_API_BASE_URL}/me/${studentId}`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });

                  let studentName = `Student ${studentId}`;
                  if (studentDetailResponse.ok) {
                    const studentDetail = await studentDetailResponse.json();
                    studentName = studentDetail.realName || studentDetail.name || studentName;
                    realNamesMap.set(studentId, studentName);
                  }

                  // 获取学生的项目数据
                  const projectsResponse = await fetch(`${API_BASE_URL}/projects/student/${studentId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  const projectsData = projectsResponse.ok ? await projectsResponse.json() : [];
                  console.log("projectsData", projectsData[0].title);

                  // 获取学生的团队数据
                  const teamsResponse = await fetch(`${API_BASE_URL}/team-members/user/${studentId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  const teamsData = teamsResponse.ok ? await teamsResponse.json() : [];

                  // 获取团队详情
                  const teamsWithNames = await Promise.all(
                    teamsData.map(async (team: any) => {
                      try {
                        const teamDetailResponse = await fetch(`${API_BASE_URL}/teams/${team.teamId}`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (!teamDetailResponse.ok) return team;
                        const teamDetail = await teamDetailResponse.json();
                        return { ...team, teamName: teamDetail.name };
                      } catch (error) {
                        console.error(`Error fetching team details:`, error);
                        return team;
                      }
                    })
                  );

                  // 获取团队成绩
                  const studentGrades: Grade[] = [];
                  for (const team of teamsWithNames) {
                    try {
                      const teamGradesResponse = await fetch(`${API_BASE_URL}/teams/${team.teamId || team.id}/grades`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });

                      if (teamGradesResponse.ok) {
                        const teamGradesData = await teamGradesResponse.json();

                        const enrichedTeamGrades = teamGradesData.map((grade: Grade) => {
                          const project = projectsData.find((p: Project) =>
                            String(p.id) === String(grade.projectId)
                          );
                          return {
                            ...grade,
                            studentId,
                            studentName,
                            projectName: projectsData[0].title || project?.name || grade.projectName || '未知项目',
                            teamName: team.teamName || team.name || '未知团队',
                            status: "graded",
                            createdAt: grade.createdAt || grade.gradedDate || grade.submissionDate || new Date().toISOString(),
                            isTeamProject: true,
                            sourceType: "PROJECT"
                          };
                        });

                        studentGrades.push(...enrichedTeamGrades);
                      }
                    } catch (error) {
                      console.error(`Error processing team ${team.teamId || team.id}:`, error);
                    }
                  }

                  // 获取实验成绩
                  // 修改后的实验成绩获取逻辑
                  try {
                    // 使用正确的API路径获取学生实验任务
                    const experimentsResponse = await fetch(`${API_BASE_URL}/experiment-tasks/teacher-tasks`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });

                    if (experimentsResponse.ok) {
                      const allExperiments = await experimentsResponse.json();
                      console.log("所有实验任务:", allExperiments.data);

                      // 获取实验成绩
                      const experimentGradesResponse = await fetch(`${API_BASE_URL}/stats/student/${studentId}/progress`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      const gradedExperiments = experimentGradesResponse.ok
                        ? (await experimentGradesResponse.json()) || []
                        : [];
                      console.log("gradedExperiments", gradedExperiments)

                      // 生成唯一key并完善实验成绩数据
                      const enrichedExperimentGrades = allExperiments.data.records.map((experiment: any) => {
                        const gradeInfo = gradedExperiments.data.find(
                          (g: any) => g.sourceId === experiment.id || g.experimentId === experiment.id
                        );

                        // 生成唯一key，结合学生ID和实验ID
                        const uniqueKey = `experiment-${studentId}-${experiment.id}`;

                        return {
                          id: uniqueKey,
                          studentId,
                          studentName,
                          assignmentId: experiment.id,
                          assignmentName: experiment.taskName || experiment.name || '未知实验',
                          finalScore: gradeInfo?.finalScore || 0,
                          submissionDate: experiment.endDate || experiment.deadline || new Date().toISOString(),
                          isExperiment: true,
                          sourceType: "EXPERIMENT",
                          status: gradeInfo?.finalScore ? "graded" : "pending",
                          createdAt: experiment.createdAt || new Date().toISOString(),
                          autoScore: gradeInfo?.autoScore || 0,
                          manualScore: gradeInfo?.manualScore || 0,
                          criteria: [],
                          feedback: gradeInfo?.feedback || "该实验尚未评分",
                          teamId: "",
                          teamName: "",
                          isTeamProject: false,
                          experimentId: experiment.id,
                          experimentName: experiment.taskName || experiment.name,
                          experimentDescription: experiment.description,
                          experimentDeadline: experiment.deadline
                        };
                      });

                      studentGrades.push(...enrichedExperimentGrades);
                    }
                  } catch (error) {
                    console.error("处理实验数据时出错:", error);
                  }

                  // 添加到总成绩列表
                  allGrades.push(...studentGrades);

                  // 生成学生分析数据
                  const { strengths, weaknesses } = generateStrengthsAndWeaknesses(studentGrades);
                  const recommendations = generateRecommendations(studentGrades);

                  const progressTrendData = studentGrades
                    .filter(grade => grade.finalScore > 0)
                    .sort((a, b) =>
                      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    )
                    .map((grade, index, array) => {
                      const cumulativeScore = array
                        .slice(0, index + 1)
                        .reduce((sum, g) => sum + g.finalScore, 0);

                      return {
                        date: new Date(grade.createdAt).toLocaleDateString('zh-CN'),
                        score: Math.round(cumulativeScore / (index + 1)),
                        name: grade.assignmentName || grade.projectName
                      };
                    });

                  allAnalytics.push({
                    studentId,
                    studentName,
                    averageScore: studentGrades.length > 0
                      ? Math.round(studentGrades.reduce((sum, g) => sum + g.finalScore, 0) / studentGrades.length)
                      : 0,
                    totalAssignments: studentGrades.length,
                    completedAssignments: studentGrades.filter(g => g.status === "graded").length,
                    strengths,
                    weaknesses,
                    recommendations,
                    progressTrend: progressTrendData,
                  });
                } catch (error) {
                  console.error(`Error processing student ${studentId}:`, error);
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching class ${classId} details:`, error);
          }
        }

        // 更新状态
        setClassInfo(classIds.map(id => ({ id })));
        setStudentRealNamesMap(realNamesMap);
        setGrades(allGrades);
        setFilteredGrades(allGrades);
        setAnalytics(allAnalytics);

      } catch (error) {
        console.error("Error in fetchClassAndStudentData:", error);
        setError("加载班级和学生数据失败");
      }
    };


    const fetchStudentData = async (userId: string) => {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        console.error("No authentication token found.")
        return
      }

      try {
        // 1. 获取项目数据
        const projectsResponse = await fetch(`${API_BASE_URL}/projects/student/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!projectsResponse.ok) throw new Error(`Failed to fetch projects: ${projectsResponse.statusText}`)
        const projectsData = await projectsResponse.json();
        console.log("projectsData:", projectsData);
        setProjects(projectsData || []);

        // 2. 获取团队数据
        const teamsResponse = await fetch(`${API_BASE_URL}/team-members/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!teamsResponse.ok) throw new Error(`Failed to fetch teams: ${teamsResponse.statusText}`)
        const teamsData = await teamsResponse.json()

        // 3. 获取团队详情
        const teamsWithNames = await Promise.all(
          teamsData.map(async (team: any) => {
            try {
              const teamDetailResponse = await fetch(`${API_BASE_URL}/teams/${team.teamId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (!teamDetailResponse.ok) return team
              const teamDetail = await teamDetailResponse.json()

              return { ...team, teamName: teamDetail.name }
            } catch (error) {
              console.error(`Error fetching team details:`, error)
              return team
            }
          })
        )
        setTeams(teamsWithNames)
        console.log("teamsWithNames:", teamsWithNames);

        // 4. 获取团队成绩
        const allTeamGrades: Grade[] = []
        for (const team of teamsWithNames) {  // 改为使用 teamsWithNames
          try {
            console.log(`Fetching grades for team ${team.teamId || team.id}`);

            const teamGradesResponse = await fetch(`${API_BASE_URL}/teams/${team.teamId || team.id}/grades`, {
              headers: { Authorization: `Bearer ${token}` },
            })

            if (!teamGradesResponse.ok) {
              console.error(`Failed to fetch grades for team ${team.teamId || team.id}: ${teamGradesResponse.statusText}`)
              continue
            }

            const teamGradesData = await teamGradesResponse.json()

            // If no grades are returned for the team, create a placeholder entry
            if (teamGradesData.length === 0) {
              const project = projectsData.find((p: Project) =>
                String(p.id) === String(team.projectId) || " "
              )
              allTeamGrades.push({
                createdAt: " ",
                id: `no-grade-${team.teamId || team.id}`,
                studentId: "", // Or a placeholder if needed
                studentName: "", // Or a placeholder if needed
                assignmentId: "", // Or a placeholder if needed
                assignmentName: "暂无评分",
                projectId: team.projectId,
                projectName: project?.title || project?.name || '未知项目',
                autoScore: 0,
                manualScore: 0,
                finalScore: 0,
                submissionDate: "",
                gradedDate: "",
                feedback: "该团队暂无评分",
                criteria: [],
                status: "pending", // Or a suitable status
                teamId: team.teamId || team.id,
                teamName: team.teamName || team.name || '未知团队',
                isTeamProject: true,
                sourceType: "PROJECT" // Assuming team projects are of type 'project'
              })
              console.log(`No grades found for team ${team.teamName || '未知团队'}, added placeholder.`)
              continue // Move to the next team
            }

            const enrichedTeamGrades = teamGradesData.map((grade: Grade) => {
              // 确保使用正确的团队ID进行比较
              const currentTeamId = team.teamId || team.id || team._id
              const gradeTeamId = String(grade.teamId)

              // 验证当前团队是否匹配
              const isMatchingTeam = String(currentTeamId) === gradeTeamId
              if (!isMatchingTeam) {
                console.warn(`Team ID mismatch: Grade belongs to team ${gradeTeamId} but processing team ${currentTeamId}`)
              }

              // 查找项目
              const project = projectsData.find((p: Project) =>
                String(p.id) === String(grade.projectId) || " "
              )

              return {
                ...grade,
                projectName: project?.title || project?.name || grade.projectName || '未知项目',
                teamName: team.teamName || team.name || '未知团队', // 直接使用循环中的team对象
                status: "graded",
                createdAt: grade.createdAt || grade.gradedDate || grade.submissionDate || new Date().toISOString(),
                isTeamProject: true
              }
            })

            console.log(`Enriched grades for team ${team.teamName || '未知团队'}:`, enrichedTeamGrades)

            allTeamGrades.push(...enrichedTeamGrades)
            console.log("allTeamGrades", allTeamGrades)
          } catch (error) {
            console.error(`Error processing team ${team.teamId || team.id}:`, error)
          }
        }



        setGrades(allTeamGrades)
        setFilteredGrades(allTeamGrades)

        // 5. 获取实验数据（分两步：先获取所有实验，再获取实验成绩）
        try {
          // 5.1 获取学生所有实验任务
          const experimentsResponse = await fetch(`${API_BASE_URL}/experiment-tasks/my-tasks`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!experimentsResponse.ok) {
            throw new Error(`获取实验列表失败: ${experimentsResponse.statusText}`);
          }

          const allExperiments = await experimentsResponse.json();
          console.log("所有实验任务:", allExperiments.data);

          // 5.2 获取已有成绩的实验数据
          let gradedExperiments: any[] = [];
          const experimentGradesResponse = await fetch(`${API_BASE_URL}/stats/student/${userId}/progress`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (experimentGradesResponse.ok) {
            const experimentGradesData = await experimentGradesResponse.json();
            gradedExperiments = Array.isArray(experimentGradesData.data)
              ? experimentGradesData.data
              : [];
            console.log("已有成绩的实验:", gradedExperiments);
          }
          // console.log("allExperiments.data.records",allExperiments.data.records)
          // 5.3 合并数据 - 确保所有实验都显示
          const enrichedExperimentGrades = allExperiments.data.records.map((experiment: any) => {
            // 查找该实验是否有成绩
            const gradeInfo = gradedExperiments.find(
              (g) => g.sourceId === experiment.id || g.experimentId === experiment.id
            );

            return {
              id: `experiment-${experiment.id}`,
              sourceId: experiment.id,
              assignmentName: experiment.taskName || '未知实验', // 使用 sourceName
              experimentName: experiment.taskName || '未知实验', // 使用 sourceName
              finalScore: gradeInfo?.finalScore || 0,
              submissionDate: experiment.endDate || experiment.deadline || new Date().toISOString(),
              isExperiment: true,
              sourceType: "EXPERIMENT",
              status: gradeInfo?.finalScore ? "graded" : "pending",
              createdAt: experiment.createdAt || new Date().toISOString(),
              // 其他字段
              studentId: user?.id || "",
              studentName: user?.name || "",
              autoScore: gradeInfo?.autoScore || 0,
              manualScore: gradeInfo?.manualScore || 0,
              criteria: [],
              feedback: gradeInfo?.feedback || "该实验尚未评分",
              teamId: "",
              teamName: "",
              isTeamProject: false,
              // 实验特有字段
              experimentId: experiment.id,
              experimentDescription: experiment.description,
              experimentDeadline: experiment.deadline,
              sourceName: experiment.sourceName // 保留原始 sourceName
            };
          });

          console.log("合并后的实验成绩数据:", enrichedExperimentGrades);
          allTeamGrades.push(...enrichedExperimentGrades);
        } catch (error) {
          console.error("处理实验数据时出错:", error);
        }

        // Calculate progress trend for the student
        const studentGrades = allTeamGrades.filter(grade => grade.studentId === userId)
        const sortedGrades = studentGrades.sort((a, b) => {
          const dateA = new Date(a.gradedDate || a.submissionDate).getTime();
          const dateB = new Date(b.gradedDate || b.submissionDate).getTime();
          return dateA - dateB;
        })


        const progressTrendData = grades
          .filter(grade => grade.finalScore > 0)
          .sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          .map((grade, index, array) => {
            const cumulativeScore = array
              .slice(0, index + 1)
              .reduce((sum, g) => sum + g.finalScore, 0);

            return {
              date: new Date(grade.createdAt).toLocaleDateString('zh-CN'),
              score: Math.round(cumulativeScore / (index + 1)),
              name: grade.assignmentName || grade.projectName
            };
          });

        const { strengths, weaknesses } = generateStrengthsAndWeaknesses(allTeamGrades);
        const recommendations = generateRecommendations(allTeamGrades);

        setAnalytics([
          {
            studentId: userId,
            studentName: " ",
            averageScore: calculateAverage(),
            totalAssignments: sortedGrades.length,
            completedAssignments: sortedGrades.filter(g => g.status === "graded").length,
            strengths,
            weaknesses,
            recommendations,
            progressTrend: progressTrendData,
          },
        ]);

      }
      catch (error) {
        console.error("Error in fetchStudentData:", error)
        throw error
      }
    }

    fetchData()
  }, [router])

  useEffect(() => {
    let filtered = grades;

    if (searchTerm) {
      filtered = filtered.filter(
        (grade) =>
          grade.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          grade.assignmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (grade.projectName && grade.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (grade.experimentName && grade.experimentName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((grade) =>
        typeFilter === "EXPERIMENT" ? grade.isExperiment :
          typeFilter === "PROJECT" ? grade.isTeamProject : true
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((grade) => grade.status === statusFilter);
    }

    setFilteredGrades(filtered);
  }, [grades, searchTerm, typeFilter, statusFilter]);

  // Helper functions remain the same...
  const getTypeLabel = (type: string) => {
    const labels = {
      experiment: "实验",
      project: "项目",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "待评分",
      graded: "已评分",
    }
    return labels[status as keyof typeof labels] || status
  }
  /**
   * 根据成绩数据生成能力分析
   */
  const generateStrengthsAndWeaknesses = (grades: Grade[]) => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // 计算各项指标
    const gradedGrades = grades.filter(g => g.finalScore > 0);
    if (gradedGrades.length === 0) return { strengths, weaknesses };

    const averageScore = calculateAverage();
    const projectGrades = gradedGrades.filter(g => g.isTeamProject);
    const experimentGrades = gradedGrades.filter(g => g.isExperiment);

    const projectAvg = projectGrades.length > 0
      ? projectGrades.reduce((sum, g) => sum + g.finalScore, 0) / projectGrades.length
      : 0;

    const experimentAvg = experimentGrades.length > 0
      ? experimentGrades.reduce((sum, g) => sum + g.finalScore, 0) / experimentGrades.length
      : 0;

    // 根据平均分判断整体水平
    if (averageScore >= 85) {
      strengths.push("扎实的知识基础", "良好的学习能力", "优秀的问题解决能力");
    } else if (averageScore >= 70) {
      strengths.push("良好的知识掌握", "稳定的学习表现");
      weaknesses.push("部分知识点需要加强", "解题技巧有待提高");
    } else {
      weaknesses.push("基础知识需要巩固", "学习效率有待提升", "需要加强练习");
    }

    // 根据项目成绩分析团队协作能力
    if (projectAvg >= 85) {
      strengths.push("优秀的团队协作能力", "良好的项目管理能力");
    } else if (projectAvg >= 70) {
      strengths.push("基本的团队协作能力");
      weaknesses.push("项目管理能力有待提高");
    } else if (projectGrades.length > 0) {
      weaknesses.push("需要加强团队协作", "项目执行能力需要提升");
    }

    // 根据实验成绩分析实践能力
    if (experimentAvg >= 85) {
      strengths.push("出色的实践能力", "优秀的实验设计能力");
    } else if (experimentAvg >= 70) {
      strengths.push("良好的实验操作能力");
      weaknesses.push("实验数据分析能力需要加强");
    } else if (experimentGrades.length > 0) {
      weaknesses.push("实验操作能力需要提升", "需要加强实验报告撰写能力");
    }

    // 如果没有项目或实验成绩，添加通用建议
    if (projectGrades.length === 0) {
      weaknesses.push("缺乏团队项目经验");
    }
    if (experimentGrades.length === 0) {
      weaknesses.push("缺乏实验实践机会");
    }

    return { strengths, weaknesses };
  };

  /**
   * 生成个性化学习建议
   */
  const generateRecommendations = (grades: Grade[]) => {
    const recommendations: string[] = [];
    const gradedGrades = grades.filter(g => g.finalScore > 0);
    console.log("gradedGrades", gradedGrades);
    if (gradedGrades.length === 0) {
      return ["目前没有足够的数据生成建议，请完成更多作业或实验"];
    }

    const averageScore = calculateAverage();
    const projectGrades = gradedGrades.filter(g => g.isTeamProject);
    const experimentGrades = gradedGrades.filter(g => g.isExperiment);

    const projectAvg = projectGrades.length > 0
      ? projectGrades.reduce((sum, g) => sum + g.finalScore, 0) / projectGrades.length
      : 0;

    const experimentAvg = experimentGrades.length > 0
      ? experimentGrades.reduce((sum, g) => sum + g.finalScore, 0) / experimentGrades.length
      : 0;

    // 根据平均分给出整体建议
    if (averageScore >= 90) {
      recommendations.push(
        "继续保持优秀表现，可以尝试挑战更高难度的学习内容",
        "帮助其他同学一起进步，教学相长",
        "参与学科竞赛或研究项目，拓展知识边界"
      );
    } else if (averageScore >= 80) {
      recommendations.push(
        "巩固优势科目，保持稳定发挥",
        "针对薄弱环节进行专项练习",
        "多与老师交流，获取更高层次的学习建议"
      );
    } else if (averageScore >= 70) {
      recommendations.push(
        "制定详细的学习计划，合理安排时间",
        "加强基础知识的理解和记忆",
        "多做练习题，提高解题速度和准确率"
      );
    } else {
      recommendations.push(
        "从基础知识点开始系统复习",
        "寻求老师或同学的帮助，解决学习中的困惑",
        "增加学习时间，提高学习效率"
      );
    }

    // 根据项目成绩给出建议
    if (projectAvg >= 85) {
      recommendations.push(
        "尝试担任团队领导角色，锻炼领导能力",
        "参与更复杂的项目，挑战自我"
      );
    } else if (projectAvg >= 70) {
      recommendations.push(
        "提高团队沟通效率，明确分工",
        "学习项目管理工具和方法，提高项目执行能力"
      );
    } else if (projectGrades.length > 0) {
      recommendations.push(
        "积极参与团队讨论，提高沟通能力",
        "学习团队协作技巧，提高贡献度",
        "提前规划项目进度，避免最后匆忙完成"
      );
    } else {
      recommendations.push(
        "积极参与团队项目，积累协作经验",
        "观察优秀团队的工作方式，学习团队协作技巧"
      );
    }

    // 根据实验成绩给出建议
    if (experimentAvg >= 85) {
      recommendations.push(
        "尝试设计自己的实验方案，培养创新能力",
        "撰写更详细的实验报告，提高科研写作能力"
      );
    } else if (experimentAvg >= 70) {
      recommendations.push(
        "实验前充分预习，明确实验目的和步骤",
        "实验后认真分析数据，提高实验报告质量"
      );
    } else if (experimentGrades.length > 0) {
      recommendations.push(
        "实验前仔细阅读实验指导书，明确操作步骤",
        "实验过程中注意记录详细数据",
        "实验后及时总结，分析问题和改进方法"
      );
    } else {
      recommendations.push(
        "积极参与实验课程，提高动手能力",
        "预习实验内容，提高实验效率"
      );
    }

    // 添加通用建议
    recommendations.push(
      "定期复习所学知识，避免遗忘",
      "保持积极的学习态度，遇到困难不轻易放弃"
    );

    return recommendations;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      graded: "bg-green-100 text-green-800",
      reviewed: "bg-blue-100 text-blue-800",
      late: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "graded":
        return <Badge variant="default">已评分</Badge>
      case "pending":
        return <Badge variant="secondary">待评分</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <div className="w-4 h-4" />
    }
  }
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "decline":
        return <TrendingDown className="w-5 h-5 text-red-600" />
      case "failing":
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case "below_average":
        return <BarChart3 className="w-5 h-5 text-yellow-600" />
      case "missing_assignment":
        return <Clock className="w-5 h-5 text-orange-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }
  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: "outline",
      medium: "secondary",
      high: "destructive",
      critical: "destructive",
    } as const

    const labels = {
      low: "低级",
      medium: "中级",
      high: "高级",
      critical: "严重",
    }

    return (
      <Badge variant={variants[severity as keyof typeof variants]}>
        {labels[severity as keyof typeof labels]}
      </Badge>
    )
  }
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "acknowledged":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "ignored":
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />
      default:
        return <div className="w-4 h-4" />
    }
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 80) return "text-blue-600"
    if (percentage >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const calculateAverage = () => {
    const gradedGrades = filteredGrades.filter(grade => grade.finalScore > 0)
    if (gradedGrades.length === 0) return 0
    const total = gradedGrades.reduce((sum, grade) => sum + (grade.finalScore / 100) * 100, 0)
    return Math.round(total / gradedGrades.length)
  }

  const exportGrades = () => {
    // Prepare CSV headers
    const headers = [
      "学生姓名",
      "学生ID",
      "作业/项目/实验名称",
      "类型",
      "得分",
      "满分",
      "百分比",
      "状态",
      "提交日期",
      "评分日期",
      "团队名称",
      "自动评分",
      "人工评分",
      "是否团队项目",
      "是否实验",
      "实验名称",
      "实验截止日期"
    ];

    // Prepare CSV rows
    const rows = filteredGrades.map((grade) => {
      // Get student real name from the map or fallback to grade data
      const studentRealName = studentRealNamesMap.get(grade.studentId) || grade.studentName || grade.studentId;

      // Determine assignment/project/experiment name
      const assignmentName = grade.isExperiment
        ? grade.experimentName || grade.assignmentName
        : grade.isTeamProject
          ? grade.projectName || grade.assignmentName
          : grade.assignmentName;

      return [
        studentRealName,
        grade.studentId,
        assignmentName,
        getTypeLabel(grade.sourceType),
        grade.finalScore,
        100, // Assuming max score is 100
        `${Math.round((grade.finalScore / 100) * 100)}%`,
        getStatusLabel(grade.status),
        grade.submissionDate ? new Date(grade.submissionDate).toLocaleString('zh-CN') : "",
        grade.gradedDate ? new Date(grade.gradedDate).toLocaleString('zh-CN') : "",
        grade.teamName || "",
        grade.autoScore || "",
        grade.manualScore || "",
        grade.isTeamProject ? "是" : "否",
        grade.isExperiment ? "是" : "否",
        grade.experimentName || "",
        grade.experimentDeadline || ""
      ];
    });

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

    // Create and trigger download
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `成绩导出_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    )
  }

  if (!user) {
    return null
  }


  // 学生端界面
  if (user.role === "student") {
    // @ts-ignore
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">我的成绩</h1>
              <p className="text-gray-600">查看您的学习成绩和进度分析</p>
            </div>
            <Button onClick={exportGrades}>
              <Download className="w-4 h-4 mr-2" />
              导出成绩
            </Button>
          </div>

          {/* 学生统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Award className="w-8 h-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">平均分</p>
                    <p className="text-2xl font-bold text-gray-900">{calculateAverage()}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FlaskConical className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">实验完成</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredGrades.filter((g) => g.isExperiment && g.status === "graded").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">团队项目</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {filteredGrades.filter((g) => g.sourceType === "PROJECT").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">完成率</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(
                        (filteredGrades.filter((g) => g.status === "graded").length / filteredGrades.length) * 100,
                      ) || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="grades" className="space-y-6">
            <TabsList>
              <TabsTrigger value="grades">成绩列表</TabsTrigger>
              <TabsTrigger value="analytics">学习分析</TabsTrigger>
              <TabsTrigger value="recommendations">学习建议</TabsTrigger>
            </TabsList>

            <TabsContent value="grades">
              {/* 筛选器 */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="搜索实验、项目..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="作业类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部类型</SelectItem>
                        <SelectItem value="EXPERIMENT">实验</SelectItem>
                        <SelectItem value="PROJECT">项目</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="评分状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="pending">待评分</SelectItem>
                        <SelectItem value="graded">已评分</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* 成绩表格 */}
              <Card>
                <CardHeader>
                  <CardTitle>我的成绩</CardTitle>
                  <CardDescription>个人学习成绩详细信息</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>项目/实验</TableHead>
                          <TableHead>类型</TableHead>
                          <TableHead>得分</TableHead>
                          <TableHead>状态</TableHead>
                          {/*<TableHead>提交日期</TableHead>*/}
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGrades.map((grade) => (
                          <TableRow key={`${grade.studentId}-${grade.assignmentId}-${grade.id}`}>
                            <TableCell>
                              <div className="flex items-center">
                                {grade.isExperiment ? (
                                  <>
                                    <FlaskConical className="w-4 h-4 mr-1 text-blue-500" />
                                    <Badge variant="outline" className="ml-1">
                                      实验: {grade.experimentName || grade.assignmentName}
                                    </Badge>
                                  </>
                                ) : grade.isTeamProject ? (
                                  <>
                                    <Users className="w-4 h-4 mr-1 text-green-500" />
                                    <Badge variant="outline" className="ml-1">
                                      项目: {grade.projectName}
                                    </Badge>
                                    <Badge variant="outline" className="ml-2">
                                      团队: {grade.teamName}
                                    </Badge>
                                  </>
                                ) : (
                                  <span>{grade.assignmentName}</span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline">
                                {grade.isExperiment ? "实验" : grade.isTeamProject ? "项目" : "作业"}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className={`font-semibold ${getScoreColor(grade.finalScore, 100)}`}>
                                  {grade.finalScore > 0 ? `${grade.finalScore}/100` : "未评分"}
                                </span>
                                {grade.finalScore > 0 && (
                                  <span className="text-sm text-gray-500">
                                    ({Math.round((grade.finalScore / 100) * 100)}%)
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              {getStatusBadge(grade.status)}
                            </TableCell>

                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>成绩详情</DialogTitle>
                                    <DialogDescription>{grade.assignmentName}</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-6">
                                    {grade.finalScore > 0 && (
                                      <>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>自动评分</Label>
                                            <p className="text-2xl font-bold text-blue-600">{grade.autoScore}</p>
                                          </div>
                                          {grade.manualScore && (
                                            <div>
                                              <Label>人工评分</Label>
                                              <p className="text-2xl font-bold text-green-600">{grade.manualScore}</p>
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          <Label>最终得分</Label>
                                          <p className="text-3xl font-bold text-purple-600">
                                            {grade.finalScore}/100
                                          </p>
                                          <Progress
                                            value={(grade.finalScore / 100) * 100}
                                            className="mt-2"
                                          />
                                        </div>

                                        {/*<div>*/}
                                        {/*  <Label>评分标准</Label>*/}
                                        {/*  <div className="space-y-3 mt-2">*/}
                                        {/*    {grade.criteria.map((criterion) => (*/}
                                        {/*        <div key={criterion.id} className="border rounded-lg p-3">*/}
                                        {/*          <div className="flex justify-between items-center mb-2">*/}
                                        {/*            <h4 className="font-medium">{criterion.name}</h4>*/}
                                        {/*            <span className="text-sm font-semibold">*/}
                                        {/*      {criterion.earnedPoints}/{criterion.maxPoints}*/}
                                        {/*    </span>*/}
                                        {/*          </div>*/}
                                        {/*          <p className="text-sm text-gray-600 mb-2">{criterion.description}</p>*/}
                                        {/*          <Progress*/}
                                        {/*              value={(criterion.earnedPoints / criterion.maxPoints) * 100}*/}
                                        {/*              className="mb-2"*/}
                                        {/*          />*/}
                                        {/*          {criterion.feedback && (*/}
                                        {/*              <p className="text-sm text-blue-600">{criterion.feedback}</p>*/}
                                        {/*          )}*/}
                                        {/*        </div>*/}
                                        {/*    ))}*/}
                                        {/*  </div>*/}
                                        {/*</div>*/}

                                        {grade.feedback && (
                                          <div>
                                            <Label>教师评语</Label>
                                            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                              <p className="text-sm">{grade.feedback}</p>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    )}

                                    {grade.finalScore === 0 && (
                                      <div className="text-center py-8">
                                        <p className="text-gray-500">该作业尚未评分</p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 成绩趋势图 */}
                <Card>
                  <CardHeader>
                    <CardTitle>学习进步趋势</CardTitle>
                    <CardDescription>基于时间线的成绩变化趋势</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {grades.length > 0 ? (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={grades
                              .filter(grade => grade.finalScore > 0)
                              .sort((a, b) =>
                                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                              )
                              .map(grade => ({
                                date: new Date(grade.createdAt).toLocaleDateString('zh-CN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }),
                                score: grade.finalScore,
                                name: grade.assignmentName || grade.projectName
                              }))
                            }
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 12 }}
                              tickMargin={10}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fontSize: 12 }}
                              tickMargin={10}
                              tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                // 确保这里正确处理了可能的 undefined 情况
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-4 border rounded-lg shadow-sm">
                                      <p className="font-medium">{payload[0].payload.name}</p>
                                      <p className="text-sm">
                                        <span className="text-gray-600">日期: </span>
                                        {payload[0].payload.date}
                                      </p>
                                      <p className="text-sm">
                                        <span className="text-gray-600">成绩: </span>
                                        <span className="font-semibold">
                                          {payload[0].payload.score}%
                                        </span>
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
                              activeDot={{ r: 6, fill: '#10b981' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        暂无成绩数据可供分析
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 类型分析 */}
                <Card>
                  <CardHeader>
                    <CardTitle>作业类型分析</CardTitle>
                    <CardDescription>不同类型作业的表现</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {["EXPERIMENT", "PROJECT", "exam", "homework"].map((type) => {
                        const typeGrades = filteredGrades.filter((g) => g.sourceType === type && g.finalScore > 0)
                        const average =
                          typeGrades.length > 0
                            ? Math.round(
                              typeGrades.reduce((sum, g) => sum + (g.finalScore / 100) * 100, 0) /
                              typeGrades.length,
                            )
                            : 0

                        return (
                          <div key={type} className="flex items-center justify-between">
                            <span className="font-medium">{getTypeLabel(type)}</span>
                            <div className="flex items-center space-x-2">
                              <Progress value={average} className="w-24" />
                              <span className="text-sm font-semibold w-12">{average}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* 能力分析 */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>能力分析</CardTitle>
                    <CardDescription>基于您的成绩表现的各项能力评估</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 flex items-center">
                          <Star className="w-4 h-4 mr-2 text-yellow-500" />
                          优势能力
                        </h4>
                        {analytics.length > 0 && analytics[0].strengths.length > 0 ? (
                          <div className="space-y-2">
                            {analytics[0].strengths.map((strength, index) => (
                              <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{strength}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm p-3 bg-gray-50 rounded-lg">
                            暂无优势能力分析数据
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium mb-3 flex items-center">
                          <Target className="w-4 h-4 mr-2 text-orange-500" />
                          待提升能力
                        </h4>
                        {analytics.length > 0 && analytics[0].weaknesses.length > 0 ? (
                          <div className="space-y-2">
                            {analytics[0].weaknesses.map((weakness, index) => (
                              <div key={index} className="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{weakness}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm p-3 bg-gray-50 rounded-lg">
                            暂无待提升能力分析数据
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-purple-500" />
                    个性化学习建议 (AI生成)
                  </CardTitle>
                  <CardDescription>
                    基于您的学习表现，由AI生成的专属提升建议。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <Button onClick={() => handleGenerateRecommendations(user.id)} disabled={isGenerating}>
                      <Lightbulb className="w-4 h-4 mr-2" />
                      {isGenerating ? "正在为您生成建议..." : "获取我的AI学习建议"}
                    </Button>
                  </div>

                  {isGenerating && (
                    <div className="flex flex-col items-center justify-center h-40 space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                      <p className="text-gray-600">AI正在分析您的学习数据...</p>
                    </div>
                  )}

                  {error && <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}

                  {recommendations.length > 0 && !isGenerating && (
                    <div className="space-y-3">
                      {recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-1 mr-3">
                              {rec.priority === 'High' ? (
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                              ) : rec.priority === 'Medium' ? (
                                <Clock className="w-5 h-5 text-yellow-500" />
                              ) : (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                            <div>
                              {/* Using the new structured fields */}
                              <p className="font-medium">{rec.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  // 教师和管理员界面
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">成绩评估系统</h1>
            <p className="text-gray-600">
              {user.role === "teacher" ? "管理学生成绩和评分" : "查看整体成绩统计和分析"}
            </p>
          </div>
          <div className="flex space-x-3">
            {/*<Button>*/}
            {/*  <Plus className="w-4 h-4 mr-2" />*/}
            {/*  添加成绩*/}
            {/*</Button>*/}
            <Button onClick={exportGrades} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
          </div>
        </div>



        <Tabs defaultValue="grades" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="grades">成绩管理</TabsTrigger>
            <TabsTrigger value="analytics">智能分析</TabsTrigger>
            <TabsTrigger value="alerts">成绩预警</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 关键指标卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 总学生数卡片 */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">总学生数</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {studentRealNamesMap.size}
                        </p>
                        <p className="text-sm text-green-600">
                          {classInfo.length}个班级
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                {/* 平均分卡片 */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">平均分</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {calculateAverage()}%
                        </p>
                        <div className="flex items-center text-sm">
                          {grades.length > 0 && (
                            <>
                              <span className="text-gray-600 mr-2">最高分:</span>
                              <span className="text-green-600 font-medium">
                                {Math.max(...grades.map(g => g.finalScore))}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <BarChart3 className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                {/* 及格率卡片 */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">及格率</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {grades.length > 0
                            ? `${Math.round(
                              grades.filter(g => g.finalScore >= 60).length /
                              grades.filter(g => g.finalScore > 0).length * 100
                            )}%`
                            : '0%'}
                        </p>
                        <div className="flex items-center text-sm">
                          {grades.length > 0 && (
                            <>
                              <span className="text-gray-600 mr-2">优秀率:</span>
                              <span className="text-blue-600 font-medium">
                                {Math.round(
                                  grades.filter(g => g.finalScore >= 85).length /
                                  grades.filter(g => g.finalScore > 0).length * 100
                                )}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Target className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                {/* 预警数量卡片 */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">预警数量</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {alerts.filter(a => a.status === "active").length}
                        </p>
                        <div className="flex items-center text-sm">
                          <span className="text-gray-600 mr-2">已处理:</span>
                          <span className="text-green-600 font-medium">
                            {alerts.filter(a => a.status === "resolved").length}
                          </span>
                        </div>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 成绩分布图表 */}
              <Card>
                <CardHeader>
                  <CardTitle>成绩分布</CardTitle>
                  <CardDescription>各分数段学生分布情况</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {grades.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { name: "90-100", value: grades.filter(g => g.finalScore >= 90).length },
                            { name: "80-89", value: grades.filter(g => g.finalScore >= 80 && g.finalScore < 90).length },
                            { name: "70-79", value: grades.filter(g => g.finalScore >= 70 && g.finalScore < 80).length },
                            { name: "60-69", value: grades.filter(g => g.finalScore >= 60 && g.finalScore < 70).length },
                            { name: "0-59", value: grades.filter(g => g.finalScore < 60 && g.finalScore > 0).length },
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        暂无成绩数据
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 最近活动 */}
              <Card>
                <CardHeader>
                  <CardTitle>最近活动</CardTitle>
                  <CardDescription>最近的学生成绩更新</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {grades
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 5)
                      .map((grade) => (
                        <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${getScoreColor(grade.finalScore, 100).replace('text', 'bg')} bg-opacity-20`}>
                              {grade.isExperiment ? (
                                <FlaskConical className="w-4 h-4" />
                              ) : (
                                <BookOpen className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {grade.studentName} - {grade.assignmentName || grade.projectName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(grade.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {grade.finalScore > 0 ? `${grade.finalScore}%` : '待评分'}
                          </Badge>
                        </div>
                      ))}
                    {grades.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        暂无最近活动
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/*/!* 班级表现 *!/*/}
              {/*{classInfo.length > 0 && (*/}
              {/*    <Card>*/}
              {/*      <CardHeader>*/}
              {/*        <CardTitle>班级表现</CardTitle>*/}
              {/*        <CardDescription>各班级的平均成绩比较</CardDescription>*/}
              {/*      </CardHeader>*/}
              {/*      <CardContent>*/}
              {/*        <div className="h-[300px]">*/}
              {/*          <ResponsiveContainer width="100%" height="100%">*/}
              {/*            <BarChart*/}
              {/*                data={classInfo.map(cls => {*/}
              {/*                  const classGrades = grades.filter(g =>*/}
              {/*                      analytics.find(a => a.studentId === g.studentId)?.studentId*/}
              {/*                  );*/}
              {/*                  const avg = classGrades.length > 0*/}
              {/*                      ? classGrades.reduce((sum, g) => sum + g.finalScore, 0) / classGrades.length*/}
              {/*                      : 0;*/}

              {/*                  return {*/}
              {/*                    name: cls.name || `班级 ${cls.id}`,*/}
              {/*                    average: Math.round(avg),*/}
              {/*                    students: analytics.filter(a =>*/}
              {/*                        classGrades.some(g => g.studentId === a.studentId)*/}
              {/*                    ).length*/}
              {/*                  };*/}
              {/*                })}*/}
              {/*                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}*/}
              {/*            >*/}
              {/*              <CartesianGrid strokeDasharray="3 3" />*/}
              {/*              <XAxis dataKey="name" />*/}
              {/*              <YAxis />*/}
              {/*              /!*<Tooltip />*!/*/}
              {/*              <Legend />*/}
              {/*              <Bar dataKey="average" name="平均分" fill="#8884d8" />*/}
              {/*              <Bar dataKey="students" name="学生数" fill="#82ca9d" />*/}
              {/*            </BarChart>*/}
              {/*          </ResponsiveContainer>*/}
              {/*        </div>*/}
              {/*      </CardContent>*/}
              {/*    </Card>*/}
              {/*)}*/}
            </div>
          </TabsContent>

          <TabsContent value="grades">
            {/* 筛选器 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  筛选条件
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">搜索</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="搜索学生、实验、项目..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>



                  <div>
                    <label className="text-sm font-medium mb-2 block">类型</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="作业类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部类型</SelectItem>
                        <SelectItem value="EXPERIMENT">实验</SelectItem>
                        <SelectItem value="PROJECT">项目</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">状态</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="graded">已评分</SelectItem>
                        <SelectItem value="pending">待评分</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* 成绩表格 */}
            <Card>
              <CardHeader>
                <CardTitle>成绩列表 ({filteredGrades.length} 条记录)</CardTitle>
                <CardDescription>学生成绩详细信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>学生</TableHead>
                        <TableHead>作业/项目/实验</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>得分</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGrades.map((grade) => {
                        // 从映射中获取学生真实姓名
                        const studentRealName = studentRealNamesMap.get(grade.studentId) || grade.studentName || grade.studentId;

                        // 确定显示的名称
                        let displayName = grade.assignmentName;
                        if (grade.isTeamProject && grade.projectName) {
                          displayName = grade.projectName;
                        } else if (grade.isExperiment && grade.experimentName) {
                          displayName = grade.experimentName;
                        }

                        return (
                          <TableRow key={`${grade.studentId}-${grade.assignmentId}-${grade.id}`}>
                            <TableCell className="font-medium">
                              {studentRealName}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {grade.isExperiment ? (
                                  <>
                                    <FlaskConical className="w-4 h-4 mr-1 text-blue-500" />
                                    <span>{displayName}</span>
                                  </>
                                ) : grade.isTeamProject ? (
                                  <>
                                    <Users className="w-4 h-4 mr-1 text-green-500" />
                                    <span>{displayName}</span>
                                    {grade.teamName && (
                                      <Badge variant="outline" className="ml-2">
                                        团队: {grade.teamName}
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <span>{displayName}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {grade.isExperiment ? "实验" : grade.isTeamProject ? "项目" : "作业"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className={`font-semibold ${getScoreColor(grade.finalScore, 100)}`}>
                                  {grade.finalScore > 0 ? `${grade.finalScore}/100` : "未评分"}
                                </span>
                                {grade.finalScore > 0 && (
                                  <span className="text-sm text-gray-500">
                                    ({Math.round((grade.finalScore / 100) * 100)}%)
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(grade.status)}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>成绩详情</DialogTitle>
                                    <DialogDescription>{displayName}</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-6">
                                    {grade.finalScore > 0 ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label>自动评分</Label>
                                            <p className="text-2xl font-bold text-blue-600">{grade.autoScore}</p>
                                          </div>
                                          {grade.manualScore && (
                                            <div>
                                              <Label>人工评分</Label>
                                              <p className="text-2xl font-bold text-green-600">{grade.manualScore}</p>
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          <Label>最终得分</Label>
                                          <p className="text-3xl font-bold text-purple-600">
                                            {grade.finalScore}/100
                                          </p>
                                          <Progress
                                            value={(grade.finalScore / 100) * 100}
                                            className="mt-2"
                                          />
                                        </div>

                                        {grade.feedback && (
                                          <div>
                                            <Label>教师评语</Label>
                                            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                              <p className="text-sm">{grade.feedback}</p>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="text-center py-8">
                                        <p className="text-gray-500">该作业尚未评分</p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            {renderAnalyticsContent()}
          </TabsContent>

          <TabsContent value="grading">
            <Card>
              <CardHeader>
                <CardTitle>评分管理</CardTitle>
                <CardDescription>待评分作业管理</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">自动评分引擎</h3>
                    <Button variant="secondary">运行评分</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">待评分作业</p>
                            <p className="text-2xl font-bold">24</p>
                          </div>
                          <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">已自动评分</p>
                            <p className="text-2xl font-bold">18</p>
                          </div>
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">需要人工复核</p>
                            <p className="text-2xl font-bold">6</p>
                          </div>
                          <AlertTriangle className="w-8 h-8 text-yellow-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">评分队列</h4>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>作业名称</TableHead>

                            <TableHead>提交时间</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>React项目开发</TableCell>
                            <TableCell>Web开发实践</TableCell>
                            <TableCell>2024-01-15</TableCell>
                            <TableCell><Badge variant="secondary">排队中</Badge></TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">优先处理</Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>化学反应实验报告</TableCell>
                            <TableCell>虚拟仿真实验</TableCell>
                            <TableCell>2024-01-16</TableCell>
                            <TableCell><Badge variant="default">处理中</Badge></TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">查看详情</Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <div className="space-y-6">
              {/* 预警统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">活跃预警</p>
                        <p className="text-2xl font-bold text-red-600">
                          {alerts.filter((a) => a.status === "active").length}
                        </p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">已确认</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {alerts.filter((a) => a.status === "acknowledged").length}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">已解决</p>
                        <p className="text-2xl font-bold text-green-600">
                          {alerts.filter((a) => a.status === "resolved").length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">处理率</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {alerts.length > 0
                            ? `${Math.round(
                              (alerts.filter(a => a.status !== "active").length / alerts.length) * 100
                            )}%`
                            : '0%'}
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 预警列表 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    成绩预警列表
                  </CardTitle>
                  <CardDescription>需要关注的学生成绩异常情况</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alerts.length > 0 ? (
                      alerts.map((alert) => (
                        <div key={alert.id} className={`border rounded-lg p-4 space-y-3 ${alert.status === "active" ? "bg-red-50 border-red-200" :
                          alert.status === "acknowledged" ? "bg-yellow-50 border-yellow-200" :
                            alert.status === "resolved" ? "bg-green-50 border-green-200" : "bg-gray-50"
                          }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getAlertIcon(alert.type)}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium">{alert.studentName}</h4>
                                  {getSeverityBadge(alert.severity)}
                                  <div className="flex items-center space-x-1">
                                    {getStatusIcon(alert.status)}
                                    <span className="text-sm text-gray-500 capitalize">{alert.status}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(alert.createdAt).toLocaleString('zh-CN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {alert.status === "active" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAcknowledgeAlert(alert.id)}
                                  >
                                    确认
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleResolveAlert(alert.id)}
                                  >
                                    解决
                                  </Button>
                                </>
                              )}
                              {alert.status === "acknowledged" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleResolveAlert(alert.id)}
                                >
                                  标记为已解决
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleIgnoreAlert(alert.id)}
                              >
                                忽略
                              </Button>
                            </div>
                          </div>

                          {/* 建议措施 */}
                          {alert.suggestions.length > 0 && (
                            <div className="bg-white p-3 rounded-md border">
                              <h5 className="text-sm font-medium mb-2">建议措施：</h5>
                              <ul className="text-sm space-y-1">
                                {alert.suggestions.map((suggestion, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <span className="text-blue-600">•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 添加备注区域 */}
                          <div className="pt-2">
                            <Textarea
                              placeholder="添加处理备注..."
                              className="text-sm"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        当前没有需要处理的预警
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}