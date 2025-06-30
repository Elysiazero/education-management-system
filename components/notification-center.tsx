"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, MessageSquare, Users, FileText, CheckCircle } from "lucide-react"

interface Notification {
  id: string
  type: "message" | "project" | "system" | "grade"
  title: string
  content: string
  timestamp: string
  read: boolean
  actionUrl?: string
  metadata?: {
    projectId?: string
    userId?: string
    projectName?: string
  }
}

interface NotificationCenterProps {
  userId: string
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // 模拟通知数据
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "message",
        title: "新消息",
        content: '李老师在"Web开发实践项目"中发表了新评论',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        read: false,
        actionUrl: "/training-projects/1",
        metadata: { projectId: "1", projectName: "Web开发实践项目" },
      },
      {
        id: "2",
        type: "project",
        title: "项目更新",
        content: '您的团队在"数据库设计项目"中的进度已更新',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        read: false,
        actionUrl: "/training-projects/2",
        metadata: { projectId: "2", projectName: "数据库设计项目" },
      },
      {
        id: "3",
        type: "grade",
        title: "成绩发布",
        content: '您的"化学反应动力学"实验成绩已发布',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: true,
        actionUrl: "/virtual-lab/1",
      },
      {
        id: "4",
        type: "system",
        title: "系统通知",
        content: "系统将于今晚22:00-23:00进行维护",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        read: true,
      },
    ]

    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter((n) => !n.read).length)

    // 监听实时通知
    const eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`)

    eventSource.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data)
        setNotifications((prev) => [notification, ...prev])
        setUnreadCount((prev) => prev + 1)

        // 显示浏览器通知
        if (Notification.permission === "granted") {
          new Notification(notification.title, {
            body: notification.content,
            icon: "/favicon.ico",
          })
        }
      } catch (error) {
        console.error("解析通知失败:", error)
      }
    }

    return () => {
      eventSource.close()
    }
  }, [userId])

  useEffect(() => {
    // 请求通知权限
    if (Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-4 h-4 text-blue-600" />
      case "project":
        return <Users className="w-4 h-4 text-purple-600" />
      case "grade":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "system":
        return <FileText className="w-4 h-4 text-orange-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "刚刚"
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`
    return `${Math.floor(diffInMinutes / 1440)}天前`
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, userId }),
      })

      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("标记通知已读失败:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: unreadIds, userId }),
      })

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("标记所有通知已读失败:", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl
    }

    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">通知中心</CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                  全部已读
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无通知</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                        notification.read ? "border-transparent bg-white" : "border-blue-500 bg-blue-50"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p
                              className={`text-sm font-medium ${notification.read ? "text-gray-900" : "text-gray-900"}`}
                            >
                              {notification.title}
                            </p>
                            {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />}
                          </div>
                          <p className={`text-xs mt-1 ${notification.read ? "text-gray-500" : "text-gray-700"}`}>
                            {notification.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(notification.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
