import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, PerspectiveCamera } from "@react-three/drei";
import { Vector3 } from "three";
import { GrowthPoint } from "../types/plant";

interface PlantVisualizationProps {
  points: GrowthPoint[];
  currentDay: number;
}

const PlantVisualization: React.FC<PlantVisualizationProps> = ({
  points,
  currentDay,
}) => {
  const linePoints = points
    .slice(0, currentDay + 1)
    .map((point) => new Vector3(point.x, point.z, point.y));

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        {/* 坐标轴 */}
        <Line
          points={[
            [0, 0, 0],
            [2, 0, 0],
          ]}
          color="red"
          lineWidth={2}
        />
        <Line
          points={[
            [0, 0, 0],
            [0, 2, 0],
          ]}
          color="green"
          lineWidth={2}
        />
        <Line
          points={[
            [0, 0, 0],
            [0, 0, 2],
          ]}
          color="blue"
          lineWidth={2}
        />

        {/* 植物生长路径 */}
        <Line points={linePoints} color="green" lineWidth={3} />

        {/* 当前生长点 */}
        {linePoints.length > 0 && (
          <mesh position={linePoints[linePoints.length - 1]}>
            <sphereGeometry args={[0.1]} />
            <meshStandardMaterial color="yellow" />
          </mesh>
        )}

        {/* 网格 */}
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
};

export default PlantVisualization;
