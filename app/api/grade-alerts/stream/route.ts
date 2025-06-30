export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return new Response("Missing userId parameter", { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // 发送初始连接确认
      const data = `data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`
      controller.enqueue(encoder.encode(data))

      // 设置定期检查和心跳
      const checkInterval = setInterval(async () => {
        try {
          // 模拟检查成绩预警
          const shouldSendAlert = Math.random() < 0.1 // 10% 概率发送预警

          if (shouldSendAlert) {
            const mockAlert = {
              id: `alert_${Date.now()}`,
              type: "grade_decline",
              severity: "medium",
              studentId: userId,
              studentName: "张三",
              message: "数学成绩下降了15分，需要关注",
              createdAt: new Date().toISOString(),
              suggestions: ["复习基础知识点", "增加练习量", "寻求老师帮助"],
            }

            const alertData = `data: ${JSON.stringify({ type: "alert", data: mockAlert })}\n\n`
            controller.enqueue(encoder.encode(alertData))
          }

          // 发送心跳
          const heartbeat = `data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`
          controller.enqueue(encoder.encode(heartbeat))
        } catch (error) {
          console.error("Error in SSE stream:", error)
        }
      }, 30000) // 每30秒检查一次

      // 清理函数
      const cleanup = () => {
        clearInterval(checkInterval)
      }

      // 监听连接关闭
      request.signal?.addEventListener("abort", cleanup)

      return cleanup
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
