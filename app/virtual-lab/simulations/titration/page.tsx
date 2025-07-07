"use client";

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Beaker, FlaskConical } from "lucide-react";
import { logToPlatform, LogActionType } from '../../utils/simulationLogger';

/**
 * 仿真UI组件 - 已根据日志规范V1.0全面升级
 */
function TitrationSimulation() {
  const [volume, setVolume] = useState(50.0);
  const [ph, setPh] = useState(7.0);
  const [color, setColor] = useState("bg-blue-500");

  // NEW: 增加状态来跟踪关键步骤，避免重复记录日志
  const hasLoggedColorChange = useRef(false);
  const hasReachedEndpoint = useRef(false);

  const addDroplet = () => {
    const newVolume = parseFloat((volume + 0.1).toFixed(1));
    const newPh = parseFloat((ph - 0.25).toFixed(2));

    setVolume(newVolume);
    setPh(newPh);

    // --- 日志记录逻辑 ---

    // 1. UPDATED: 使用 'GENERIC_ACTION' 记录用户的基本操作，内容更具描述性
    logToPlatform(LogActionType.GENERIC_ACTION, {
      description: "滴加一滴盐酸",
      details: {
        reagentName: "0.1M HCl",
        addedVolume: 0.1,
        unit: "mL"
      }
    });

    // 2. ENHANCED: 增强 'MEASURE_DATA' 日志，使其包含更多上下文信息
    logToPlatform(LogActionType.MEASURE_DATA, {
      metricName: "溶液pH值",
      value: newPh,
      unit: "pH",
      // 根据简单逻辑判断，演示 isCorrect 字段的用法
      isCorrect: newPh < 7.0,
      expectedRange: "pH < 7.0 (酸性)"
    });

    // 3. NEW: 使用 'STEP_COMPLETE' 记录关键的实验步骤
    // 首次变色为黄色
    if (newPh < 6.8 && !hasLoggedColorChange.current) {
      setColor("bg-yellow-400");
      logToPlatform(LogActionType.STEP_COMPLETE, {
        stepNumber: 1,
        stepName: "到达指示剂变色范围",
        isSuccess: true,
        context: { currentPh: newPh }
      });
      hasLoggedColorChange.current = true;
    }

    // 到达滴定终点（红色）
    if (newPh <= 4.5 && !hasReachedEndpoint.current) {
      setColor("bg-red-500");
      logToPlatform(LogActionType.STEP_COMPLETE, {
        stepNumber: 2,
        stepName: "到达滴定终点",
        isSuccess: true,
        context: { finalPh: newPh, totalVolumeAdded: parseFloat((newVolume - 50.0).toFixed(1)) }
      });
      hasReachedEndpoint.current = true;
    }
  };

  // 在组件挂载和卸载时记录实验开始/结束
  useEffect(() => {
    // 4. VERIFIED: 'EXPERIMENT_START' 符合规范
    logToPlatform(LogActionType.EXPERIMENT_START, {
      experimentName: "酸碱滴定仿真实验"
    });

    return () => {
      // 5. ENHANCED: 'EXPERIMENT_END' 日志可以根据最终状态动态生成
      const finalEventData = {
        reason: "用户离开实验页面",
        finalState: {
          ph: ph,
          volume: volume,
          isEndpointReached: hasReachedEndpoint.current
        },
        // 演示根据实验结果给出不同提示
        finalScoreHint: hasReachedEndpoint.current ? "100 (已完成滴定)" : "50 (未完成滴定)"
      };
      // logToPlatform(LogActionType.EXPERIMENT_END, finalEventData);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 依赖项为空，确保只在挂载和卸载时执行

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-900">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-700 text-white shadow-2xl">
        <CardHeader>
          <CardTitle>酸碱滴定实验</CardTitle>
          <CardDescription>模拟将盐酸滴入含有指示剂的碱溶液中</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-8">
          {/* ... JSX 视觉部分保持不变 ... */}
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

export default function TitrationSimulationPage() {
  return <TitrationSimulation />;
}