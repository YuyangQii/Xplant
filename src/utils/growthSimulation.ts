import { GrowthPoint, PlantParams, LightDirectionOption } from "../types/plant";

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
  type: "stem" | "root"
): number => {
  try {
    let rate = 1.0;
    const factors: Record<string, number> = {};

    // 辐射影响
    if (params.radiation > 0.5) {
      const radiationFactor = Math.max(0, 1 - (params.radiation - 0.5) * 0.1);
      rate *= radiationFactor;
      factors.radiation = radiationFactor;
    } else {
      factors.radiation = 1.0;
    }

    if (params.radiation > 1.5) {
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
      1.2,
      Math.max(0.5, params.lightIntensity / 250)
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

// 为新分支分配光照影响（自定义光源或标准方向）
export const assignInfluenceToNewBranch = (
  params: PlantParams,
  branchId: number,
  type: "stem" | "root",
  currentDay: number,
  customLights: CustomLightSource[] = []
): { lightDirection: LightDirectionOption; customLightId?: number } => {
  // 获取可用的光照方向
  const availableDirections = params.lightDirections;

  // 筛选出当前可用的自定义光源（当前天数 >= 光源启动日）
  const availableCustomLights = customLights.filter(
    (light) => currentDay >= light.startDay
  );

  // 创建总的影响源（标准方向 + 可用的自定义光源）
  const totalStandardDirections = availableDirections.length;
  const totalAvailableCustomLights = availableCustomLights.length;

  if (totalStandardDirections === 0 && totalAvailableCustomLights === 0) {
    // 如果没有光照方向和可用的自定义光源，则默认使用顶部光照
    return { lightDirection: "+z" };
  }

  // 分支总数
  const branchCount = type === "stem" ? params.stemCount : params.rootCount;

  // 确保每个光源至少有一个分支
  // 如果分支数大于等于影响源总数，使用循环分配保证每个光源至少有一个分支
  if (branchCount >= totalStandardDirections + totalAvailableCustomLights) {
    const totalInfluences =
      totalStandardDirections + totalAvailableCustomLights;
    const influenceIndex = branchId % totalInfluences;

    // 分配给标准光照方向
    if (influenceIndex < totalStandardDirections) {
      return {
        lightDirection: availableDirections[influenceIndex],
      };
    }
    // 分配给可用的自定义光源
    else {
      const customLightIndex = influenceIndex - totalStandardDirections;
      return {
        lightDirection: "+z", // 默认向上方向用于微重力等计算
        customLightId: availableCustomLights[customLightIndex].id,
      };
    }
  }
  // 如果分支数小于影响源总数，则优先分配给最重要的几个光源
  else {
    // 权重分配策略：可用的自定义光源优先，然后是基本光照方向
    const priorityList: { type: "standard" | "custom"; index: number }[] = [];

    // 先添加所有可用的自定义光源
    for (let i = 0; i < totalAvailableCustomLights; i++) {
      priorityList.push({ type: "custom", index: i });
    }

    // 再添加标准方向
    for (let i = 0; i < totalStandardDirections; i++) {
      priorityList.push({ type: "standard", index: i });
    }

    // 从优先列表中选择（如果优先列表超出分支数，只取前几个）
    const maxIndex = Math.min(branchCount - 1, priorityList.length - 1);
    const selection =
      branchId <= maxIndex
        ? priorityList[branchId]
        : priorityList[branchId % priorityList.length];

    if (selection.type === "standard") {
      return {
        lightDirection: availableDirections[selection.index],
      };
    } else {
      return {
        lightDirection: "+z",
        customLightId: availableCustomLights[selection.index].id,
      };
    }
  }
};

// 原来的函数现在弃用，保留接口兼容性
const assignLightDirectionToBranch = (
  params: PlantParams,
  branchId: number,
  totalBranches: number,
  type: "stem" | "root"
): LightDirectionOption => {
  // 获取可用的光照方向
  const availableDirections = params.lightDirections;

  if (availableDirections.length === 0) {
    // 如果没有光照方向，则默认使用顶部光照
    return "+z";
  } else if (availableDirections.length === 1) {
    // 如果只有一个光照方向，所有分支都使用该方向
    return availableDirections[0];
  } else {
    // 如果有多个光照方向，则平均分配
    // 对于茎，平均分配到不同方向，使植物向多个光源方向生长
    if (type === "stem") {
      // 循环分配光照方向
      const directionIndex = branchId % availableDirections.length;
      return availableDirections[directionIndex];
    } else {
      // 对于根，主要是背光生长，也平均分配以增加多样性
      const directionIndex = branchId % availableDirections.length;
      return availableDirections[directionIndex];
    }
  }
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
  currentDay: number = currentPoint.day
): GrowthPoint => {
  try {
    const type = currentPoint.type;
    const branchId = currentPoint.branchId;
    const growthRate = calculateGrowthRate(params, type);

    console.log(
      `[Day ${currentDay}, Branch ${branchId} (${type})] Calculating next point. Base growthRate: ${growthRate.toFixed(
        3
      )}`
    );

    const baseGrowth = type === "stem" ? 0.8 * growthRate : 0.6 * growthRate;
    let xOffset = 0,
      yOffset = 0,
      zOffset = 0;

    const activeCustomLights = customLights.filter(
      (light) => currentDay >= light.startDay
    );

    if (activeCustomLights.length > 0) {
      console.log(
        `  Active custom lights on day ${currentDay}: ${activeCustomLights
          .map((l) => l.id)
          .join(", ")}`
      );
      let totalEffectX = 0;
      let totalEffectY = 0;
      let totalEffectZ = 0;
      let totalIntensity = 0;

      for (const light of activeCustomLights) {
        console.log(
          `  Calculating effect of CustomLight ${light.id} (StartDay ${light.startDay}, Intensity ${light.intensity})`
        );
        const lightEffect = calculateDirectionFromLightSource(
          currentPoint,
          light,
          currentDay
        );
        totalEffectX += lightEffect.x;
        totalEffectY += lightEffect.y;
        totalEffectZ += lightEffect.z;
        totalIntensity += lightEffect.intensity;
        console.log(
          `    Light ${light.id} effect: x=${lightEffect.x.toFixed(
            3
          )}, y=${lightEffect.y.toFixed(3)}, z=${lightEffect.z.toFixed(
            3
          )}, intensity=${lightEffect.intensity.toFixed(3)}`
        );
      }

      const activationFactor = 3.0;
      xOffset = totalEffectX * activationFactor;
      yOffset = totalEffectY * activationFactor;
      zOffset = totalEffectZ * activationFactor;
      console.log(
        `  Total CustomLight Effect (after factor ${activationFactor}): x=${xOffset.toFixed(
          3
        )}, y=${yOffset.toFixed(3)}, z=${zOffset.toFixed(
          3
        )}, totalIntensitySum=${totalIntensity.toFixed(3)}`
      );
    } else {
      const standardLightDirection =
        currentPoint.lightInfluence &&
        !currentPoint.lightInfluence.startsWith("custom:")
          ? (currentPoint.lightInfluence as LightDirectionOption)
          : params.lightDirections[branchId % params.lightDirections.length] ||
            "+z";

      console.log(
        `  No active custom lights. Using StandardLight direction: ${standardLightDirection}`
      );
      const effect = calculateSingleLightDirectionEffect(
        growthRate * 1.2,
        standardLightDirection,
        type
      );
      xOffset = effect.xOffset;
      yOffset = effect.yOffset;
      zOffset = effect.zOffset;
      console.log(
        `    StandardLight Effect: x=${xOffset.toFixed(3)}, y=${yOffset.toFixed(
          3
        )}, z=${zOffset.toFixed(3)}`
      );
    }

    if (type === "stem") {
      if (params.redBlueRatio < 1) {
        const blueEffect = 2 - params.redBlueRatio;
        xOffset *= blueEffect;
        yOffset *= blueEffect;
        zOffset *= 0.8;
      } else {
        zOffset *= Math.min(1.3, params.redBlueRatio);
      }
      if (params.microgravity) {
        const { exaggerationFactor } = params;
        const stiffnessFactor = 0.3 + 0.4 * (1 - exaggerationFactor);
        const bendingFrequency = 2 + 4 * exaggerationFactor;
        const phaseOffset = (Math.PI * 2 * branchId) / params.stemCount;
        const dayFactor = currentDay * 0.2;
        const wobbleX =
          Math.sin(dayFactor * bendingFrequency + phaseOffset) *
          (1 - stiffnessFactor) *
          0.3;
        const wobbleY =
          Math.cos(dayFactor * bendingFrequency + phaseOffset * 1.5) *
          (1 - stiffnessFactor) *
          0.3;
        xOffset += wobbleX * (1 + exaggerationFactor);
        yOffset += wobbleY * (1 + exaggerationFactor);
        if (
          Math.abs(xOffset) < 0.1 &&
          Math.abs(yOffset) < 0.1 &&
          activeCustomLights.length === 0
        ) {
          zOffset +=
            baseGrowth *
            0.5 *
            (params.microgravity ? 1 + exaggerationFactor * 0.5 : 1);
        }
      } else {
        if (
          activeCustomLights.length === 0 &&
          (!params.lightDirections ||
            params.lightDirections.every((dir) => !dir.includes("z")))
        ) {
          zOffset += baseGrowth * 0.7;
        }
      }
    } else {
      // root
      if (params.redBlueRatio < 1) {
        const blueEffect = 1.5 - params.redBlueRatio * 0.5;
        xOffset *= blueEffect * 0.7;
        yOffset *= blueEffect * 0.7;
      }
      if (params.microgravity) {
        const { exaggerationFactor } = params;
        const bendingAngle = (Math.PI / 180) * (45 + 30 * exaggerationFactor);
        const phaseOffset = (Math.PI * 2 * branchId) / params.rootCount;
        const theta =
          bendingAngle * Math.sin(phaseOffset + Math.random() * Math.PI);
        const phi = 2 * Math.PI * Math.random();
        const varianceFactor = 0.5 + 0.5 * exaggerationFactor;
        const magnitudeFactor = 0.3 + 0.7 * Math.random() * exaggerationFactor;
        xOffset +=
          Math.sin(theta) * Math.cos(phi) * varianceFactor * magnitudeFactor;
        yOffset +=
          Math.sin(theta) * Math.sin(phi) * varianceFactor * magnitudeFactor;
        if (
          Math.abs(xOffset) < 0.1 &&
          Math.abs(yOffset) < 0.1 &&
          activeCustomLights.length === 0
        ) {
          zOffset -=
            baseGrowth *
            0.5 *
            (params.microgravity ? 1 + exaggerationFactor * 0.3 : 1);
        }
      } else {
        if (
          activeCustomLights.length === 0 &&
          (!params.lightDirections ||
            params.lightDirections.every((dir) => dir !== "-z"))
        ) {
          zOffset -= baseGrowth * 0.7;
        }
      }
    }

    xOffset += randomInRange(-0.05, 0.05);
    yOffset += randomInRange(-0.05, 0.05);
    const zDisturbance = type === "stem" ? 0.05 : 0.08;
    zOffset += randomInRange(-zDisturbance, zDisturbance);

    const nextPoint = {
      x: currentPoint.x + xOffset,
      y: currentPoint.y + yOffset,
      z: currentPoint.z + zOffset,
      day: currentPoint.day + 1,
      type: currentPoint.type,
      branchId: currentPoint.branchId,
      lightInfluence: currentPoint.lightInfluence,
    };
    console.log(
      `  New Point for Branch ${branchId}: x=${nextPoint.x.toFixed(
        3
      )}, y=${nextPoint.y.toFixed(3)}, z=${nextPoint.z.toFixed(3)} (Day ${
        nextPoint.day
      })`
    );

    if (isNaN(nextPoint.x) || !isFinite(nextPoint.x))
      nextPoint.x = currentPoint.x;
    if (isNaN(nextPoint.y) || !isFinite(nextPoint.y))
      nextPoint.y = currentPoint.y;
    if (isNaN(nextPoint.z) || !isFinite(nextPoint.z))
      nextPoint.z = currentPoint.z + (type === "stem" ? 0.5 : -0.5);

    return nextPoint;
  } catch (e) {
    const errorMessage = `计算下一个生长点时出错 (Branch ${currentPoint.branchId}, Day ${currentDay}):`;
    console.error(errorMessage, e);
    return {
      x: currentPoint.x,
      y: currentPoint.y,
      z: currentPoint.z + (currentPoint.type === "stem" ? 0.5 : -0.5),
      day: currentPoint.day + 1,
      type: currentPoint.type,
      branchId: currentPoint.branchId,
      lightInfluence: currentPoint.lightInfluence,
    };
  }
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
