/**
 * 虚拟仿真实验日志操作类型
 * (根据《虚拟仿真实验日志结构规范 V1.0》定义)
 */
export const LogActionType = {
  // 实验生命周期
  EXPERIMENT_START: "EXPERIMENT_START",
  EXPERIMENT_END: "EXPERIMENT_END",

  // 核心操作
  SET_PARAMETER: "SET_PARAMETER",
  MEASURE_DATA: "MEASURE_DATA",
  CONNECT_COMPONENT: "CONNECT_COMPONENT",
  DISCONNECT_COMPONENT: "DISCONNECT_COMPONENT",

  // 流程与交互
  STEP_COMPLETE: "STEP_COMPLETE",
  ANSWER_QUESTION: "ANSWER_QUESTION",
  GENERIC_ACTION: "GENERIC_ACTION", // 用于规范中未明确定义的其他通用操作
} as const; // 使用 as const 来获得更强的类型提示

export type LogActionType = typeof LogActionType[keyof typeof LogActionType];

/**
 * 向父平台发送日志消息的标准化函数
 * @param actionType 操作类型, 必须是 LogActionType 中定义的值
 * @param eventData 事件相关的数据对象
 */
export function logToPlatform(actionType: LogActionType, eventData: object): void {
  // 在 window 上下文中检查，确保在 iframe 中运行
  if (window.parent && window.self !== window.parent) {
    const logEntry = {
      actionType,
      eventData,
      eventTime: new Date().toISOString(), // 自动附加 ISO 8601 格式的时间戳
    };
    // 通过 postMessage 发送给父窗口
    window.parent.postMessage(logEntry, '*'); // 在生产环境中，应将 '*' 替换为父窗口的精确源 (origin)
  } else {
    console.warn("未在iframe环境中，日志无法上报:", { actionType, eventData });
  }
}