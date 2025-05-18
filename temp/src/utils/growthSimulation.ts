import { GrowthPoint, PlantParams } from "../types/plant";

const randomInRange = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

const calculateGrowthRate = (params: PlantParams): number => {
  let rate = 1.0;

  // 辐射影响
  if (params.radiation > 0.5) {
    rate *= Math.max(0, 1 - (params.radiation - 0.5) * 0.1);
  }
  if (params.radiation > 1.5) return 0;

  // CO2 影响
  const co2Factor = Math.min(1.5, Math.max(0.5, params.co2 / 800));
  rate *= co2Factor;

  // 温度影响
  const tempOptimal = 23;
  const tempDiff = Math.abs(params.temp - tempOptimal);
  rate *= Math.exp(-0.05 * tempDiff);

  // 湿度影响
  if (params.humidity < 30 || params.humidity > 80) {
    rate *= 0.8;
  }

  // 光照强度影响
  rate *= Math.min(1.2, Math.max(0.5, params.lightIntensity / 250));

  return rate;
};

export const calculateNextGrowthPoint = (
  currentPoint: GrowthPoint,
  params: PlantParams
): GrowthPoint => {
  const growthRate = calculateGrowthRate(params);
  const baseGrowth = 1.0 * growthRate;

  let xOffset = 0;
  let yOffset = 0;
  let zGrowth = baseGrowth;

  // 光照方向影响
  if (params.lightDirection === "left") {
    xOffset -= 0.2 * growthRate;
  } else if (params.lightDirection === "angled") {
    xOffset -= 0.15 * growthRate;
    yOffset += 0.15 * growthRate;
  }

  // 红蓝光比例影响
  if (params.redBlueRatio < 1) {
    xOffset *= 2 - params.redBlueRatio;
    zGrowth *= 0.9;
  } else {
    zGrowth *= Math.min(1.2, params.redBlueRatio);
  }

  // 微重力影响
  if (params.microgravity) {
    const angle = (Math.PI / 180) * randomInRange(5, 15);
    const randomFactor = Math.random() * 0.2;
    xOffset += Math.cos(angle) * randomFactor;
    yOffset += Math.sin(angle) * randomFactor;
    zGrowth *= 0.9;
  }

  return {
    x: currentPoint.x + xOffset,
    y: currentPoint.y + yOffset,
    z: currentPoint.z + zGrowth,
    day: currentPoint.day + 1,
  };
};

export const generateGrowthPoints = (
  days: number,
  params: PlantParams
): GrowthPoint[] => {
  const points: GrowthPoint[] = [{ x: 0, y: 0, z: 0, day: 0 }];

  for (let i = 0; i < days; i++) {
    const nextPoint = calculateNextGrowthPoint(
      points[points.length - 1],
      params
    );
    points.push(nextPoint);
  }

  return points;
};
