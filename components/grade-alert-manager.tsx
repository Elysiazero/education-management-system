"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, AlertTriangle, CheckCircle, X } from "lucide-react"

interface GradeAlert {
  id: string
  studentId: string
  studentName: string
  subject: string
  grade: number
  threshold: number
  type: "low" | "improvement" | "excellent"
  timestamp: string
  acknowledged: boolean
}

interface GradeAlertManagerProps {
  userId: string
  userRole: "student" | "teacher" | "admin"
}

export function GradeAlertManager({ userId, userRole }: GradeAlertManagerProps) {
  const [alerts, setAlerts] = useState<GradeAlert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connectEventSource = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const eventSource = new EventSource(`/api/grade-alerts/stream?userId=${userId}&role=${userRole}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log("Grade alerts SSE connection opened")
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttempts.current = 0

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (eventSource.readyState === EventSource.CLOSED) {
            console.log("Connection lost, attempting to reconnect...")
            handleReconnect()
          }
        }, 30000) // Check every 30 seconds
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "heartbeat") {
            console.log("Received heartbeat")
            return
          }

          if (data.type === "grade-alert") {
            setAlerts((prev) => {
              const exists = prev.some((alert) => alert.id === data.alert.id)
              if (exists) return prev
              return [data.alert, ...prev].slice(0, 50) // Keep only latest 50 alerts
            })
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error)
        }
      }

      eventSource.onerror = (error) => {
        console.error("Grade alerts SSE error:", error)
        setIsConnected(false)
        setConnectionError("连接中断")

        if (eventSource.readyState === EventSource.CLOSED) {
          handleReconnect()
        }
      }
    } catch (error) {
      console.error("Failed to create EventSource:", error)
      setConnectionError("无法建立连接")
      handleReconnect()
    }
  }

  const handleReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setConnectionError("连接失败，请刷新页面重试")
      return
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000) // Exponential backoff, max 30s
    reconnectAttempts.current++

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`)

    reconnectTimeoutRef.current = setTimeout(() => {
      connectEventSource()
    }, delay)
  }

  useEffect(() => {
    connectEventSource()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [userId, userRole])

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch("/api/grade-alerts/acknowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alertId }),
      })

      if (response.ok) {
        setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)))
      }
    } catch (error) {
      console.error("Failed to acknowledge alert:", error)
    }
  }

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "low":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "improvement":
        return <Bell className="w-4 h-4 text-yellow-500" />
      case "excellent":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "low":
        return "border-red-200 bg-red-50"
      case "improvement":
        return "border-yellow-200 bg-yellow-50"
      case "excellent":
        return "border-green-200 bg-green-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const unacknowledgedAlerts = alerts.filter((alert) => !alert.acknowledged)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <CardTitle>成绩预警系统</CardTitle>
            {unacknowledgedAlerts.length > 0 && <Badge variant="destructive">{unacknowledgedAlerts.length}</Badge>}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-xs text-gray-500">{isConnected ? "已连接" : "未连接"}</span>
          </div>
        </div>
        <CardDescription>实时监控学生成绩变化，及时发现需要关注的情况</CardDescription>
      </CardHeader>
      <CardContent>
        {connectionError && (
          <Alert className="mb-4">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无成绩预警</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getAlertColor(alert.type)} ${
                  alert.acknowledged ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">
                          {userRole === "student" ? alert.subject : `${alert.studentName} - ${alert.subject}`}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {alert.type === "low" ? "低分预警" : alert.type === "improvement" ? "进步提醒" : "优秀表现"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        成绩: {alert.grade}分{alert.type === "low" && ` (低于预警线 ${alert.threshold}分)`}
                        {alert.type === "improvement" && ` (较上次提升)`}
                        {alert.type === "excellent" && ` (优秀表现)`}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!alert.acknowledged && (
                      <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                        确认
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => dismissAlert(alert.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {alerts.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>共 {alerts.length} 条预警</span>
              <span>未确认 {unacknowledgedAlerts.length} 条</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
