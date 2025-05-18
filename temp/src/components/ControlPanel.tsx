import React from "react";
import {
  Box,
  Slider,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  styled,
} from "@mui/material";
import { PlantParams } from "../types/plant";

const StyledBox = styled(Box)({
  padding: "20px",
  width: "300px",
  backgroundColor: "#f5f5f5",
  borderRadius: "8px",
  "& > *": {
    marginBottom: "20px",
  },
});

interface ControlPanelProps {
  params: PlantParams;
  onParamsChange: (params: PlantParams) => void;
  onExport: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onParamsChange,
  onExport,
  isPlaying,
  onPlayPause,
  onReset,
}) => {
  const handleChange =
    (param: keyof PlantParams) =>
    (event: Event | React.SyntheticEvent, value: number | string | boolean) => {
      onParamsChange({
        ...params,
        [param]: value,
      });
    };

  return (
    <StyledBox>
      <Typography variant="h6">生长参数控制</Typography>

      <FormControlLabel
        control={
          <Switch
            checked={params.microgravity}
            onChange={handleChange("microgravity")}
          />
        }
        label="微重力环境"
      />

      <Box>
        <Typography gutterBottom>辐射强度 (Gy/day)</Typography>
        <Slider
          value={params.radiation}
          onChange={handleChange("radiation")}
          min={0}
          max={2}
          step={0.1}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box>
        <Typography gutterBottom>红蓝光比例</Typography>
        <Slider
          value={params.redBlueRatio}
          onChange={handleChange("redBlueRatio")}
          min={0.5}
          max={2}
          step={0.1}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box>
        <Typography gutterBottom>光照强度 (μmol/m²/s)</Typography>
        <Slider
          value={params.lightIntensity}
          onChange={handleChange("lightIntensity")}
          min={100}
          max={400}
          valueLabelDisplay="auto"
        />
      </Box>

      <FormControl fullWidth>
        <InputLabel>光照方向</InputLabel>
        <Select
          value={params.lightDirection}
          onChange={(e) => handleChange("lightDirection")(e, e.target.value)}
        >
          <MenuItem value="top">顶部</MenuItem>
          <MenuItem value="left">左侧</MenuItem>
          <MenuItem value="angled">斜向</MenuItem>
        </Select>
      </FormControl>

      <Box>
        <Typography gutterBottom>CO₂ 浓度 (ppm)</Typography>
        <Slider
          value={params.co2}
          onChange={handleChange("co2")}
          min={400}
          max={1500}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box>
        <Typography gutterBottom>温度 (°C)</Typography>
        <Slider
          value={params.temp}
          onChange={handleChange("temp")}
          min={15}
          max={35}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box>
        <Typography gutterBottom>湿度 (%RH)</Typography>
        <Slider
          value={params.humidity}
          onChange={handleChange("humidity")}
          min={20}
          max={90}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" onClick={onPlayPause}>
          {isPlaying ? "暂停" : "播放"}
        </Button>
        <Button variant="outlined" onClick={onReset}>
          重置
        </Button>
        <Button variant="outlined" onClick={onExport}>
          导出CSV
        </Button>
      </Box>
    </StyledBox>
  );
};

export default ControlPanel;
