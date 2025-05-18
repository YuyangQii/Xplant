export interface GrowthPoint {
  x: number;
  y: number;
  z: number;
  day: number;
}

export interface PlantParams {
  microgravity: boolean;
  radiation: number;
  redBlueRatio: number;
  lightIntensity: number;
  lightDirection: "top" | "left" | "angled";
  co2: number;
  temp: number;
  humidity: number;
}

export interface SimulationState {
  isPlaying: boolean;
  currentDay: number;
  growthPoints: GrowthPoint[];
  params: PlantParams;
}

export const DEFAULT_PARAMS: PlantParams = {
  microgravity: false,
  radiation: 0,
  redBlueRatio: 1.2,
  lightIntensity: 250,
  lightDirection: "top",
  co2: 800,
  temp: 23,
  humidity: 60,
};
