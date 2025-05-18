import React, { useState, useEffect, useCallback } from "react";
import { styled } from "@mui/material/styles";
import { Box, Typography, Slider, Button, Paper } from "@mui/material";
import PlantVisualization from "./components/PlantVisualization";
import ControlPanel from "./components/ControlPanel";
import { GrowthPoint, PlantParams, DEFAULT_PARAMS } from "./types/plant";
import {
  generateGrowthPoints,
  calculateNextGrowthPoint,
} from "./utils/growthSimulation";
import { saveAs } from "file-saver";

// 自定义光源接口
interface CustomLightSource {
  id: number;
  x: number;
  y: number;
  z: number;
  intensity: number;
  startDay: number; // 光源开始照射的日期
}

const AppContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  width: "100vw",
  padding: "20px",
  boxSizing: "border-box",
  gap: "20px",
  background:
    "radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.04) 0%, rgba(245, 158, 11, 0.03) 90%)",
  fontFamily: "var(--font-family)",
  overflow: "hidden",
  position: "relative",
});

const Header = styled(Typography)({
  fontSize: "28px",
  fontWeight: 700,
  color: "var(--text-color)",
  textAlign: "center",
  margin: "0 0 10px 0",
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "&::before": {
    content: '""',
    display: "inline-block",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "var(--primary-color)",
    marginRight: "12px",
    animation: "pulse 2s infinite",
  },
});

const MainContainer = styled(Box)({
  display: "flex",
  flex: 1,
  gap: "20px",
  height: "calc(100% - 100px)",
  overflow: "hidden",
});

const ControlContainer = styled(Box)({
  width: "350px",
  height: "100%",
  overflow: "auto",
  padding: "4px",
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "var(--border-color)",
    borderRadius: "10px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "transparent",
  },
});

const VisualizationContainer = styled(Box)({
  flex: 1,
  position: "relative",
  borderRadius: "var(--radius-large)",
  overflow: "hidden",
  backgroundColor: "#fff",
  boxShadow: "var(--shadow-medium)",
  border: "1px solid var(--border-color)",
  animation: "slideUp 0.6s ease-out",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "4px",
    background:
      "linear-gradient(90deg, var(--primary-color), var(--accent-color))",
    borderTopLeftRadius: "var(--radius-large)",
    borderTopRightRadius: "var(--radius-large)",
  },
});

const TimelineContainer = styled(Box)({
  padding: "16px",
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(10px)",
  borderRadius: "var(--radius-medium)",
  boxShadow: "var(--shadow-light)",
  border: "1px solid var(--border-color)",
});

const DebugInfo = styled(Box)({
  position: "absolute",
  bottom: "20px",
  right: "20px",
  padding: "12px 16px",
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(8px)",
  borderRadius: "var(--radius-small)",
  boxShadow: "var(--shadow-light)",
  border: "1px solid var(--border-color)",
  fontSize: "12px",
  color: "var(--text-secondary)",
  maxWidth: "300px",
  zIndex: 100,
  animation: "fadeIn 0.3s ease-out",
});

const StyledSlider = styled(Slider)({
  color: "var(--primary-color)",
  height: 6,
  "& .MuiSlider-track": {
    border: "none",
    backgroundImage:
      "linear-gradient(90deg, var(--primary-color), var(--accent-color))",
  },
  "& .MuiSlider-thumb": {
    height: 18,
    width: 18,
    backgroundColor: "#fff",
    border: "2px solid var(--primary-color)",
    boxShadow: "var(--shadow-small)",
    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
      boxShadow: "var(--shadow-medium)",
    },
    "&::before": {
      display: "none",
    },
  },
  "& .MuiSlider-valueLabel": {
    lineHeight: 1.2,
    fontSize: 12,
    background: "var(--primary-color)",
    padding: "4px 8px",
    borderRadius: "var(--radius-small)",
  },
});

const App: React.FC = () => {
  const [currentDay, setCurrentDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulationDays, setSimulationDays] = useState(30);
  const [points, setPoints] = useState<GrowthPoint[]>([]);
  const [params, setParams] = useState<PlantParams>(DEFAULT_PARAMS);
  const [customLights, setCustomLights] = useState<CustomLightSource[]>([]);

  // 计算最大天数（避免在JSX中计算复杂表达式）
  const maxDay =
    points.length > 0 ? Math.max(...points.map((p) => p.day)) : simulationDays;

  // 生成生长点
  const generatePoints = useCallback(async () => {
    console.log("生成新的生长点...", params);
    console.log("使用自定义光源:", customLights);
    setIsGenerating(true);
    // 使用setTimeout模拟计算延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const newPoints = generateGrowthPoints(
        simulationDays,
        params,
        customLights
      );
      console.log(`生成了 ${newPoints.length} 个生长点`);
      setPoints(newPoints);
      setCurrentDay(0);
      setIsPlaying(false);
      setIsGenerating(false);
    } catch (error) {
      console.error("生成生长点出错:", error);
      setIsGenerating(false);
    }
  }, [simulationDays, params, customLights]);

  // 初始生成
  useEffect(() => {
    generatePoints();
  }, [generatePoints]);

  // 从当前天重新生成生长点
  const generateNewPointsFromDay = useCallback(
    (startDay: number, daysToGenerate: number): GrowthPoint[] => {
      console.log(
        `从第 ${startDay} 天开始生成新的生长点，共 ${daysToGenerate} 天`
      );

      // 找到startDay对应的点作为起始点
      const startDayPoints = points.filter((p) => p.day === startDay);

      if (startDayPoints.length === 0) {
        console.warn(`没有找到第 ${startDay} 天的生长点，无法生成新的生长点`);
        return [];
      }

      // 复制起始点（避免修改原始点）
      const lastPoints: GrowthPoint[] = JSON.parse(
        JSON.stringify(startDayPoints)
      );

      // 从每个终点开始生成后续点
      const newPointsGenerated: GrowthPoint[] = [];

      // 第一天，检查每个光源的状态并记录日志
      if (daysToGenerate > 0) {
        console.log(
          `第 ${startDay + 1} 天光源状态检查 (generateNewPointsFromDay):`
        );
        customLights.forEach((light) => {
          if (startDay + 1 >= light.startDay) {
            console.log(
              `  光源 ${light.id} 已激活: 启动日 ${light.startDay} <= 当前日 ${
                startDay + 1
              }`
            );
          } else {
            console.log(
              `  光源 ${light.id} 未激活: 启动日 ${light.startDay} > 当前日 ${
                startDay + 1
              }`
            );
          }
        });
      }

      // 生成点
      for (let day = 1; day <= daysToGenerate; day++) {
        const simulationDay = startDay + day;
        const dayPoints: GrowthPoint[] = [];

        // 从上一天的每个点生成新点
        for (const point of lastPoints) {
          // 调用calculateNextGrowthPoint，传入当前模拟天数和自定义光源
          const nextPoint = calculateNextGrowthPoint(
            point,
            params, // 使用当前的params状态
            customLights, // 使用当前的customLights状态
            simulationDay
          );

          if (nextPoint) {
            dayPoints.push(nextPoint);
          }
        }

        newPointsGenerated.push(...dayPoints);
        // 更新lastPoints为当前天生成的点，用于下一天的生成
        if (dayPoints.length > 0) {
          lastPoints.length = 0;
          lastPoints.push(...dayPoints);
        } else {
          // 如果某一天没有生成任何点（例如植物死亡或达到生长极限），则停止后续生成
          console.log(
            `在第 ${simulationDay} 天没有新的生长点生成，停止后续生成。`
          );
          break;
        }
      }

      console.log(
        `从第 ${startDay} 天开始共生成了 ${newPointsGenerated.length} 个新生长点`
      );
      return newPointsGenerated;
    },
    [points, params, customLights] // 添加依赖项
  );

  // 动画播放控制
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isPlaying && currentDay < maxDay) {
      console.log(`播放中: 当前天数 ${currentDay}, 总天数 ${maxDay}`);

      const nextDay = currentDay + 1;
      let needsRegeneration = false;

      // 检查是否有光源的激活状态会在下一天发生改变
      for (const light of customLights) {
        const isActiveToday = currentDay >= light.startDay;
        const isActiveNextDay = nextDay >= light.startDay;
        if (isActiveToday !== isActiveNextDay) {
          needsRegeneration = true;
          console.log(
            `光源 ${light.id} 激活状态将在第 ${nextDay} 天改变 (当前激活: ${isActiveToday}, 下一天激活: ${isActiveNextDay})`
          );
          break;
        }
      }

      if (needsRegeneration) {
        console.log(`因光源状态改变，从第 ${currentDay} 天重新生成路径`);
        // 保留当前天数及之前的点，删除之后的点
        const currentPoints = points.filter((p) => p.day <= currentDay);

        // 从当前天继续生成剩余天数的点
        setTimeout(() => {
          setPoints(currentPoints); // 先更新点以移除旧的未来路径
          const remainingDays = simulationDays - currentDay;
          if (remainingDays > 0) {
            console.log(
              `从 ${currentDay} 天开始，重新生成 ${remainingDays} 天的点`
            );
            const newPoints = generateNewPointsFromDay(
              currentDay,
              remainingDays
            );
            setPoints([...currentPoints, ...newPoints]);
            console.log(
              `重新生成后，总点数: ${currentPoints.length + newPoints.length}`
            );
          }
        }, 0); // 使用setTimeout确保状态更新和重新渲染
      }

      timer = setTimeout(() => {
        setCurrentDay((prev) => {
          const nextVal = prev + 1;
          // 如果到达末尾，自动停止
          if (nextVal >= maxDay) {
            setIsPlaying(false);
            console.log("播放结束");
            return maxDay;
          }
          return nextVal;
        });
      }, 50); // 动画速度
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [
    isPlaying,
    currentDay,
    maxDay,
    customLights,
    points,
    simulationDays,
    generateNewPointsFromDay,
  ]);

  // 播放/暂停切换
  const handlePlayPause = () => {
    console.log("播放/暂停按钮点击");
    if (currentDay >= maxDay) {
      console.log("已到达末尾，重置到开始");
      setCurrentDay(0);
    }
    setIsPlaying(!isPlaying);
  };

  // 重置
  const handleReset = () => {
    console.log("重置模拟");
    setCurrentDay(0);
    setIsPlaying(false);
  };

  // 导出CSV
  const handleExport = () => {
    const headers = "Day,Type,BranchId,X,Y,Z\n";
    const csvContent =
      headers +
      points
        .map((p) => `${p.day},${p.type},${p.branchId},${p.x},${p.y},${p.z}`)
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "plant_growth_data.csv");
  };

  // 参数变化处理
  const handleParamsChange = (newParams: PlantParams) => {
    setParams(newParams);
  };

  // 获取当前可见的点
  const getCurrentPoint = () => {
    const dayPoints = points.filter((p) => p.day === currentDay);
    if (dayPoints.length === 0) return null;

    // 查找茎的末端点
    const stemPoints = dayPoints.filter((p) => p.type === "stem");
    if (stemPoints.length > 0) {
      return stemPoints[0]; // 返回第一个茎点作为示例
    }

    return dayPoints[0]; // 如果没有茎点，则返回任何可用点
  };

  const currentPoint = getCurrentPoint();

  // 处理自定义光源变化的函数
  const handleCustomLightsChange = (newLights: CustomLightSource[]) => {
    console.log("更新光源设置:", newLights);
    setCustomLights(newLights);

    // 如果已经有生长点并且当前不是模拟的最后一天，从当前天重新生成
    if (points.length > 0 && currentDay < simulationDays) {
      // 保留当前天数及之前的点
      const currentPoints = points.filter((p) => p.day <= currentDay);
      setPoints(currentPoints);

      // 生成剩余天数的新点
      setTimeout(() => {
        const remainingDays = simulationDays - currentDay;
        if (remainingDays > 0) {
          const newPoints = generateNewPointsFromDay(currentDay, remainingDays);
          setPoints([...currentPoints, ...newPoints]);
        }
      }, 0);
    }
  };

  // 计算生长率
  const calculateGrowthRate = () => {
    if (points.length === 0) return "0.00";

    const visiblePoints = points.filter((point) => point.day <= currentDay);
    if (visiblePoints.length <= 1) return "0.00";

    const firstPoint = visiblePoints[0];
    const lastPoint = visiblePoints[visiblePoints.length - 1];

    // 计算生长率（mm/天）
    const daysPassed = lastPoint.day - firstPoint.day;
    if (daysPassed === 0) return "0.00";

    const distance = Math.sqrt(
      Math.pow(lastPoint.x - firstPoint.x, 2) +
        Math.pow(lastPoint.y - firstPoint.y, 2) +
        Math.pow(lastPoint.z - firstPoint.z, 2)
    );

    return (distance / daysPassed).toFixed(2);
  };

  // 处理当前日变化的函数
  const handleDayChange = (_event: Event, value: number | number[]) => {
    const newDay = Array.isArray(value) ? value[0] : value;

    // 检查是否跨过了任何光源的启动日
    const oldDay = currentDay;
    const crossesActivationDay = customLights.some(
      (light) =>
        (oldDay < light.startDay && newDay >= light.startDay) ||
        (oldDay > light.startDay && newDay <= light.startDay)
    );

    // 如果跨过了启动日，重新生成点
    if (crossesActivationDay) {
      console.log(`滑动经过了光源启动日，从第 ${newDay} 天重新生成路径`);

      // 保留当前天数及之前的点，删除之后的点
      const currentPoints = points.filter((p) => p.day <= newDay);
      setPoints(currentPoints);

      // 从新当前天继续生成剩余天数的点
      setTimeout(() => {
        const remainingDays = simulationDays - newDay;
        if (remainingDays > 0) {
          const newPoints = generateNewPointsFromDay(newDay, remainingDays);
          setPoints([...currentPoints, ...newPoints]);
        }
      }, 0);
    }

    setCurrentDay(newDay);
  };

  return (
    <AppContainer>
      <Header variant="h1">植物生长模拟器</Header>

      <MainContainer>
        <ControlContainer>
          <ControlPanel
            params={params}
            onParamsChange={handleParamsChange}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
            onExport={handleExport}
            onGenerateClick={generatePoints}
            isGenerating={isGenerating}
            onCustomLightsChange={handleCustomLightsChange}
          />
        </ControlContainer>

        <VisualizationContainer>
          <PlantVisualization
            points={points}
            currentDay={currentDay}
            customLights={customLights}
          />
        </VisualizationContainer>
      </MainContainer>

      <TimelineContainer>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <Typography variant="body2" color="textSecondary">
            生长天数: {currentDay} / {maxDay}
          </Typography>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              variant="contained"
              size="small"
              onClick={handlePlayPause}
              sx={{
                backgroundColor: "var(--primary-color)",
                "&:hover": { backgroundColor: "var(--primary-dark)" },
                textTransform: "none",
                borderRadius: "var(--radius-small)",
              }}
            >
              {isPlaying ? "暂停" : "播放"}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExport}
              sx={{
                color: "var(--primary-color)",
                borderColor: "var(--primary-color)",
                "&:hover": {
                  borderColor: "var(--primary-dark)",
                  backgroundColor: "rgba(99, 102, 241, 0.04)",
                },
                textTransform: "none",
                borderRadius: "var(--radius-small)",
              }}
            >
              导出数据
            </Button>
          </div>
        </div>

        <StyledSlider
          value={currentDay}
          onChange={handleDayChange}
          min={0}
          max={maxDay}
          valueLabelDisplay="auto"
        />
      </TimelineContainer>

      <DebugInfo>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
        >
          调试信息
        </Typography>
        {currentPoint ? (
          <>
            <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
              当前位置 ({currentPoint.type}): ({currentPoint.x.toFixed(2)},{" "}
              {currentPoint.y.toFixed(2)}, {currentPoint.z.toFixed(2)})
            </Typography>
            <Typography variant="caption" component="div">
              分支ID: {currentPoint.branchId}, 类型: {currentPoint.type}
            </Typography>
          </>
        ) : (
          <Typography variant="caption" component="div">
            无当前点数据
          </Typography>
        )}
      </DebugInfo>
    </AppContainer>
  );
};

export default App;
