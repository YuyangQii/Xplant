export interface CustomLightSource {
  id: number;
  x: number;
  y: number;
  z: number;
  intensity: number;
  startDay: number; // 光源开始照射的日期
}

export interface GrowthPoint {
  x: number;
  y: number;
  z: number;
  day: number;
  type: "stem" | "root"; // 生长点类型：茎或根
  branchId: number; // 分支ID，用于标识不同的生长路径
  lightInfluence?: string; // 记录该分支受哪个光源影响
}

export type LightDirectionOption =
  | "+x" // 右侧光源
  | "-x" // 左侧光源
  | "+y" // 前侧光源
  | "-y" // 后侧光源
  | "+z" // 顶部光源
  | "-z" // 底部光源
  | "+x+y" // 右前方
  | "+x-y" // 右后方
  | "-x+y" // 左前方
  | "-x-y" // 左后方
  | "+x+z" // 右上方
  | "+x-z" // 右下方
  | "-x+z" // 左上方
  | "-x-z" // 左下方
  | "+y+z" // 前上方
  | "+y-z" // 前下方
  | "-y+z" // 后上方
  | "-y-z"; // 后下方

export interface PlantParams {
  microgravity: boolean;
  exaggerationFactor: number; // 微重力效果的夸张因子，范围0-1
  radiation: number;
  redBlueRatio: number;
  lightIntensity: number;
  lightDirections: LightDirectionOption[]; // 多个光照方向
  co2: number;
  temp: number;
  humidity: number;
  stemCount: number; // 茎的数量
  rootCount: number; // 根的数量
}

export interface SimulationState {
  isPlaying: boolean;
  currentDay: number;
  growthPoints: GrowthPoint[];
  params: PlantParams;
}

export const DEFAULT_PARAMS: PlantParams = {
  microgravity: true, // 默认为微重力环境
  exaggerationFactor: 0.6, // 中等夸张效果
  radiation: 0.2, // 轻微辐射
  redBlueRatio: 1.2, // 略偏向红光
  lightIntensity: 300, // 较强光照
  lightDirections: ["-x"], // 默认从左侧照射
  co2: 1000, // 较高CO2浓度
  temp: 25, // 适宜温度
  humidity: 65, // 适宜湿度
  stemCount: 5, // 默认5个茎分支
  rootCount: 8, // 默认8个根分支
};
