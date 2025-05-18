import { GrowthPoint, PlantParams, LightDirectionOption } from "../types/plant";
import { Vector3 } from "three";

const randomInRange = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

// 添加自定义光源接口
interface CustomLightSource {
  id: number;
  x: number;
  y: number;
  z: number;
  intensity: number;
  startDay: number;
}

// 安全计算生长率，确保不会出现 NaN 或无限值
const calculateGrowthRate = (
  params: PlantParams,
  type: "stem" | "root",
  currentPoint: GrowthPoint
): number => {
  try {
    // 增加基础生长率
    let rate = type === "stem" ? 1.5 : 1.2; // 茎的生长速率更快
    const factors: Record<string, number> = {};

    // 辐射影响
    if (params.radiation > 0.5) {
      // 辐射强度越大，生长越无序
      const radiationFactor = Math.max(0.7, 1 - (params.radiation - 0.5) * 0.1);
      rate *= radiationFactor;
      factors.radiation = radiationFactor;
    } else {
      factors.radiation = 1.0;
    }

    if (params.radiation > 2.0) {
      console.log("高辐射导致生长停止");
      return 0;
    }

    // CO2 影响
    const co2Factor = Math.min(1.5, Math.max(0.5, params.co2 / 800));
    rate *= co2Factor;
    factors.co2 = co2Factor;

    // 温度影响
    const tempOptimal = 23;
    const tempDiff = Math.abs(params.temp - tempOptimal);
    const tempFactor = Math.exp(-0.05 * tempDiff);
    rate *= tempFactor;
    factors.temperature = tempFactor;

    // 湿度影响
    let humidityFactor = 1.0;
    if (params.humidity < 30 || params.humidity > 80) {
      humidityFactor = 0.8;
    }
    rate *= humidityFactor;
    factors.humidity = humidityFactor;

    // 光照强度影响
    const lightFactor = Math.min(
      1.5,
      Math.max(0.7, params.lightIntensity / 200)
    );

    // 根和茎对光照的响应不同
    if (type === "root") {
      // 根受光照的影响较小
      rate *= 0.8 + lightFactor * 0.2;
    } else {
      // 茎直接受光照影响
      rate *= lightFactor;
    }

    factors.light = lightFactor;

    // 微重力特定影响
    if (params.microgravity) {
      if (type === "root") {
        // 根在微重力下生长速率减缓
        rate *= 0.6 - 0.2 * params.exaggerationFactor;
      } else {
        // 茎在微重力下可能徒长
        rate *= 1.2 + 0.3 * params.exaggerationFactor;
      }
      factors.microgravity = params.microgravity
        ? type === "root"
          ? 0.6
          : 1.2
        : 1.0;
    }

    // 确保返回有效数字
    if (isNaN(rate) || !isFinite(rate)) {
      console.warn(`${type}生长速率计算出错，使用默认值 1.0`);
      return 1.0;
    }

    return rate;
  } catch (e) {
    console.error(`计算${type}生长速率时出错:`, e);
    return 1.0; // 出错时返回默认值
  }
};

// 处理单个光照方向对生长的影响
const calculateSingleLightDirectionEffect = (
  growthRate: number,
  lightDirection: LightDirectionOption,
  type: "stem" | "root"
): { xOffset: number; yOffset: number; zOffset: number } => {
  // 基础偏移系数，根和茎对光照的响应不同
  const baseOffset =
    type === "stem"
      ? 0.6 * growthRate // 增强茎向光性
      : -0.3 * growthRate; // 增强根背光性

  let xOffset = 0;
  let yOffset = 0;
  let zOffset = 0;

  // 解析光照方向 - 确保按坐标轴正确方向生长
  // 对于单一轴方向的光源，严格只沿着该轴生长，没有其他轴的倾向性
  if (lightDirection === "+x") {
    // +x表示右侧光源，茎应该向+x方向生长，根向-x方向生长
    xOffset = type === "stem" ? Math.abs(baseOffset) : -Math.abs(baseOffset);
    // 确保没有其他轴向的生长倾向
    yOffset = 0;
    zOffset = 0;
  } else if (lightDirection === "-x") {
    // -x表示左侧光源，茎应该向-x方向生长，根向+x方向生长
    xOffset = type === "stem" ? -Math.abs(baseOffset) : Math.abs(baseOffset);
    // 确保没有其他轴向的生长倾向
    yOffset = 0;
    zOffset = 0;
  } else if (lightDirection === "+y") {
    // +y表示前方光源，茎应该向+y方向生长，根向-y方向生长
    yOffset = type === "stem" ? Math.abs(baseOffset) : -Math.abs(baseOffset);
    // 确保没有其他轴向的生长倾向
    xOffset = 0;
    zOffset = 0;
  } else if (lightDirection === "-y") {
    // -y表示后方光源，茎应该向-y方向生长，根向+y方向生长
    yOffset = type === "stem" ? -Math.abs(baseOffset) : Math.abs(baseOffset);
    // 确保没有其他轴向的生长倾向
    xOffset = 0;
    zOffset = 0;
  } else if (lightDirection === "+z") {
    // +z表示上方光源，茎应该向+z方向生长，根向-z方向生长
    zOffset = type === "stem" ? Math.abs(baseOffset) : -Math.abs(baseOffset);
    // 确保没有其他轴向的生长倾向
    xOffset = 0;
    yOffset = 0;
  } else if (lightDirection === "-z") {
    // -z表示下方光源，茎应该向-z方向生长，根向+z方向生长
    zOffset = type === "stem" ? -Math.abs(baseOffset) : Math.abs(baseOffset);
    // 确保没有其他轴向的生长倾向
    xOffset = 0;
    yOffset = 0;
  }
  // 对于组合光源方向，分解为单一坐标轴，避免斜向生长
  else if (lightDirection.includes("+x") || lightDirection.includes("-x")) {
    // 优先选择X轴方向
    if (lightDirection.includes("+x")) {
      xOffset = type === "stem" ? Math.abs(baseOffset) : -Math.abs(baseOffset);
    } else {
      xOffset = type === "stem" ? -Math.abs(baseOffset) : Math.abs(baseOffset);
    }
  } else if (lightDirection.includes("+y") || lightDirection.includes("-y")) {
    // 其次选择Y轴方向
    if (lightDirection.includes("+y")) {
      yOffset = type === "stem" ? Math.abs(baseOffset) : -Math.abs(baseOffset);
    } else {
      yOffset = type === "stem" ? -Math.abs(baseOffset) : Math.abs(baseOffset);
    }
  } else if (lightDirection.includes("+z") || lightDirection.includes("-z")) {
    // 最后选择Z轴方向
    if (lightDirection.includes("+z")) {
      zOffset = type === "stem" ? Math.abs(baseOffset) : -Math.abs(baseOffset);
    } else {
      zOffset = type === "stem" ? -Math.abs(baseOffset) : Math.abs(baseOffset);
    }
  }

  return { xOffset, yOffset, zOffset };
};

// 计算从光源位置到当前生长点的方向向量
export const calculateDirectionFromLightSource = (
  point: GrowthPoint,
  lightSource: CustomLightSource,
  currentDay: number
): { x: number; y: number; z: number; intensity: number } => {
  // 检查当前日期是否小于光源启动日
  if (currentDay < lightSource.startDay) {
    console.log(
      `光源 ${lightSource.id} 未激活: 当前日 ${currentDay} < 启动日 ${lightSource.startDay}`
    );
    return { x: 0, y: 0, z: 0, intensity: 0 };
  }

  console.log(
    `光源 ${lightSource.id} 已激活: 当前日 ${currentDay} >= 启动日 ${lightSource.startDay}`
  );

  // 计算当前生长点到光源的向量
  const dx = lightSource.x - point.x;
  const dy = lightSource.y - point.y;
  const dz = lightSource.z - point.z;

  // 向量长度（距离）
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (distance < 0.001) {
    // 如果距离非常小，返回很小的随机偏移避免除以零
    return {
      x: randomInRange(-0.01, 0.01),
      y: randomInRange(-0.01, 0.01),
      z: randomInRange(-0.01, 0.01),
      intensity: 0,
    };
  }

  // 归一化向量
  const nx = dx / distance;
  const ny = dy / distance;
  const nz = dz / distance;

  // 光强随距离衰减（平方反比定律）
  // 限制最小距离防止近距离时影响过大
  const effectiveDistance = Math.max(distance, 1);
  const intensityFactor =
    lightSource.intensity / (effectiveDistance * effectiveDistance);

  // 向光性（茎）或背光性（根）的系数 - 调整为与标准光照方向相同的影响力
  const tropismFactor = point.type === "stem" ? 0.6 : -0.3;

  // 对于茎，向光性随着距离增加而减弱；对于根，背光性随着距离增加更加明显
  // 调整系数，使其与标准光照方向有相同的影响力
  const scaleFactor =
    point.type === "stem"
      ? tropismFactor * Math.min(1.2, intensityFactor / 10)
      : tropismFactor * Math.min(0.6, intensityFactor / 20);

  // 茎向光源方向生长，根背光源方向生长
  return {
    x: nx * scaleFactor,
    y: ny * scaleFactor,
    z: nz * scaleFactor,
    intensity: intensityFactor,
  };
};

// 为新分支分配光照影响（只使用自定义光源）
export const assignInfluenceToNewBranch = (
  params: PlantParams,
  branchId: number,
  type: "stem" | "root",
  currentDay: number,
  customLights: CustomLightSource[] = []
): { lightDirection: LightDirectionOption; customLightId?: number } => {
  // 筛选出当前可用的自定义光源（当前天数 >= 光源启动日）
  const availableCustomLights = customLights.filter(
    (light) => currentDay >= light.startDay
  );

  // 如果没有可用的自定义光源，则默认使用顶部光照
  if (availableCustomLights.length === 0) {
    return { lightDirection: "+z" };
  }

  // 分支总数
  const branchCount = type === "stem" ? params.stemCount : params.rootCount;

  // 确保每个光源至少有一个分支
  if (branchCount >= availableCustomLights.length) {
    const customLightIndex = branchId % availableCustomLights.length;
    return {
      lightDirection: "+z", // 默认向上方向用于微重力等计算
      customLightId: availableCustomLights[customLightIndex].id,
    };
  } else {
    // 如果分支数小于光源数，则优先分配给前几个光源
    const maxIndex = Math.min(branchCount - 1, availableCustomLights.length - 1);
    const selection = branchId <= maxIndex ? branchId : branchId % availableCustomLights.length;
    return {
      lightDirection: "+z",
      customLightId: availableCustomLights[selection].id,
    };
  }
};

// 原来的函数现在弃用，保留接口兼容性
const assignLightDirectionToBranch = (
  params: PlantParams,
  branchId: number,
  totalBranches: number,
  type: "stem" | "root"
): LightDirectionOption => {
  // 由于移除了lightDirections，现在统一使用顶部光照
  return "+z";
};

// 计算微重力下根系的生长变化
const applyRootMicrogravityEffect = (
  offsets: { xOffset: number; yOffset: number; zOffset: number },
  params: PlantParams,
  branchId: number,
  lightDirection: LightDirectionOption
): { xOffset: number; yOffset: number; zOffset: number } => {
  const { exaggerationFactor } = params;

  // 根在微重力下如"水母触须"向各方向漂移
  const bendingAngle = (Math.PI / 180) * (45 + 30 * exaggerationFactor);
  const phaseOffset = (Math.PI * 2 * branchId) / params.rootCount; // 让不同分支有不同的初始角度

  // 随机生长方向，但保持一定的受光照方向影响
  const theta = bendingAngle * Math.sin(phaseOffset + Math.random() * Math.PI);
  const phi = 2 * Math.PI * Math.random(); // 随机方向角

  // 计算偏移量
  const varianceFactor = 0.5 + 0.5 * exaggerationFactor; // 根的随机生长扩散范围 [0,1]
  const magnitudeFactor = 0.3 + 0.7 * Math.random() * exaggerationFactor;

  // 增加随机波动，模拟水母触须效果
  offsets.xOffset +=
    Math.sin(theta) * Math.cos(phi) * varianceFactor * magnitudeFactor;
  offsets.yOffset +=
    Math.sin(theta) * Math.sin(phi) * varianceFactor * magnitudeFactor;

  // 保留一定的向下生长趋势，但受微重力影响减弱
  // 如果光源来自下方，则根会更倾向于向上生长（背光）
  if (lightDirection.includes("-z")) {
    offsets.zOffset = 0.4 * (1 - exaggerationFactor * 0.3); // 根向上生长
  } else {
    offsets.zOffset =
      -(0.3 + 0.4 * Math.random()) * (1 - exaggerationFactor * 0.3); // 根主要向下生长
  }

  return offsets;
};

// 计算微重力下茎的生长变化
const applyStemMicrogravityEffect = (
  offsets: { xOffset: number; yOffset: number; zOffset: number },
  params: PlantParams,
  branchId: number,
  day: number,
  lightDirection: LightDirectionOption
): { xOffset: number; yOffset: number; zOffset: number } => {
  const { exaggerationFactor } = params;

  // 支撑力下降
  const stiffnessFactor = 0.3 + 0.4 * (1 - exaggerationFactor);

  // 弯曲频次（形态不稳定）
  const bendingFrequency = 2 + 4 * exaggerationFactor;

  // 不同分支有不同的初始角度
  const phaseOffset = (Math.PI * 2 * branchId) / params.stemCount;

  // 计算当天的摇摆角度（模拟非直立摇摆）
  const dayFactor = day * 0.2;
  const wobbleX =
    Math.sin(dayFactor * bendingFrequency + phaseOffset) *
    (1 - stiffnessFactor) *
    0.3;
  const wobbleY =
    Math.cos(dayFactor * bendingFrequency + phaseOffset * 1.5) *
    (1 - stiffnessFactor) *
    0.3;

  // 应用摇摆效果
  offsets.xOffset += wobbleX * (1 + exaggerationFactor);
  offsets.yOffset += wobbleY * (1 + exaggerationFactor);

  // 茎可能徒长但姿态不稳定，受光照方向影响
  // 如果光照来自上方，茎会更倾向于垂直生长
  if (lightDirection.includes("+z")) {
    offsets.zOffset *= 1.5; // 更强的向上生长
  } else {
    offsets.zOffset *= 1.2; // 基础向上生长
  }

  return offsets;
};

// 安全计算下一个生长点
export const calculateNextGrowthPoint = (
  currentPoint: GrowthPoint,
  params: PlantParams,
  customLights: CustomLightSource[] = [],
  currentDay: number
): GrowthPoint => {
  const { type, branchId } = currentPoint;
  let xOffset = 0;
  let yOffset = 0;
  let zOffset = 0;

  // 计算基础生长率
  const baseGrowth = calculateGrowthRate(params, type, currentPoint);

  // 处理所有激活的光源的影响
  const activeLights = customLights.filter(light => currentDay >= light.startDay);
  
  if (activeLights.length > 0) {
    // 计算所有光源的综合影响
    let totalX = 0;
    let totalY = 0;
    let totalZ = 0;
    let totalIntensity = 0;

    activeLights.forEach(lightSource => {
      const direction = calculateDirectionFromLightSource(
        currentPoint,
        lightSource,
        currentDay
      );
      
      // 根据光源强度加权
      const weight = direction.intensity;
      totalX += direction.x * weight;
      totalY += direction.y * weight;
      totalZ += direction.z * weight;
      totalIntensity += weight;
    });

    // 如果有光源影响，计算平均方向
    if (totalIntensity > 0) {
      const avgX = totalX / totalIntensity;
      const avgY = totalY / totalIntensity;
      const avgZ = totalZ / totalIntensity;
      
      // 增强光照方向的影响
      xOffset = avgX * baseGrowth * 2.0;
      yOffset = avgY * baseGrowth * 2.0;
      zOffset = avgZ * baseGrowth * 2.0;
    } else {
      // 如果没有光源影响，使用默认向上/向下生长
      zOffset = type === "stem" ? baseGrowth * 1.2 : -baseGrowth * 1.2;
    }
  } else {
    // 处理标准光照方向
    const lightDirection = currentPoint.lightInfluence as LightDirectionOption;
    const offsets = calculateSingleLightDirectionEffect(
      baseGrowth,
      lightDirection,
      type
    );
    // 增强光照方向的影响
    xOffset = offsets.xOffset * 1.5;
    yOffset = offsets.yOffset * 1.5;
    zOffset = offsets.zOffset * 1.5;
  }

  // 增强辐射带来的扰动效果
  if (params.radiation > 0.5) {
    // 辐射强度越大，扰动越大
    const radiationFactor = Math.min(0.8, (params.radiation - 0.5) * 0.6); // 增加扰动范围
    
    // 添加随机扰动，但保持主要生长方向
    const randomFactor = Math.random() * radiationFactor;
    
    // 根据辐射强度调整扰动范围
    const maxOffset = 0.3 + radiationFactor * 0.4; // 最大扰动范围从0.3到0.7
    
    // 添加随机扰动
    xOffset += randomInRange(-maxOffset, maxOffset) * randomFactor * baseGrowth;
    yOffset += randomInRange(-maxOffset, maxOffset) * randomFactor * baseGrowth;
    zOffset += randomInRange(-maxOffset, maxOffset) * randomFactor * baseGrowth;
    
    // 在辐射强度较高时，增加生长的不稳定性
    if (params.radiation > 1.0) {
      const instabilityFactor = (params.radiation - 1.0) * 0.5;
      xOffset *= (1 + randomInRange(-instabilityFactor, instabilityFactor));
      yOffset *= (1 + randomInRange(-instabilityFactor, instabilityFactor));
      zOffset *= (1 + randomInRange(-instabilityFactor, instabilityFactor));
    }
  }

  if (params.radiation > 2.0) {
    console.log("高辐射导致生长停止");
    return currentPoint;
  }

  // 应用微重力效果
  if (params.microgravity) {
    const offsets = type === "stem"
      ? applyStemMicrogravityEffect(
          { xOffset, yOffset, zOffset },
          params,
          branchId,
          currentDay,
          currentPoint.lightInfluence as LightDirectionOption
        )
      : applyRootMicrogravityEffect(
          { xOffset, yOffset, zOffset },
          params,
          branchId,
          currentPoint.lightInfluence as LightDirectionOption
        );
    xOffset = offsets.xOffset;
    yOffset = offsets.yOffset;
    zOffset = offsets.zOffset;
  }

  const nextPoint = {
    x: currentPoint.x + xOffset,
    y: currentPoint.y + yOffset,
    z: currentPoint.z + zOffset,
    day: currentPoint.day + 1,
    type: currentPoint.type,
    branchId: currentPoint.branchId,
    lightInfluence: currentPoint.lightInfluence,
  };

  return nextPoint;
};

// 创建初始生长点（根系和茎系）
const createInitialPoints = (
  params: PlantParams,
  customLights: CustomLightSource[] = []
): GrowthPoint[] => {
  const points: GrowthPoint[] = [];

  // 为茎分配光照影响
  for (let i = 0; i < params.stemCount; i++) {
    const influence = assignInfluenceToNewBranch(
      params,
      i,
      "stem",
      0,
      customLights
    );

    // 构建光照影响标识符
    const lightInfluence =
      influence.customLightId !== undefined
        ? `custom:${influence.customLightId}` // 自定义光源格式
        : influence.lightDirection; // 标准方向格式

    points.push({
      x: randomInRange(-0.1, 0.1), // 轻微随机位置
      y: randomInRange(-0.1, 0.1),
      z: 0, // 从地面(z=0)开始
      day: 0,
      type: "stem",
      branchId: i,
      lightInfluence,
    });
  }

  // 创建根的初始点
  for (let i = 0; i < params.rootCount; i++) {
    const influence = assignInfluenceToNewBranch(
      params,
      i,
      "root",
      0,
      customLights
    );

    // 构建光照影响标识符
    const lightInfluence =
      influence.customLightId !== undefined
        ? `custom:${influence.customLightId}` // 自定义光源格式
        : influence.lightDirection; // 标准方向格式

    points.push({
      x: randomInRange(-0.1, 0.1), // 轻微随机位置
      y: randomInRange(-0.1, 0.1),
      z: 0, // 从地面(z=0)开始
      day: 0,
      type: "root",
      branchId: i,
      lightInfluence,
    });
  }

  return points;
};

// 生成所有生长点
export const generateGrowthPoints = (
  days: number,
  params: PlantParams,
  customLights: CustomLightSource[] = []
): GrowthPoint[] => {
  try {
    console.log("开始生成生长点，参数:", params);
    console.log("自定义光源:", customLights);

    // 创建初始点
    const initialPoints = createInitialPoints(params, customLights);
    const allBranches: GrowthPoint[] = [...initialPoints];

    // 为每个初始点分别生成生长路径
    for (const initialPoint of initialPoints) {
      let currentPoints = [initialPoint];

      // 逐天生成该分支的生长点
      for (let i = 0; i < days; i++) {
        const lastPoint = currentPoints[currentPoints.length - 1];
        const nextPoint = calculateNextGrowthPoint(
          lastPoint,
          params,
          customLights,
          lastPoint.day + 1
        );
        currentPoints.push(nextPoint);
        allBranches.push(nextPoint);
      }
    }

    // 按天数排序
    allBranches.sort((a, b) => a.day - b.day);

    console.log(
      `生成完成，共 ${allBranches.length} 个生长点，包含 ${params.stemCount} 个茎分支和 ${params.rootCount} 个根分支`
    );
    return allBranches;
  } catch (e) {
    console.error("生成生长点时出错:", e);

    // 出错时返回一个简单的默认生长序列
    const fallbackPoints: GrowthPoint[] = [];

    // 简单茎
    for (let i = 0; i <= days; i++) {
      fallbackPoints.push({
        x: 0,
        y: 0,
        z: i * 0.5,
        day: i,
        type: "stem",
        branchId: 0,
        lightInfluence: "+z",
      });
    }

    // 简单根
    for (let i = 0; i <= days; i++) {
      fallbackPoints.push({
        x: 0,
        y: 0,
        z: -i * 0.3,
        day: i,
        type: "root",
        branchId: 0,
        lightInfluence: "+z",
      });
    }

    console.log("使用备用生长点数据");
    return fallbackPoints;
  }
};
