"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DatePickerWithRange } from "@/components/ui/date-picker"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts"
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Users,
  Database,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Sparkles,
  FastForward,
  PlayCircle
} from "lucide-react"
import type { DateRange } from "react-day-picker"
import ReactMarkdown from 'react-markdown';

// --- 接口定义 ---
interface LogEntry {
  id: number
  createdAt: string
  userId: number
  username: string
  operationType: string
  description: string
  serviceName: string
  requestIp: string
  requestParams: string
  status: number // 0: 成功, 1: 失败
  duration: number
  responseResult?: string // 新增：响应结果字段
}

interface SystemMetric {
  name: string
  value: string
  icon: React.ReactNode
}

// --- 常量定义：与后端 OperationTypeEnum 保持一致 ---
const OPERATION_TYPE_MAP = {
  // 班级管理模块
  CREATE_CLASS: { description: "创建班级", module: "班级管理" },
  UPDATE_CLASS: { description: "更新班级信息", module: "班级管理" },
  DELETE_CLASS: { description: "删除班级", module: "班级管理" },
  ADD_STUDENTS_TO_CLASS: { description: "添加班级成员", module: "班级管理" },
  REMOVE_STUDENT_FROM_CLASS: { description: "移除班级成员", module: "班级管理" },
  JOIN_CLASS_BY_CODE: { description: "使用邀请码加入班级", module: "班级管理" },

  // 实验项目库模块
  CREATE_EXPERIMENT: { description: "创建实验项目", module: "实验管理" },
  UPDATE_EXPERIMENT: { description: "更新实验项目", module: "实验管理" },
  DELETE_EXPERIMENT: { description: "删除实验项目", module: "实验管理" },

  // 实验任务模块
  ASSIGN_EXPERIMENT_TASK: { description: "指派实验任务", module: "实验管理" },
  START_EXPERIMENT_SESSION: { description: "开始实验", module: "实验管理" },
  RECORD_EXPERIMENT_LOG: { description: "记录实验操作", module: "实验管理" },

  // 实验报告与评分模块
  SUBMIT_REPORT: { description: "提交实验报告", module: "实验管理" },
  GRADE_REPORT: { description: "批阅实验报告", module: "实验管理" },

  // 默认/未知类型
  UNKNOWN: { description: "未知操作", module: "其他" }
};

// 将操作类型按模块分组
const operationTypesByModule = Object.entries(OPERATION_TYPE_MAP).reduce((acc, [key, value]) => {
  if (!acc[value.module]) {
    acc[value.module] = [];
  }
  acc[value.module].push({ key, description: value.description });
  return acc;
}, {} as Record<string, { key: string, description: string }[]>);


// --- 主组件 ---
export default function AuditLogsPage() {
  // --- 状态管理 ---
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  // 过滤与分页状态
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [operationTypeFilter, setOperationTypeFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const pageSize = 10
  const router = useRouter();
  const [aiQuery, setAiQuery] = useState<string>("分析一下最近的5条错误日志，找出根本原因。"); // 默认的示例问题
  const [aiResult, setAiResult] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAnalysis = useCallback(async (isStream: boolean) => {
    // 检查是否有查询问题或时间范围
    if (!aiQuery.trim()) {
      setAiError("请输入您想分析的问题。");
      return;
    }
    if (!dateRange.from || !dateRange.to) {
      setAiError("请先在筛选器中选择一个时间范围。");
      return;
    }

    setIsAnalyzing(true);
    setAiError(null);
    setAiResult(""); // 开始分析前清空上次结果

    const token = localStorage.getItem("accessToken");
    if (!token) {
      setAiError("认证已过期，请重新登录。");
      setIsAnalyzing(false);
      return;
    }

    // 准备请求体
    const requestBody = {
      query: aiQuery,
      startTime: dateRange.from.toISOString(),
      endTime: dateRange.to.toISOString(),
      logType: statusFilter === '1' ? 'ERROR' : 'ALL', // 如果筛选了失败，就只分析错误日志
      limit: 50, // 限制日志数量，避免请求体过大
    };

    try {
      if (isStream) {
        // --- 处理流式请求 ---
        const response = await fetch('http://localhost:8080/api/v1/admin/analysis/query-stream', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`服务连接失败，状态码: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("无法获取响应流。");
        }

        const decoder = new TextDecoder("utf-8");
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // 注意：在SSE中，数据通常是 "data: xxx\n\n" 的格式
          // 我们的后端直接返回了文本块，所以直接解码即可
          const chunk = decoder.decode(value);
          setAiResult((prev) => prev + chunk);
        }

      } else {
        // --- 处理标准请求 ---
        const response = await fetch('http://localhost:8080/api/v1/admin/analysis/query', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`网络请求错误，状态码: ${response.status}`);
        }

        const result = await response.json();
        if (result.code === 200 && result.data) {
          setAiResult(result.data.analysisResult);
        } else {
          throw new Error(result.message || "AI分析失败。");
        }
      }
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [aiQuery, dateRange, statusFilter]); // 依赖项
  // --- 数据获取 ---
  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;

    if (!token) {
      setError("用户未登录或认证已过期，请重新登录。");
      setIsLoading(false);
      // 可选：延迟跳转到登录页
      // setTimeout(() => router.push("/login"), 2000);
      return;
    }

    try {
      const params = new URLSearchParams()
      params.append("pageNum", String(currentPage))
      params.append("pageSize", String(pageSize))
      if (searchTerm) params.append("username", searchTerm)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (operationTypeFilter !== "all") params.append("operationType", operationTypeFilter)
      if (dateRange?.from) params.append("startTime", dateRange.from.toISOString())
      if (dateRange?.to) params.append("endTime", dateRange.to.toISOString())

      if (activeTab !== "all" && activeTab !== "analytics") {
        const typesForModule = Object.entries(OPERATION_TYPE_MAP)
          .filter(([, value]) => value.module === activeTab)
          .map(([key]) => key);

        if (typesForModule.length > 0) {
          typesForModule.forEach(type => params.append("operationType", type));
        }
      }


      const headers = new Headers({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const response = await fetch(`http://localhost:8080/api/v1/admin/logs?${params.toString()}`, { headers })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(`认证失败 (${response.status})，请检查权限或重新登录。`);
        }
        throw new Error(`网络请求错误，状态码: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 200 && result.data) {
        const records = result.data.records || [];
        let total = result.data.total;
        let pages = result.data.pages;

        // FIX: 兼容后端返回数据不一致的情况
        // 如果后端返回了记录，但 total 或 pages 为 0，说明分页数据有误
        if ((total === 0 || pages === 0) && records.length > 0) {
          console.warn("后端API返回了记录但分页总数(total/pages)为0。分页功能可能不正确。前端将使用当前页记录数作为总数以保证UI一致性。");
          total = records.length; // 这不是真实的总数，但能保证UI指标一致
          pages = 1; // 只能假设当前是第一页也是最后一页
        }

        setLogs(records);
        setTotalPages(pages || 0);
        setTotalRecords(total || 0);
      } else {
        throw new Error(result.message || "获取日志数据失败。");
      }
    } catch (e: any) {
      setError(e.message);
      setLogs([]);
      setTotalRecords(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, operationTypeFilter, dateRange, activeTab, router]);

  // --- Effects ---
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 当筛选条件或标签页变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, operationTypeFilter, dateRange, activeTab]);

  // --- 派生状态与计算属性 ---
  const systemMetrics: SystemMetric[] = useMemo(() => {
    const failedLogsCount = logs.filter(log => log.status === 1).length;

    const averageDuration = logs.length > 0
      ? Math.round(logs.reduce((acc, log) => acc + log.duration, 0) / logs.length)
      : 0;

    return [
      { name: "日志总数 (当前筛选)", value: totalRecords.toLocaleString(), icon: <Database className="w-6 h-6 text-blue-600" /> },
      { name: "总页数", value: totalPages.toLocaleString(), icon: <BookOpen className="w-6 h-6 text-indigo-600" /> },
      {
        name: "失败日志 (当前页)",
        value: failedLogsCount.toString(),
        icon: <AlertTriangle className="w-6 h-6 text-red-600" />
      },
      { name: "平均响应耗时 (当前页)", value: `${averageDuration} ms`, icon: <Activity className="w-6 h-6 text-purple-600" /> },
    ];
  }, [logs, totalRecords, totalPages]);

  const operationTypeDistribution = useMemo(() => {
    const counts = logs.reduce((acc, log) => {
      const name = OPERATION_TYPE_MAP[log.operationType as keyof typeof OPERATION_TYPE_MAP]?.description || log.operationType;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, count: value }));
  }, [logs]);

  // --- 辅助函数与事件处理 ---
  const getStatusBadge = (status: number) => {
    if (status === 0) return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">成功</Badge>;
    return <Badge variant="destructive">失败</Badge>;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ["ID", "时间", "用户名", "操作类型Key", "操作描述", "服务名", "IP地址", "状态", "耗时(ms)"].join(","),
      ...logs.map(log => [
        log.id,
        `"${new Date(log.createdAt).toLocaleString('zh-CN')}"`,
        log.username,
        log.operationType,
        `"${OPERATION_TYPE_MAP[log.operationType as keyof typeof OPERATION_TYPE_MAP]?.description || log.operationType}"`,
        log.serviceName,
        log.requestIp,
        log.status === 0 ? "成功" : "失败",
        log.duration
      ].join(","))
    ].join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${activeTab}_page_${currentPage}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderLogTable = () => (
    <Card>
      <CardHeader>
        <CardTitle>操作日志详情</CardTitle>
        <CardDescription>在当前条件下, 共找到 {totalRecords} 条记录</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>操作类型</TableHead>
                <TableHead className="hidden md:table-cell">描述</TableHead>
                <TableHead className="hidden lg:table-cell">IP地址</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>耗时(ms)</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-500" /></TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-red-600"><AlertTriangle className="w-8 h-8 mx-auto" /><p className="mt-2">{error}</p></TableCell></TableRow>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString('zh-CN', { hour12: false })}</TableCell>
                    <TableCell>{log.username}</TableCell>
                    <TableCell><Badge variant="outline">{OPERATION_TYPE_MAP[log.operationType as keyof typeof OPERATION_TYPE_MAP]?.description || log.operationType}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate hidden md:table-cell" title={log.description}>{log.description}</TableCell>
                    <TableCell className="font-mono text-sm hidden lg:table-cell">{log.requestIp}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>{log.duration}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-gray-500">未找到匹配的日志记录。</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-700">第 {currentPage} 页 / 共 {totalPages} 页</span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}><ChevronLeft className="h-4 w-4 mr-1" /> 上一页</Button>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>下一页 <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // --- 渲染逻辑 ---
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">日志审计仪表盘</h1>
            <p className="text-gray-600 mt-1">监控、分析和审计所有系统操作</p>
          </div>
          <Button onClick={exportLogs} disabled={logs.length === 0 || isLoading} className="mt-4 sm:mt-0">
            <Download className="w-4 h-4 mr-2" />
            导出当前页
          </Button>
        </div>

        {/* 指标卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemMetrics.map((metric) => (
            <Card key={metric.name}>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{metric.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                {metric.icon}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 筛选器 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center"><Filter className="w-5 h-5 mr-2" />筛选条件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜索用户名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="选择状态" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="0">成功</SelectItem>
                  <SelectItem value="1">失败</SelectItem>
                </SelectContent>
              </Select>
              <Select value={operationTypeFilter} onValueChange={setOperationTypeFilter}>
                <SelectTrigger><SelectValue placeholder="按具体操作类型筛选" /></SelectTrigger>
                <SelectContent className="max-h-96">
                  <SelectItem value="all">全部类型</SelectItem>
                  {Object.entries(operationTypesByModule).map(([moduleName, types]) => (
                    <SelectGroup key={moduleName}>
                      <SelectLabel>{moduleName}</SelectLabel>
                      {types.map(type => (
                        <SelectItem key={type.key} value={type.key}>{type.description}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <DatePickerWithRange
                date={{ from: dateRange.from, to: dateRange.to }}
                onDateChange={(range) => setDateRange({ from: range?.from, to: range?.to })}
              />
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="all">全部日志</TabsTrigger>
            <TabsTrigger value="analytics">数据分析</TabsTrigger>
          </TabsList>

          <TabsContent value="all">{renderLogTable()}</TabsContent>
          <TabsContent value="班级管理">{renderLogTable()}</TabsContent>
          <TabsContent value="实验管理">{renderLogTable()}</TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>操作类型分布</CardTitle>
                  <CardDescription>基于当前页筛选结果的统计</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={operationTypeDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="数量" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <AiAnalysisCard
                aiQuery={aiQuery}
                setAiQuery={setAiQuery}
                handleAnalysis={handleAnalysis}
                isAnalyzing={isAnalyzing}
                aiResult={aiResult}
                aiError={aiError}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 日志详情弹窗 */}
      <Dialog open={!!selectedLog} onOpenChange={(isOpen) => !isOpen && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>日志详情</DialogTitle>
            <DialogDescription>ID: {selectedLog?.id}</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>时间</Label><p className="text-sm">{new Date(selectedLog.createdAt).toLocaleString('zh-CN')}</p></div>
                <div><Label>用户名</Label><p className="text-sm">{selectedLog.username}</p></div>
                <div><Label>服务名</Label><p className="text-sm">{selectedLog.serviceName}</p></div>
                <div><Label>IP 地址</Label><p className="text-sm font-mono">{selectedLog.requestIp}</p></div>
                <div><Label>操作类型</Label><span><Badge variant="secondary">{OPERATION_TYPE_MAP[selectedLog.operationType as keyof typeof OPERATION_TYPE_MAP]?.description || selectedLog.operationType}</Badge></span></div>
                <div><Label>状态</Label><div>{getStatusBadge(selectedLog.status)}</div></div>
                <div><Label>响应耗时</Label><p className="text-sm">{selectedLog.duration} ms</p></div>
              </div>
              <div>
                <Label>操作描述</Label>
                <p className="p-2 bg-gray-100 rounded-md text-sm">{selectedLog.description}</p>
              </div>
              <div>
                <Label>请求参数</Label>
                <pre className="p-3 bg-gray-900 text-white rounded-md text-xs overflow-x-auto">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.requestParams || '{}'), null, 2);
                    } catch (e) {
                      return "无法解析的参数格式:\n" + selectedLog.requestParams;
                    }
                  })()}
                </pre>
              </div>
              {/* 新增：显示响应结果 */}
              {selectedLog.responseResult && (
                <div>
                  <Label>响应结果</Label>
                  <pre className="p-3 bg-gray-800 text-white rounded-md text-xs overflow-x-auto">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.responseResult || '{}'), null, 2);
                      } catch (e) {
                        return selectedLog.responseResult;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  )
}


const AiAnalysisCard = ({
  aiQuery,
  setAiQuery,
  handleAnalysis,
  isAnalyzing,
  aiResult,
  aiError,
}: {
  aiQuery: string;
  setAiQuery: (query: string) => void;
  handleAnalysis: (isStream: boolean) => void;
  isAnalyzing: boolean;
  aiResult: string;
  aiError: string | null;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-purple-600" /> {/* 替换为你喜欢的图标 */}
          智能日志分析 (AI)
        </CardTitle>
        <CardDescription>
          使用自然语言提问，AI将根据您选择的时间范围自动分析相关日志。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 输入区域 */}
        <div>
          <Label htmlFor="ai-query" className="font-semibold">分析请求</Label>
          <textarea
            id="ai-query"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="例如：分析最近的错误日志，并给出解决方案。"
            className="w-full mt-2 p-2 border rounded-md min-h-[80px] text-sm bg-gray-50"
            disabled={isAnalyzing}
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => handleAnalysis(false)} disabled={isAnalyzing}>
            {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />} {/* 图标替换 */}
            获取分析报告
          </Button>
        </div>

        {/* 结果显示区域 */}
        {(isAnalyzing || aiResult || aiError) && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">分析结果</h4>
            {isAnalyzing && !aiResult && (
              <div className="flex items-center justify-center h-40 bg-gray-50 rounded-md">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <p className="ml-3 text-gray-500">正在分析中，请稍候...</p>
              </div>
            )}
            {aiError && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
                <AlertTriangle className="w-5 h-5 inline-block mr-2" />
                <strong>错误：</strong>{aiError}
              </div>
            )}
            {aiResult && (
              <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-md min-h-[100px]">
                {/* 使用 react-markdown 来渲染结果 */}
                <ReactMarkdown>{aiResult}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};