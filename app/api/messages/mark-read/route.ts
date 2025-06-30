import { type NextRequest, NextResponse } from "next/server"

const readMessages = new Map<string, Set<string>>() // userId -> Set of messageIds

export async function POST(request: NextRequest) {
  try {
    const { messageIds, userId } = await request.json()

    if (!userId || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 标记消息为已读
    if (!readMessages.has(userId)) {
      readMessages.set(userId, new Set())
    }

    const userReadMessages = readMessages.get(userId)!
    messageIds.forEach((id) => userReadMessages.add(id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("标记消息已读失败:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
