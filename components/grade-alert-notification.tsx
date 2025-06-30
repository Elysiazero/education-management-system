"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, AlertTriangle, TrendingDown, Clock, BarChart3, Bell } from "lucide-react"

interface GradeAlert {
  id: string
  studentId: string
  studentName: string
  type: "decline" | "failing" | "below_average" | "missing_assignment"
  severity: "low" | "medium" | "high" | "critical"
  message: string
  createdAt: string
  suggestions: string[]
}

interface GradeAlertNotificationProps {
  alert: GradeAlert
  onClose: () => void
  onAcknowledge: (alertId: string) => void
}

export function GradeAlertNotification({ alert, onClose, onAcknowledge }: GradeAlertNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 显示动画
    const timer = setTimeout(() => setIsVisible(true), 100)

    // 播放提示音
    playNotificationSound(alert.severity)

    // 自动关闭（除了严重预警）
    if (alert.severity !== "critical") {
      const autoCloseTimer = setTimeout(() => {
        handleClose()
      }, 8000)

      return () => {
        clearTimeout(timer)
        clearTimeout(autoCloseTimer)
      }
    }

    return () => clearTimeout(timer)
  }, [alert.severity])

  const playNotificationSound = (severity: string) => {
    // 创建音频上下文
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    const playTone = (frequency: number, duration: number, delay = 0) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
        oscillator.type = "sine"

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration)
      }, delay)
    }

    // 根据严重程度播放不同音效
    switch (severity) {
      case "critical":
        // 三声急促提示音
        playTone(800, 0.2, 0)
        playTone(800, 0.2, 300)
        playTone(800, 0.2, 600)
        break
      case "high":
        // 两声提示音
        playTone(600, 0.3, 0)
        playTone(600, 0.3, 400)
        break
      case "medium":
        // 一声提示音
        playTone(500, 0.4, 0)
        break
      case "low":
        // 低音提示音
        playTone(300, 0.5, 0)
        break
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-50"
      case "high":
        return "border-orange-500 bg-orange-50"
      case "medium":
        return "border-yellow-500 bg-yellow-50"
      case "low":
        return "border-blue-500 bg-blue-50"
      default:
        return "border-gray-500 bg-gray-50"
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

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const handleAcknowledge = () => {
    onAcknowledge(alert.id)
    handleClose()
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <Card className={`w-96 shadow-lg border-l-4 ${getSeverityColor(alert.severity)}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getAlertIcon(alert.type)}
              <h4 className="font-semibold text-gray-900">成绩预警</h4>
              {getSeverityBadge(alert.severity)}
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-6 w-6 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="font-medium text-gray-900">{alert.studentName}</p>
              <p className="text-sm text-gray-700">{alert.message}</p>
            </div>

            {alert.suggestions.length > 0 && (
              <div className="bg-white p-3 rounded border">
                <h5 className="text-sm font-medium text-gray-900 mb-2">建议措施：</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  {alert.suggestions.slice(0, 2).map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                忽略
              </Button>
              <Button size="sm" onClick={handleAcknowledge}>
                确认处理
              </Button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500">{new Date(alert.createdAt).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
