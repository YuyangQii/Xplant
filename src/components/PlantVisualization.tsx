import React, { useEffect, useState, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Line,
  PerspectiveCamera,
  Text,
  Stats,
  Environment,
} from "@react-three/drei";
import { Vector3, Color, CatmullRomCurve3 } from "three";
import { GrowthPoint } from "../types/plant";

// 添加自定义光源结构
interface CustomLightSource {
  id: number;
  x: number;
  y: number;
  z: number;
  intensity: number;
  startDay: number; // 光源开始照射的日期
}

interface PlantVisualizationProps {
  points: GrowthPoint[];
  currentDay: number;
  customLights?: CustomLightSource[]; // 自定义光源数组
}

// 检测 WebGL 是否可用
const isWebGLAvailable = () => {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
};

// 坐标轴组件
const Axes = () => {
  return (
    <>
      {/* X轴 */}
      <Line
        points={[
          [0, 0, 0],
          [10, 0, 0],
        ]}
        color="#ef4444" // 红色
        lineWidth={2}
      />
      <Text position={[11, 0, 0]} color="#ef4444" fontSize={0.8} anchorX="left">
        X (+右/-左)
      </Text>

      {/* Y轴 */}
      <Line
        points={[
          [0, 0, 0],
          [0, 0, 10],
        ]}
        color="#3b82f6" // 蓝色
        lineWidth={2}
      />
      <Text position={[0, 0, 11]} color="#3b82f6" fontSize={0.8}>
        Y (+前/-后)
      </Text>

      {/* Z轴 */}
      <Line
        points={[
          [0, 0, 0],
          [0, 10, 0],
        ]}
        color="#10b981" // 绿色
        lineWidth={2}
      />
      <Text position={[0, 11, 0]} color="#10b981" fontSize={0.8}>
        Z (+上/-下)
      </Text>

      {/* 刻度线 */}
      {[2, 4, 6, 8, 10].map((pos) => (
        <React.Fragment key={pos}>
          {/* X轴刻度 */}
          <Line
            points={[
              [pos, 0, -0.1],
              [pos, 0, 0.1],
            ]}
            color="#ef4444"
            lineWidth={1}
          />
          <Text
            position={[pos, 0, -0.5]}
            color="#ef4444"
            fontSize={0.4}
            anchorX="center"
          >
            {pos}
          </Text>

          {/* Y轴刻度 */}
          <Line
            points={[
              [0, 0, pos],
              [0.1, 0, pos],
            ]}
            color="#3b82f6"
            lineWidth={1}
          />
          <Text
            position={[-0.5, 0, pos]}
            color="#3b82f6"
            fontSize={0.4}
            anchorX="right"
          >
            {pos}
          </Text>

          {/* Z轴刻度 */}
          <Line
            points={[
              [0, pos, 0],
              [0.1, pos, 0],
            ]}
            color="#10b981"
            lineWidth={1}
          />
          <Text
            position={[-0.5, pos, 0]}
            color="#10b981"
            fontSize={0.4}
            anchorX="right"
          >
            {pos}
          </Text>

          {/* 负值刻度 (仅Y轴) */}
          <Line
            points={[
              [0, 0, -pos],
              [0.1, 0, -pos],
            ]}
            color="#3b82f6"
            lineWidth={1}
          />
          <Text
            position={[-0.5, 0, -pos]}
            color="#3b82f6"
            fontSize={0.4}
            anchorX="right"
          >
            {-pos}
          </Text>
        </React.Fragment>
      ))}
    </>
  );
};

// 生长路径组件 (单条路径)
const GrowthPath: React.FC<{
  points: Vector3[];
  type: "stem" | "root";
  branchId: number;
  totalBranches: number;
}> = ({ points, type, branchId, totalBranches }) => {
  // 创建高密度平滑曲线
  const curvePoints = useMemo(() => {
    if (points.length < 2) return points;
    const curve = new CatmullRomCurve3(points);
    return curve.getPoints(Math.max(points.length * 8, 100));
  }, [points]);

  // 渐变色数组与曲线点数量一致
  const pathColors = useMemo(() => {
    const colors = [];
    for (let i = 0; i < curvePoints.length; i++) {
      const progress = i / Math.max(1, curvePoints.length - 1);
      if (type === "stem") {
        const hue = 0.4 - (branchId / totalBranches) * 0.2;
        const saturation = 0.8;
        const lightness = 0.5 + progress * 0.3;
        colors.push(new Color().setHSL(hue, saturation, lightness));
      } else {
        const hue = 0.05 + (branchId / totalBranches) * 0.1;
        const saturation = 0.7 - progress * 0.3;
        const lightness = 0.3 + progress * 0.2;
        colors.push(new Color().setHSL(hue, saturation, lightness));
      }
    }
    return colors;
  }, [curvePoints.length, type, branchId, totalBranches]);

  const lineWidth = type === "stem" ? 3 : 2.5;
  const tipSize = type === "stem" ? 0.15 : 0.12;
  const tipColor = type === "stem" ? "#10b981" : "#d97706";
  const emissiveColor = type === "stem" ? "#34d399" : "#fdba74";

  return (
    <>
      {curvePoints.length > 1 && (
        <Line 
          points={curvePoints} 
          vertexColors={pathColors}
          lineWidth={lineWidth}
        />
      )}
      {curvePoints.length > 0 && (
        <mesh position={curvePoints[curvePoints.length - 1]}>
          <sphereGeometry args={[tipSize]} />
          <meshStandardMaterial
            color={tipColor}
            emissive={emissiveColor}
            emissiveIntensity={0.3}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      )}
    </>
  );
};

// 所有生长路径的渲染
const AllGrowthPaths: React.FC<{
  points: GrowthPoint[];
  currentDay: number;
}> = ({ points, currentDay }) => {
  // 按分支和类型组织数据
  const organizedPaths = useMemo(() => {
    // 获取当天之前的所有点
    const visiblePoints = points.filter((p) => p.day <= currentDay);

    // 按照类型和分支ID组织
    const paths: Record<string, GrowthPoint[]> = {};

    visiblePoints.forEach((point) => {
      const key = `${point.type}-${point.branchId}`;
      if (!paths[key]) {
        paths[key] = [];
      }
      paths[key].push(point);
    });

    return paths;
  }, [points, currentDay]);

  // 统计根和茎的总分支数
  const branchCounts = useMemo(() => {
    const stems = new Set();
    const roots = new Set();

    points.forEach((point) => {
      if (point.type === "stem") {
        stems.add(point.branchId);
      } else {
        roots.add(point.branchId);
      }
    });

    return {
      stemCount: stems.size,
      rootCount: roots.size,
    };
  }, [points]);

  return (
    <>
      {Object.entries(organizedPaths).map(([key, branchPoints]) => {
        // 提取类型和分支ID
        const [type, branchIdStr] = key.split("-");
        const branchId = parseInt(branchIdStr);

        // 正确转换点坐标: 保持原始坐标系，不做变换
        const linePoints = branchPoints.map(
          (point) => new Vector3(point.x, point.z, point.y)
        );

        return (
          <GrowthPath
            key={key}
            points={linePoints}
            type={type as "stem" | "root"}
            branchId={branchId}
            totalBranches={
              type === "stem" ? branchCounts.stemCount : branchCounts.rootCount
            }
          />
        );
      })}
    </>
  );
};

// 自定义网格组件，可以控制透明度
const CustomGridHelper: React.FC<{
  size: number;
  divisions: number;
  color: string;
  opacity: number;
}> = ({ size, divisions, color, opacity }) => {
  return (
    <gridHelper args={[size, divisions]} position={[0, 0, 0]}>
      <meshBasicMaterial
        attach="material"
        color={color}
        transparent={true}
        opacity={opacity}
      />
    </gridHelper>
  );
};

// 自定义光源组件
const CustomLight: React.FC<{
  position: [number, number, number];
  intensity: number;
  active: boolean; // 添加激活状态参数
}> = ({ position, intensity, active }) => {
  // 根据强度计算光源颜色和大小
  const normalizedIntensity = Math.min(intensity / 200, 1);
  const size = 0.2 + normalizedIntensity * 0.3;

  // 如果光源未激活，显示为半透明灰色
  const color = active ? "#ffcc00" : "#aaaaaa";
  const emissive = active ? "#ffffaa" : "#cccccc";
  const emissiveIntensity = active
    ? normalizedIntensity * 2
    : normalizedIntensity * 0.5;

  return (
    <group position={position}>
      {/* 光源球体 */}
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          toneMapped={false}
          transparent={!active}
          opacity={active ? 1 : 0.6}
        />
      </mesh>

      {/* 点光源 - 只有激活时才发光 */}
      {active && (
        <pointLight
          color="#ffffff"
          intensity={normalizedIntensity * 2}
          distance={50}
          decay={2}
        />
      )}

      {/* 发光线条 */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = ((Math.PI * 2) / 6) * i;
        const length = 0.5 + normalizedIntensity * 0.5;
        const endX = Math.cos(angle) * length;
        const endY = Math.sin(angle) * length;

        return (
          <Line
            key={i}
            points={[
              [0, 0, 0],
              [endX, endY, 0],
            ]}
            color={active ? "#ffdd66" : "#bbbbbb"}
            lineWidth={active ? 1 + normalizedIntensity * 2 : 1}
            transparent={!active}
            opacity={active ? 1 : 0.5}
          />
        );
      })}
    </group>
  );
};

// 2D 回退可视化 - 简化版，不再展开修改所有细节
const FallbackVisualization: React.FC<PlantVisualizationProps> = ({
  points,
  currentDay,
}) => {
  const visiblePoints = points.filter((p) => p.day <= currentDay);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 设置画布大小
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    // 清除画布
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // 绘制渐变背景
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      width / 2
    );
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.03)");
    gradient.addColorStop(1, "rgba(245, 158, 11, 0.01)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制坐标系
    const originX = width / 2;
    const originY = height / 2;
    const scale = 20; // 像素/毫米

    // 绘制坐标轴
    ctx.lineWidth = 1;

    // X轴
    ctx.strokeStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(originX - 200, originY);
    ctx.lineTo(originX + 200, originY);
    ctx.stroke();
    ctx.fillStyle = "#ef4444";
    ctx.fillText("X (mm)", originX + 205, originY);

    // Y轴
    ctx.strokeStyle = "#10b981";
    ctx.beginPath();
    ctx.moveTo(originX, originY - 200);
    ctx.lineTo(originX, originY + 200);
    ctx.stroke();
    ctx.fillStyle = "#10b981";
    ctx.fillText("Z (mm)", originX, originY - 205);

    // 绘制网格 - 使用非常淡的灰色
    ctx.strokeStyle = "rgba(230, 230, 230, 0.5)";
    ctx.lineWidth = 0.5;
    for (let i = -10; i <= 10; i++) {
      if (i === 0) continue;

      // 水平线
      ctx.beginPath();
      ctx.moveTo(originX - 200, originY + i * scale);
      ctx.lineTo(originX + 200, originY + i * scale);
      ctx.stroke();

      // 垂直线
      ctx.beginPath();
      ctx.moveTo(originX + i * scale, originY - 200);
      ctx.lineTo(originX + i * scale, originY + 200);
      ctx.stroke();

      // 刻度标记
      ctx.fillStyle = "#64748b";
      ctx.fillText(`${i}`, originX + i * scale, originY + 15);
      ctx.fillText(`${-i}`, originX - 10, originY + i * scale);
    }

    // 绘制生长路径
    if (visiblePoints.length > 1) {
      // 创建渐变
      const pathGradient = ctx.createLinearGradient(
        originX,
        originY,
        originX + visiblePoints[visiblePoints.length - 1].x * scale,
        originY - visiblePoints[visiblePoints.length - 1].z * scale
      );
      pathGradient.addColorStop(0, "#6366f1");
      pathGradient.addColorStop(1, "#f59e0b");

      ctx.strokeStyle = pathGradient;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < visiblePoints.length; i++) {
        const point = visiblePoints[i];
        const x = originX + point.x * scale;
        const y = originY - point.z * scale;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // 绘制当前点
      const lastPoint = visiblePoints[visiblePoints.length - 1];
      const lastX = originX + lastPoint.x * scale;
      const lastY = originY - lastPoint.z * scale;

      // 绘制光晕效果
      const glowRadius = 10;
      const glow = ctx.createRadialGradient(
        lastX,
        lastY,
        0,
        lastX,
        lastY,
        glowRadius
      );
      glow.addColorStop(0, "rgba(245, 158, 11, 0.8)");
      glow.addColorStop(1, "rgba(245, 158, 11, 0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lastX, lastY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 绘制点
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [visiblePoints]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        backgroundImage:
          "radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, rgba(245, 158, 11, 0.03) 90%)",
      }}
    >
      <div
        style={{
          marginBottom: "20px",
          padding: "16px 24px",
          borderRadius: "8px",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          color: "#ef4444",
          textAlign: "center",
          fontFamily: "var(--font-family)",
          boxShadow: "var(--shadow-light)",
          animation: "fadeIn 0.6s ease-out",
        }}
      >
        <h3 style={{ marginBottom: "8px", fontWeight: 600 }}>WebGL 不可用</h3>
        <p style={{ fontSize: "14px" }}>
          您的浏览器不支持 WebGL 或硬件加速被禁用。
        </p>
        <p style={{ fontSize: "14px" }}>
          请使用支持 WebGL 的现代浏览器查看3D生长模拟。
        </p>
      </div>
      <canvas
        ref={canvasRef}
        style={{
          width: "80%",
          height: "70%",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-small)",
          boxShadow: "var(--shadow-light)",
          animation: "slideUp 0.4s ease-out",
        }}
      />
    </div>
  );
};

// 图例组件，显示根和茎的色彩说明
const Legend: React.FC<{ customLightsCount?: number }> = ({
  customLightsCount = 0,
}) => {
  return (
    <group position={[8, 8, 0]}>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[4, 2.2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>

      {/* 标题 */}
      <Text
        position={[0, 0.8, 0.1]}
        color="#000000"
        fontSize={0.3}
        anchorX="center"
        font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
      >
        植物生长说明
      </Text>

      {/* 茎的图例 */}
      <Line
        points={[
          [-1.5, 0.3, 0.1],
          [-0.5, 0.3, 0.1],
        ]}
        color="#10b981"
        lineWidth={3}
      />
      <Text
        position={[0.5, 0.3, 0.1]}
        color="#000000"
        fontSize={0.25}
        anchorX="left"
      >
        茎系统
      </Text>

      {/* 根的图例 */}
      <Line
        points={[
          [-1.5, -0.2, 0.1],
          [-0.5, -0.2, 0.1],
        ]}
        color="#d97706"
        lineWidth={3}
      />
      <Text
        position={[0.5, -0.2, 0.1]}
        color="#000000"
        fontSize={0.25}
        anchorX="left"
      >
        根系统
      </Text>
    </group>
  );
};

const PlantVisualization: React.FC<PlantVisualizationProps> = ({
  points,
  currentDay,
  customLights = [],
}) => {
  const [webGLAvailable, setWebGLAvailable] = useState(true);

  useEffect(() => {
    setWebGLAvailable(isWebGLAvailable());
    console.log("Visualization update:", {
      points: points.length,
      currentDay,
      webGLAvailable: isWebGLAvailable(),
      customLights: customLights.length,
    });
  }, [points, currentDay, customLights]);

  if (!webGLAvailable) {
    return <FallbackVisualization points={points} currentDay={currentDay} />;
  }

  return (
    <div style={{ width: "100%", height: "100%", background: "#ffffff" }}>
      <Canvas
        camera={{ position: [15, 15, 15], fov: 50 }}
        style={{ background: "#ffffff" }}
        onError={(e) => {
          console.error("Canvas error:", e);
          setWebGLAvailable(false);
        }}
      >
        <color attach="background" args={["#ffffff"]} />
        <PerspectiveCamera makeDefault position={[15, 15, 15]} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={50}
        />

        {/* 环境光照 */}
        <ambientLight intensity={1.5} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={1.5}
          color="#ffffff"
        />
        <directionalLight
          position={[-10, -10, -10]}
          intensity={0.5}
          color="#ffffff"
        />
        <Environment preset="sunset" />

        {/* 坐标系统 */}
        <Axes />

        {/* 网格 - 三个平面 */}
        <CustomGridHelper
          size={20}
          divisions={20}
          color="#e2e8f0"
          opacity={0.8}
        />
        <group rotation={[Math.PI / 2, 0, 0]}>
          <CustomGridHelper
            size={20}
            divisions={20}
            color="#e2e8f0"
            opacity={0.5}
          />
        </group>
        <group rotation={[0, 0, Math.PI / 2]}>
          <CustomGridHelper
            size={20}
            divisions={20}
            color="#e2e8f0"
            opacity={0.5}
          />
        </group>

        {/* 渲染自定义光源 */}
        <group>
          {customLights.map((light) => {
            const isActive = currentDay >= light.startDay;
            return (
              <CustomLight
                key={light.id}
                position={[light.x, light.z, light.y]} // 调整坐标映射
                intensity={light.intensity}
                active={isActive}
              />
            );
          })}
        </group>

        {/* 所有生长路径 */}
        <AllGrowthPaths points={points} currentDay={currentDay} />

        {/* 图例 */}
        <Legend customLightsCount={customLights.length} />
      </Canvas>
    </div>
  );
};

export default PlantVisualization;
