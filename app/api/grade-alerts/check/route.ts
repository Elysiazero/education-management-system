import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  try {
    // 这里应该是实际的成绩检查逻辑
    // 模拟检查成绩变化并生成预警
    const alerts = await checkGradeAlerts(userId)

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error("Failed to check grade alerts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function checkGradeAlerts(userId: string) {
  // 模拟成绩检查逻辑
  const mockAlerts = []

  // 模拟检查条件
  const shouldTriggerAlert = Math.random() < 0.2 // 20% 概率触发预警

  if (shouldTriggerAlert) {
    const alertTypes = [
      {
        type: "decline",
        severity: "medium",
        message: "英语成绩连续下降",
        suggestions: ["加强英语基础练习", "增加阅读量", "参加英语辅导班"],
      },
      {
        type: "below_average",
        severity: "low",
        message: "数学成绩低于班级平均分",
        suggestions: ["复习基础知识点", "多做练习题", "寻求老师帮助"],
      },
    ]

    const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)]

    mockAlerts.push({
      id: Date.now().toString(),
      studentId: "student1",
      studentName: "张三",
      type: randomAlert.type,
      severity: randomAlert.severity,
      message: randomAlert.message,
      createdAt: new Date().toISOString(),
      suggestions: randomAlert.suggestions,
    })
  }

  return mockAlerts
}

export async function POST(request: NextRequest) {
  try {
    const { alertId, userId } = await request.json()

    if (!alertId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 这里应该是确认预警的逻辑
    // 更新数据库中的预警状态
    console.log(`Alert ${alertId} acknowledged by user ${userId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to acknowledge alert:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
