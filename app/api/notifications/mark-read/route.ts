import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { notificationId, userId } = await request.json()

    if (!notificationId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 这里应该更新数据库中的通知状态
    // 目前只是模拟成功响应
    console.log(`标记通知 ${notificationId} 为已读，用户: ${userId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("标记通知已读失败:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
