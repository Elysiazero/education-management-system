
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";

// --- API 服务层 (保持不变) ---
async function reportLogBatch(sessionId: string, logBatch: any[]): Promise<void> {
  if (!logBatch || logBatch.length === 0) return;
  const token = localStorage.getItem("accessToken");
  if (!token) {
    console.error("无法上报日志: 用户未登录");
    return;
  }
  const API_URL = `http://localhost:8080/api/v1/teaching/sessions/${sessionId}/logs`;
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(logBatch),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`批量上报日志失败: ${response.status} ${errorBody}`);
    }
    console.log(`成功上报 ${logBatch.length} 条日志。`);
  } catch (error) {
    console.error("上报日志时发生网络错误:", error);
    throw error;
  }
}

// --- 平台外壳主组件 ---
function SimulationContainerPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [logQueue, setLogQueue] = useState<any[]>([]);
  const isFlushing = useRef(false);
  const batchTimer = useRef<NodeJS.Timeout | null>(null);

  // ✅ 定义批处理常量
  const BATCH_SIZE_THRESHOLD = 5;
  const BATCH_TIME_THRESHOLD = 3000; // 3秒

  // ✅ 健壮的日志上报与队列管理逻辑 (最终版)
  const flushLogQueue = useCallback(async () => {
    if (isFlushing.current || logQueue.length === 0) return;

    isFlushing.current = true;
    const batchToSend = [...logQueue];
    setLogQueue([]); // 立即清空队列

    try {
      await reportLogBatch(sessionId, batchToSend);
    } catch (err) {
      console.error("日志批量上报失败，将日志重新放回队列头部:", err);
      setLogQueue(prevQueue => [...batchToSend, ...prevQueue]); // 失败后将日志放回队列头部
    } finally {
      isFlushing.current = false;
    }
  }, [sessionId, logQueue]);

  // ✅ 由 message listener 调用的日志处理函数
  const handleLog = useCallback((logEntry: any) => {
    if (logEntry && logEntry.actionType && logEntry.eventData && logEntry.eventTime) {
      console.log("从Iframe接收到日志:", logEntry);
      setLogQueue(prev => [...prev, logEntry]);
    } else {
      console.warn("从Iframe接收到无效的日志格式:", logEntry);
    }
  }, []);
  const handleExitExperiment = async () => {
    // 1. 手动创建一条“实验结束”日志。这是最可靠的方式。
    const exitLog = {
      actionType: "EXPERIMENT_END", // 直接使用字符串或从枚举导入
      eventData: {
        reason: "用户通过外壳退出实验",
      },
      eventTime: new Date().toISOString(),
    };

    console.log("准备退出实验，正在处理最后的日志...");

    // 2. 将待处理队列中的所有日志与这条退出日志合并
    const finalBatch = [...logQueue, exitLog];

    // 3. 立即清空状态队列，并清除定时器，防止重复发送
    setLogQueue([]);
    if (batchTimer.current) {
      clearTimeout(batchTimer.current);
    }

    try {
      // 4. 使用 reportLogBatch 发送最终的完整批次，并等待其完成
      // 即使 finalBatch 为空（用户刚进入就退出），也应该尝试发送，后端通常会处理空数组
      await reportLogBatch(sessionId, finalBatch);
      console.log("最终日志上报成功。");
    } catch (error) {
      // 即使上报失败，也应该允许用户退出，但要在控制台记录错误
      console.error("最终日志上报失败，但仍将继续退出:", error);
    } finally {
      // 5. 无论成功还是失败，最后都执行页面跳转
      router.push('/virtual-lab');
    }
  };


  // ✅ 核心修改：设置和清除 message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 生产环境应添加 origin 安全检查
      // if (event.origin !== 'http://your-simulation-domain.com') return;
      handleLog(event.data);
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleLog]);

  // ✅ 健壮的批处理触发逻辑 (最终版)
  useEffect(() => {
    if (batchTimer.current) clearTimeout(batchTimer.current);

    if (logQueue.length >= BATCH_SIZE_THRESHOLD) {
      flushLogQueue();
    } else if (logQueue.length > 0) {
      batchTimer.current = setTimeout(flushLogQueue, BATCH_TIME_THRESHOLD);
    }

    return () => {
      if (batchTimer.current) clearTimeout(batchTimer.current);
    };
  }, [logQueue, flushLogQueue]);

  if (!sessionId) {
    // 错误状态 UI
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-700">
        <ShieldAlert className="w-12 h-12 mb-4" />
        <h1 className="text-xl font-bold">错误：缺少实验会话ID</h1>
        <Button onClick={() => router.push('/virtual-lab')} className="mt-4">返回实验列表</Button>
      </div>
    );
  }

  // ✅ 确保这里的 URL 指向你的仿真实验插件页面
  const simulationUrl = `/virtual-lab/simulations/titration`;


  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700 shadow-md text-white">
        <h1 className="text-lg font-semibold">仿真实验平台</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">会话ID: {sessionId}</span>
          <Button variant="ghost" onClick={handleExitExperiment}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            退出实验
          </Button>
        </div>
      </header>
      <main className="flex-grow relative flex items-center justify-center p-4 md:p-8 overflow-hidden bg-gray-900">
        <iframe
          src={simulationUrl}
          title="虚拟仿真实验"
          className="w-full h-full max-w-5xl"
          style={{ border: 'none' }} // ✅ 添加这个内联样式
        />
      </main>
      <footer className="p-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <p>日志队列中待上报数量: {logQueue.length}</p>
      </footer>
    </div>
  );
}

const queryClient = new QueryClient();

// 页面包裹组件
export default function SimulationDemoPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimulationContainerPage />
    </QueryClientProvider>
  );
}