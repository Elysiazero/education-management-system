import type { NextRequest } from "next/server"

const notificationSessions = new Map<string, ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return new Response("Missing userId", { status: 400 })
  }

  const stream = new ReadableStream({
    start(controller) {
      notificationSessions.set(userId, controller)

      // 心跳包
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: "ping" })}\n\n`)
        } catch (error) {
          clearInterval(heartbeat)
        }
      }, 30000)

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        notificationSessions.delete(userId)
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
    },
  })
}

// 发送通知给特定用户
export function sendNotificationToUser(userId: string, notification: any) {
  const controller = notificationSessions.get(userId)
  if (controller) {
    try {
      controller.enqueue(`data: ${JSON.stringify(notification)}\n\n`)
    } catch (error) {
      notificationSessions.delete(userId)
    }
  }
}
