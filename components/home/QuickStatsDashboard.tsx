"use client"

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Server,
  Database,
  AlertTriangle,
  FlaskConical,
  FolderOpen,
  BookOpen,
  BarChart3,
  Loader2
} from "lucide-react";
import type { JSX } from "react";

// 定义统计卡片的数据结构
interface QuickStat {
  title: string;
  value: string | number;
  description: string;
  icon: JSX.Element;
}

// 定义组件接收的 props
interface QuickStatsDashboardProps {
  role: 'admin' | 'teacher' | 'student' | string; // 接收用户角色
  token: string | null; // 接收认证 token
}

// 假设的 API 基础 URL，可以从环境变量获取
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

export function QuickStatsDashboard({ role, token }: QuickStatsDashboardProps) {
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 定义每个角色的图标映射
  const iconMap: { [key: string]: JSX.Element } = {
    onlineUsers: <Users className="w-8 h-8 text-blue-600" />,
    systemLoad: <Server className="w-8 h-8 text-green-600" />,
    dbQueries: <Database className="w-8 h-8 text-purple-600" />,
    systemWarnings: <AlertTriangle className="w-8 h-8 text-red-600" />,
    activeExperiments: <FlaskConical className="w-8 h-8 text-blue-600" />,
    trainingProjects: <FolderOpen className="w-8 h-8 text-purple-600" />,
    teachingResources: <BookOpen className="w-8 h-8 text-green-600" />,
    completionRate: <BarChart3 className="w-8 h-8 text-indigo-600" />,
  };

  // 定义每个角色的默认/加载状态下的统计卡片
  const getPlaceholderStats = (role: string): QuickStat[] => {
    const placeholders: { [key: string]: QuickStat[] } = {
      admin: [
        { title: "在线用户", value: "...", description: "当前在线", icon: iconMap.onlineUsers },
        { title: "系统负载", value: "...", description: "CPU使用率", icon: iconMap.systemLoad },
        { title: "数据库查询", value: "...", description: "今日查询次数", icon: iconMap.dbQueries },
        { title: "系统警告", value: "...", description: "需要处理", icon: iconMap.systemWarnings },
      ],
      teacher: [
        { title: "进行中的实验", value: "...", description: "学生实验", icon: iconMap.activeExperiments },
        { title: "实训项目", value: "...", description: "管理项目", icon: iconMap.trainingProjects },
        { title: "教学资源", value: "...", description: "已上传", icon: iconMap.teachingResources },
        { title: "完成率", value: "...", description: "班级平均", icon: iconMap.completionRate },
      ],
      student: [
        { title: "进行中的实验", value: "...", description: "我的实验", icon: iconMap.activeExperiments },
        { title: "实训项目", value: "...", description: "参与项目", icon: iconMap.trainingProjects },
        { title: "教学资源", value: "...", description: "可用资源", icon: iconMap.teachingResources },
        { title: "完成率", value: "...", description: "我的进度", icon: iconMap.completionRate },
      ]
    };
    return placeholders[role] || placeholders.student;
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!role || !token) {
        setLoading(false);
        setError("无法加载统计数据：缺少角色或认证信息。");
        return;
      }

      setLoading(true);
      setError(null);
      // 设置占位数据以避免布局变化
      setStats(getPlaceholderStats(role));

      try {
        // 根据角色选择不同的 API 端点
        const endpoint = `${API_BASE_URL}/dashboard/stats/${role}`;

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`网络请求失败，状态码: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          // 将后端返回的数据转换为前端需要的格式
          const formattedStats = result.data.map((stat: any) => ({
            ...stat,
            icon: iconMap[stat.iconKey] || <BarChart3 className="w-8 h-8 text-gray-600" />
          }));
          setStats(formattedStats);
        } else {
          throw new Error(result.message || "获取统计数据失败。");
        }

      } catch (e: any) {
        setError(e.message);
        // 出现错误时，仍然显示占位符，但可以在UI上显示错误信息
        console.error("获取仪表盘统计数据失败:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [role, token]); // 当角色或 token 变化时重新获取数据

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center">
              {stat.icon}
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900">{loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stat.value}</p>
                  {error && <AlertTriangle className="w-4 h-4 text-red-500 ml-2" title={error} />}
                </div>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
