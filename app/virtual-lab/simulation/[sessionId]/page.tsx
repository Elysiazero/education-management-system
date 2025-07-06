"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Beaker, FlaskConical, ShieldAlert } from "lucide-react";

// --- API 服务层 ---
// 假设这个函数位于: @/services/api/experimentLogService.ts
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
    if (!response.ok) throw new Error('批量上报日志失败');
    console.log(`成功上报 ${logBatch.length} 条日志。`);
  } catch (error) {
    console.error("上报日志时发生网络错误:", error);
    throw error;
  }
}

// --- 日志记录器 (应用内通信) ---
/**
 * 仿真日志服务 (应用内版本)
 * 通过回调函数将日志传递给父组件，而不是 postMessage。
 */
class SimulationLogger {
  private onLog: (logEntry: any) => void;

  constructor(onLogCallback: (logEntry: any) => void) {
    this.onLog = onLogCallback;
  }

  public log(actionType: string, eventData: object) {
    if (!actionType || !eventData) {
      console.error("日志参数不完整");
      return;
    }
    const logEntry = {
      actionType,
      eventData,
      eventTime: new Date().toISOString(),
    };
    this.onLog(logEntry);
  }
}

// --- 具体的仿真实验组件 ---
interface TitrationSimulationProps {
  logger: SimulationLogger;
}

function TitrationSimulation({ logger }: TitrationSimulationProps) {
  const [volume, setVolume] = useState(50.0); // 锥形瓶内液体体积 (mL)
  const [ph, setPh] = useState(7.0); // 初始pH值
  const [color, setColor] = useState("bg-blue-500"); // 指示剂颜色

  const addDroplet = () => {
    // 模拟滴加酸液
    const newVolume = parseFloat((volume + 0.1).toFixed(1));
    const newPh = parseFloat((ph - 0.25).toFixed(2));

    setVolume(newVolume);
    setPh(newPh);

    // 根据pH值改变颜色
    if (newPh < 6.8 && newPh > 4.5) setColor("bg-yellow-400");
    if (newPh <= 4.5) setColor("bg-red-500");

    // 使用 logger 记录这次操作
    logger.log('ADD_REAGENT', {
      reagentName: "0.1M HCl",
      addedVolume: 0.1,
      newPh: newPh,
      newTotalVolume: newVolume
    });
  };

  useEffect(() => {
    // 记录实验开始事件
    logger.log('EXPERIMENT_START', { experimentName: "酸碱滴定仿真" });
  }, [logger]);


  return (
    <div className="w-full h-full p-8 flex flex-col items-center justify-center bg-gray-800 rounded-lg">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-700 text-white">
        <CardHeader>
          <CardTitle>酸碱滴定实验</CardTitle>
          <CardDescription>模拟将盐酸滴入含有指示剂的碱溶液中</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-8">
          {/* 仿真视觉区域 */}
          <div className="flex-1 flex flex-col items-center gap-4">
            <div className="text-center">
              <Beaker className="w-16 h-16 mx-auto text-gray-400" />
              <p className="mt-2">滴定管 (HCl)</p>
            </div>
            <div className="w-2 h-16 bg-gray-500"></div>
            <div className="text-center">
              <FlaskConical className={`w-24 h-24 mx-auto transition-colors duration-300 ${color}`} />
              <p className="mt-2">锥形瓶 (NaOH + 指示剂)</p>
            </div>
          </div>
          {/* 控制和数据显示区域 */}
          <div className="flex-1 space-y-4">
            <div className="text-center">
              <Button onClick={addDroplet} className="bg-blue-600 hover:bg-blue-700">滴加一滴盐酸</Button>
            </div>
            <div className="p-4 bg-gray-800 rounded-md space-y-2">
              <p>锥形瓶内液体体积: <span className="font-mono text-green-400">{volume.toFixed(1)} mL</span></p>
              <p>当前溶液pH值: <span className="font-mono text-green-400">{ph.toFixed(2)}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// --- 页面主组件 ---
function SimulationContainerPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [logQueue, setLogQueue] = useState<any[]>([]);
  const batchTimer = useRef<NodeJS.Timeout | null>(null);

  const BATCH_SIZE_THRESHOLD = 5;
  const BATCH_TIME_THRESHOLD = 3000;

  const flushLogQueue = useCallback(async (queueToFlush: any[]) => {
    if (queueToFlush.length === 0 || !sessionId) return;
    try {
      await reportLogBatch(sessionId, queueToFlush);
      setLogQueue(prev => prev.slice(queueToFlush.length));
    } catch (err) {
      console.error("日志批量上报失败:", err);
    }
  }, [sessionId]);

  const handleLog = useCallback((logEntry: any) => {
    console.log("接收到仿真日志:", logEntry);
    setLogQueue(prev => [...prev, logEntry]);
  }, []);

  const logger = useRef(new SimulationLogger(handleLog)).current;

  useEffect(() => {
    if (batchTimer.current) clearTimeout(batchTimer.current);
    if (logQueue.length >= BATCH_SIZE_THRESHOLD) {
      flushLogQueue([...logQueue]);
    } else if (logQueue.length > 0) {
      batchTimer.current = setTimeout(() => {
        flushLogQueue([...logQueue]);
      }, BATCH_TIME_THRESHOLD);
    }
    return () => { if (batchTimer.current) clearTimeout(batchTimer.current); };
  }, [logQueue, flushLogQueue]);

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-700">
        <ShieldAlert className="w-12 h-12 mb-4" />
        <h1 className="text-xl font-bold">错误：缺少实验会话ID</h1>
        <Button onClick={() => router.push('/virtual-lab')} className="mt-4">返回实验列表</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700 shadow-md text-white">
        <h1 className="text-lg font-semibold">仿真实验平台</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">会话ID: {sessionId}</span>
          <Button variant="ghost" onClick={() => router.push('/virtual-lab')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            退出实验
          </Button>
        </div>
      </header>
      <main className="flex-grow relative bg-black p-4">
        {/* 直接渲染仿真组件，而不是iframe */}
        <TitrationSimulation logger={logger} />
      </main>
      <footer className="p-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <p>日志队列中待上报数量: {logQueue.length}</p>
      </footer>
    </div>
  );
}

// ✨ 修复: 在使用前定义 queryClient 实例
const queryClient = new QueryClient();

// 页面包裹组件
export default function SimulationDemoPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimulationContainerPage />
    </QueryClientProvider>
  );
}
