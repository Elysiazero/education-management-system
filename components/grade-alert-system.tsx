"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Settings,
  Bell,
  TrendingDown,
  Clock,
  BarChart3,
  CheckCircle,
  Edit,
  Save,
  Plus,
} from "lucide-react"

interface AlertRule {
  id: string
  name: string
  type: "decline" | "failing" | "below_average" | "missing_assignment"
  enabled: boolean
  conditions: {
    threshold: number
    timeframe: string
    comparison: string
  }
  severity: "low" | "medium" | "high" | "critical"
  notifyRoles: string[]
  description: string
}

interface AlertStats {
  total: number
  active: number
  resolved: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
}

interface GradeAlertSystemProps {
  userId: string;
  userRole: "student" | "teacher" | "admin";
}

export function GradeAlertSystem({ userId, userRole }: GradeAlertSystemProps) {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [alertStats, setAlertStats] = useState<AlertStats>({
    total: 0,
    active: 0,
    resolved: 0,
    byType: {},
    bySeverity: {},
  })
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    // 模拟预警规则数据
    const mockRules: AlertRule[] = [
      {
        id: "1",
        name: "成绩下降预警",
        type: "decline",
        enabled: true,
        conditions: {
          threshold: 10,
          timeframe: "2_assignments",
          comparison: "consecutive_decline",
        },
        severity: "medium",
        notifyRoles: ["student", "teacher"],
        description: "连续两次作业成绩下降超过10分时触发预警",
      },
      {
        id: "2",
        name: "挂科风险预警",
        type: "failing",
        enabled: true,
        conditions: {
          threshold: 60,
          timeframe: "current",
          comparison: "below_threshold",
        },
        severity: "critical",
        notifyRoles: ["student", "teacher", "parent", "admin"],
        description: "成绩低于60分时立即触发严重预警",
      },
      {
        id: "3",
        name: "低于平均分预警",
        type: "below_average",
        enabled: true,
        conditions: {
          threshold: 20,
          timeframe: "current",
          comparison: "below_class_average",
        },
        severity: "low",
        notifyRoles: ["student", "teacher"],
        description: "成绩低于班级平均分20%时触发预警",
      },
      {
        id: "4",
        name: "未提交作业预警",
        type: "missing_assignment",
        enabled: true,
        conditions: {
          threshold: 3,
          timeframe: "days",
          comparison: "overdue",
        },
        severity: "medium",
        notifyRoles: ["student", "teacher"],
        description: "作业逾期3天未提交时触发预警",
      },
    ]

    // 模拟统计数据
    const mockStats: AlertStats = {
      total: 25,
      active: 8,
      resolved: 17,
      byType: {
        decline: 6,
        failing: 3,
        below_average: 12,
        missing_assignment: 4,
      },
      bySeverity: {
        low: 8,
        medium: 12,
        high: 3,
        critical: 2,
      },
    }

    setAlertRules(mockRules)
    setAlertStats(mockStats)
  }, [])

  const getTypeLabel = (type: string) => {
    const labels = {
      decline: "成绩下降",
      failing: "挂科风险",
      below_average: "低于平均",
      missing_assignment: "未提交作业",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "decline":
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case "failing":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "below_average":
        return <BarChart3 className="w-4 h-4 text-yellow-600" />
      case "missing_assignment":
        return <Clock className="w-4 h-4 text-orange-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
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
      <Badge variant={variants[severity as keyof typeof variants]}>{labels[severity as keyof typeof labels]}</Badge>
    )
  }

  const toggleRule = (ruleId: string) => {
    setAlertRules((rules) => rules.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule)))
  }

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule({ ...rule })
    setIsCreating(false)
  }

  const handleCreateRule = () => {
    const newRule: AlertRule = {
      id: Date.now().toString(),
      name: "",
      type: "decline",
      enabled: true,
      conditions: {
        threshold: 10,
        timeframe: "current",
        comparison: "below_threshold",
      },
      severity: "medium",
      notifyRoles: ["student", "teacher"],
      description: "",
    }
    setEditingRule(newRule)
    setIsCreating(true)
  }

  const handleSaveRule = () => {
    if (!editingRule) return

    if (isCreating) {
      setAlertRules((rules) => [...rules, editingRule])
    } else {
      setAlertRules((rules) => rules.map((rule) => (rule.id === editingRule.id ? editingRule : rule)))
    }

    setEditingRule(null)
    setIsCreating(false)
  }

  const handleCancelEdit = () => {
    setEditingRule(null)
    setIsCreating(false)
  }

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总预警数</p>
                <p className="text-2xl font-bold">{alertStats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">活跃预警</p>
                <p className="text-2xl font-bold text-red-600">{alertStats.active}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">已解决</p>
                <p className="text-2xl font-bold text-green-600">{alertStats.resolved}</p>
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
                  {Math.round((alertStats.resolved / alertStats.total) * 100)}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">预警规则</TabsTrigger>
          <TabsTrigger value="statistics">统计分析</TabsTrigger>
          <TabsTrigger value="settings">系统设置</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    预警规则管理
                  </CardTitle>
                  <CardDescription>配置和管理成绩预警规则</CardDescription>
                </div>
                <Button onClick={handleCreateRule}>
                  <Plus className="w-4 h-4 mr-2" />
                  新建规则
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(rule.type)}
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getSeverityBadge(rule.severity)}
                        <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                        <Button size="sm" variant="outline" onClick={() => handleEditRule(rule)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{getTypeLabel(rule.type)}</Badge>
                      <Badge variant="outline">阈值: {rule.conditions.threshold}</Badge>
                      <Badge variant="outline">通知: {rule.notifyRoles.join(", ")}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 编辑规则对话框 */}
          {editingRule && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{isCreating ? "创建新规则" : "编辑规则"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ruleName">规则名称</Label>
                    <Input
                      id="ruleName"
                      value={editingRule.name}
                      onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                      placeholder="输入规则名称"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ruleType">预警类型</Label>
                    <Select
                      value={editingRule.type}
                      onValueChange={(value) => setEditingRule({ ...editingRule, type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="decline">成绩下降</SelectItem>
                        <SelectItem value="failing">挂科风险</SelectItem>
                        <SelectItem value="below_average">低于平均</SelectItem>
                        <SelectItem value="missing_assignment">未提交作业</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="severity">严重程度</Label>
                    <Select
                      value={editingRule.severity}
                      onValueChange={(value) => setEditingRule({ ...editingRule, severity: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低级</SelectItem>
                        <SelectItem value="medium">中级</SelectItem>
                        <SelectItem value="high">高级</SelectItem>
                        <SelectItem value="critical">严重</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="threshold">阈值</Label>
                    <Input
                      id="threshold"
                      type="number"
                      value={editingRule.conditions.threshold}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          conditions: {
                            ...editingRule.conditions,
                            threshold: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">规则描述</Label>
                  <Input
                    id="description"
                    value={editingRule.description}
                    onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                    placeholder="输入规则描述"
                  />
                </div>

                <div>
                  <Label>通知对象</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["student", "teacher", "parent", "admin"].map((role) => (
                      <label key={role} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editingRule.notifyRoles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingRule({
                                ...editingRule,
                                notifyRoles: [...editingRule.notifyRoles, role],
                              })
                            } else {
                              setEditingRule({
                                ...editingRule,
                                notifyRoles: editingRule.notifyRoles.filter((r) => r !== role),
                              })
                            }
                          }}
                        />
                        <span className="text-sm">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    取消
                  </Button>
                  <Button onClick={handleSaveRule}>
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="statistics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>预警类型分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(alertStats.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(type)}
                        <span>{getTypeLabel(type)}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>严重程度分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(alertStats.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex justify-between items-center">
                      <span className="capitalize">{severity}</span>
                      <div className="flex items-center space-x-2">
                        {getSeverityBadge(severity)}
                        <span>{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>系统设置</CardTitle>
              <CardDescription>配置预警系统的全局设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">启用预警系统</h4>
                  <p className="text-sm text-gray-600">开启或关闭整个预警系统</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">实时通知</h4>
                  <p className="text-sm text-gray-600">启用实时预警通知推送</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">邮件通知</h4>
                  <p className="text-sm text-gray-600">通过邮件发送预警通知</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">短信通知</h4>
                  <p className="text-sm text-gray-600">通过短信发送紧急预警</p>
                </div>
                <Switch />
              </div>

              <div>
                <Label htmlFor="checkInterval">检查间隔（分钟）</Label>
                <Input id="checkInterval" type="number" defaultValue="30" className="w-32" />
                <p className="text-sm text-gray-600 mt-1">系统检查成绩变化的时间间隔</p>
              </div>

              <div>
                <Label htmlFor="retentionDays">数据保留天数</Label>
                <Input id="retentionDays" type="number" defaultValue="90" className="w-32" />
                <p className="text-sm text-gray-600 mt-1">预警记录的保留时间</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
