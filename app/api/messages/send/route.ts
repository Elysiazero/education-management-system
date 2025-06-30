import { type NextRequest, NextResponse } from "next/server"

// 导入广播函数
const messageStore = new Map<string, any[]>()
const userSessions = new Map<
  string,
  { userId: string; projectId?: string; controller: ReadableStreamDefaultController }
>()

export async function POST(request: NextRequest) {
  try {
    const { projectId, userId, content, type = "message" } = await request.json()

    if (!userId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 创建消息对象
    const message = {
      id: Date.now().toString(),
      projectId: projectId || "global",
      userId,
      userName: `用户${userId}`, // 实际应用中应该从数据库获取
      userRole: "student", // 实际应用中应该从数据库获取
      content,
      timestamp: new Date().toISOString(),
      type,
    }

    // 存储消息
    const key = projectId || "global"
    if (!messageStore.has(key)) {
      messageStore.set(key, [])
    }
    messageStore.get(key)!.push(message)

    // 广播消息给项目中的所有用户
    broadcastToProject(projectId, {
      type: "message",
      message,
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error("发送消息失败:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// 广播函数
function broadcastToProject(projectId: string | null, data: any) {
  userSessions.forEach((session, sessionId) => {
    if (session.projectId === projectId) {
      try {
        session.controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
      } catch (error) {
        userSessions.delete(sessionId)
      }
    }
  })
}
