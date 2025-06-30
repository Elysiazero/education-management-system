import type { NextRequest } from "next/server"

// 模拟的消息存储和用户会话管理
const messageStore = new Map<string, any[]>()
const userSessions = new Map<
  string,
  { userId: string; projectId?: string; controller: ReadableStreamDefaultController }
>()
const onlineUsers = new Map<string, { id: string; name: string; role: string; projectId?: string }>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const projectId = searchParams.get("projectId")

  if (!userId) {
    return new Response("Missing userId", { status: 400 })
  }

  // 创建SSE流
  const stream = new ReadableStream({
    start(controller) {
      // 存储用户会话
      const sessionId = `${userId}-${Date.now()}`
      userSessions.set(sessionId, { userId, projectId: projectId || undefined, controller })

      // 添加用户到在线列表
      const userData = {
        id: userId,
        name: `用户${userId}`, // 实际应用中应该从数据库获取
        role: "student", // 实际应用中应该从数据库获取
        projectId: projectId || undefined,
      }
      onlineUsers.set(userId, userData)

      // 发送当前在线用户列表
      const projectOnlineUsers = Array.from(onlineUsers.values()).filter(
        (user) => !projectId || user.projectId === projectId,
      )

      controller.enqueue(
        `data: ${JSON.stringify({
          type: "online_users",
          users: projectOnlineUsers,
        })}\n\n`,
      )

      // 通知其他用户有新用户加入
      broadcastToProject(
        projectId,
        {
          type: "user_joined",
          user: userData,
        },
        userId,
      )

      // 发送历史消息
      const projectMessages = messageStore.get(projectId || "global") || []
      projectMessages.forEach((message) => {
        controller.enqueue(
          `data: ${JSON.stringify({
            type: "message",
            message,
          })}\n\n`,
        )
      })

      // 设置心跳
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: "ping" })}\n\n`)
        } catch (error) {
          clearInterval(heartbeat)
        }
      }, 30000)

      // 清理函数
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        userSessions.delete(sessionId)
        onlineUsers.delete(userId)

        // 通知其他用户该用户离开
        broadcastToProject(
          projectId,
          {
            type: "user_left",
            user: userData,
          },
          userId,
        )

        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  })
}

// 广播消息到项目中的所有用户
function broadcastToProject(projectId: string | null, data: any, excludeUserId?: string) {
  userSessions.forEach((session, sessionId) => {
    if (session.projectId === projectId && session.userId !== excludeUserId) {
      try {
        session.controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
      } catch (error) {
        // 连接已断开，清理会话
        userSessions.delete(sessionId)
      }
    }
  })
}

// 导出广播函数供其他API使用
export { broadcastToProject }
