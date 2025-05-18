import React, { useState } from "react";
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
  Grid,
  SelectChangeEvent,
  Paper,
  Radio,
  RadioGroup,
  FormLabel,
  TextField,
  CircularProgress,
  Checkbox,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import { styled as muiStyled } from "@mui/material/styles";
import { PlantParams, LightDirectionOption } from "../types/plant";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import LightbulbIcon from "@mui/icons-material/Lightbulb";

const StyledPaper = muiStyled(Paper)(({ theme }) => ({
  padding: "24px",
  borderRadius: "var(--radius-large)",
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  backdropFilter: "blur(10px)",
  boxShadow: "var(--shadow-medium)",
  border: "1px solid var(--border-color)",
  position: "relative",
  overflow: "hidden",
  animation: "fadeIn 0.5s ease-out",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "4px",
    background:
      "linear-gradient(90deg, var(--primary-color), var(--accent-color))",
  },
}));

const SectionTitle = muiStyled(Typography)(({ theme }) => ({
  fontSize: "1.1rem",
  fontWeight: 600,
  marginBottom: "16px",
  color: "var(--text-color)",
  display: "flex",
  alignItems: "center",
  "&::before": {
    content: '""',
    display: "inline-block",
    width: "12px",
    height: "12px",
    marginRight: "8px",
    background: "var(--primary-color)",
    borderRadius: "50%",
  },
}));

const ParameterLabel = muiStyled(Typography)({
  fontSize: "14px",
  fontWeight: 500,
  color: "var(--text-color)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  "& span": {
    color: "var(--primary-color)",
    fontSize: "13px",
    fontWeight: "600",
  },
});

const StyledSlider = muiStyled(Slider)(({ theme }) => ({
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
  "& .MuiSlider-rail": {
    opacity: 0.3,
  },
}));

const StyledSwitch = muiStyled(Switch)(({ theme }) => ({
  "& .MuiSwitch-switchBase": {
    "&.Mui-checked": {
      color: "#fff",
      "& + .MuiSwitch-track": {
        backgroundColor: "var(--primary-color)",
        opacity: 0.8,
      },
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "var(--shadow-small)",
  },
  "& .MuiSwitch-track": {
    borderRadius: 22 / 2,
  },
}));

const StyledSelect = muiStyled(Select)({
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--border-color)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--primary-color)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--primary-color)",
  },
  "& .MuiSelect-select": {
    padding: "10px 14px",
  },
});

const StyledFormControl = muiStyled(FormControl)({
  "& .MuiInputLabel-root": {
    color: "var(--text-secondary)",
    "&.Mui-focused": {
      color: "var(--primary-color)",
    },
  },
});

const ButtonsContainer = muiStyled(Box)({
  display: "flex",
  gap: "12px",
  marginTop: "8px",
});

const PrimaryButton = muiStyled(Button)(({ theme }) => ({
  backgroundColor: "var(--primary-color)",
  color: "#fff",
  fontWeight: 600,
  padding: "10px 24px",
  borderRadius: "var(--radius-small)",
  textTransform: "none",
  boxShadow: "var(--shadow-small)",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "var(--primary-dark)",
    transform: "translateY(-2px)",
    boxShadow: "var(--shadow-medium)",
  },
}));

const SecondaryButton = muiStyled(Button)(({ theme }) => ({
  backgroundColor: "transparent",
  color: "var(--primary-color)",
  fontWeight: 600,
  padding: "8px 16px",
  borderRadius: "var(--radius-small)",
  textTransform: "none",
  border: "1px solid var(--primary-color)",
  "&:hover": {
    backgroundColor: "rgba(99, 102, 241, 0.05)",
  },
}));

const ParameterSection = muiStyled("div")(({ theme }) => ({
  marginBottom: "24px",
  padding: "16px",
  backgroundColor: "rgba(250, 250, 250, 0.5)",
  borderRadius: "var(--radius-small)",
  border: "1px solid var(--border-color)",
}));

const SliderContainer = muiStyled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: "20px",
}));

const SliderLabel = muiStyled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "4px",
}));

const ParameterName = muiStyled(Typography)(({ theme }) => ({
  fontSize: "0.9rem",
  fontWeight: 500,
  color: "var(--text-color)",
}));

const ParameterValue = muiStyled(Typography)(({ theme }) => ({
  fontSize: "0.9rem",
  fontWeight: 600,
  color: "var(--primary-color)",
  backgroundColor: "rgba(99, 102, 241, 0.1)",
  padding: "2px 8px",
  borderRadius: "var(--radius-small)",
}));

const RadioButtonGroup = muiStyled(RadioGroup)(({ theme }) => ({
  "& .MuiFormControlLabel-root": {
    marginRight: "16px",
  },
  "& .MuiRadio-root": {
    color: "var(--text-light)",
    "&.Mui-checked": {
      color: "var(--primary-color)",
    },
  },
}));

// 光照方向选项分组
const lightDirectionGroups = [
  {
    label: "主轴方向",
    options: [
      { value: "+x" as LightDirectionOption, label: "右侧 (+X)" },
      { value: "-x" as LightDirectionOption, label: "左侧 (-X)" },
      { value: "+y" as LightDirectionOption, label: "前方 (+Y)" },
      { value: "-y" as LightDirectionOption, label: "后方 (-Y)" },
      { value: "+z" as LightDirectionOption, label: "上方 (+Z)" },
      { value: "-z" as LightDirectionOption, label: "下方 (-Z)" },
    ],
  },
  {
    label: "水平斜向",
    options: [
      { value: "+x+y" as LightDirectionOption, label: "右前 (+X+Y)" },
      { value: "+x-y" as LightDirectionOption, label: "右后 (+X-Y)" },
      { value: "-x+y" as LightDirectionOption, label: "左前 (-X+Y)" },
      { value: "-x-y" as LightDirectionOption, label: "左后 (-X-Y)" },
    ],
  },
  {
    label: "垂直斜向",
    options: [
      { value: "+x+z" as LightDirectionOption, label: "右上 (+X+Z)" },
      { value: "+x-z" as LightDirectionOption, label: "右下 (+X-Z)" },
      { value: "-x+z" as LightDirectionOption, label: "左上 (-X+Z)" },
      { value: "-x-z" as LightDirectionOption, label: "左下 (-X-Z)" },
      { value: "+y+z" as LightDirectionOption, label: "前上 (+Y+Z)" },
      { value: "+y-z" as LightDirectionOption, label: "前下 (+Y-Z)" },
      { value: "-y+z" as LightDirectionOption, label: "后上 (-Y+Z)" },
      { value: "-y-z" as LightDirectionOption, label: "后下 (-Y-Z)" },
    ],
  },
];

// 自定义光源组件接口
interface CustomLightSource {
  id: number;
  x: number;
  y: number;
  z: number;
  intensity: number;
  startDay: number; // 光源开始照射的日期
}

interface ControlPanelProps {
  params: PlantParams;
  onParamsChange: (params: PlantParams) => void;
  onExport: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onGenerateClick: () => void;
  isGenerating: boolean;
  onCustomLightsChange?: (lights: CustomLightSource[]) => void;
}

const ControlGroup = muiStyled(Box)(({ theme }) => ({
  backgroundColor: "#ffffff",
  borderRadius: "var(--radius-medium)",
  padding: "16px",
  marginBottom: "20px",
  boxShadow: "var(--shadow-light)",
  border: "1px solid var(--border-color)",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    boxShadow: "var(--shadow-medium)",
  },
}));

const ControlTitle = muiStyled(Typography)(({ theme }) => ({
  fontSize: "16px",
  fontWeight: 600,
  marginBottom: "12px",
  color: "var(--text-color)",
  display: "flex",
  alignItems: "center",
  "&::before": {
    content: '""',
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "var(--primary-color)",
    marginRight: "8px",
  },
}));

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onParamsChange,
  onExport,
  isPlaying,
  onPlayPause,
  onReset,
  onGenerateClick,
  isGenerating,
  onCustomLightsChange,
}) => {
  // 自定义光源状态
  const [customLightSources, setCustomLightSources] = useState<
    CustomLightSource[]
  >([]);
  const [nextLightId, setNextLightId] = useState(1);
  const [showCustomLightPanel, setShowCustomLightPanel] = useState(false);

  // 处理光照方向变化
  const handleDirectionChange = (
    option: LightDirectionOption,
    isChecked: boolean
  ) => {
    let newDirections = [...params.lightDirections];

    if (isChecked && !newDirections.includes(option)) {
      newDirections.push(option);
    } else if (!isChecked) {
      newDirections = newDirections.filter((dir) => dir !== option);
    }

    // 确保至少保留一个光照方向
    if (newDirections.length === 0) {
      return;
    }

    onParamsChange({
      ...params,
      lightDirections: newDirections,
    });
  };

  // 处理数值类型参数变化
  const handleNumberChange =
    (param: keyof PlantParams) =>
    (_event: Event, newValue: number | number[]) => {
      const value = Array.isArray(newValue) ? newValue[0] : newValue;
      onParamsChange({
        ...params,
        [param]: value,
      });
    };

  // 处理布尔类型参数变化
  const handleBooleanChange =
    (param: keyof PlantParams) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onParamsChange({
        ...params,
        [param]: event.target.checked,
      });
    };

  // 添加自定义光源
  const addCustomLightSource = () => {
    const newLight: CustomLightSource = {
      id: nextLightId,
      x: 0,
      y: 0,
      z: 5,
      intensity: 100,
      startDay: 0,
    };
    setCustomLightSources([...customLightSources, newLight]);
    setNextLightId(nextLightId + 1);
  };

  // 更新自定义光源参数
  const updateCustomLightSource = (
    id: number,
    param: keyof CustomLightSource,
    value: number
  ) => {
    const updatedLights = customLightSources.map((light) => {
      if (light.id === id) {
        return { ...light, [param]: value };
      }
      return light;
    });
    setCustomLightSources(updatedLights);
  };

  // 删除自定义光源
  const removeCustomLightSource = (id: number) => {
    setCustomLightSources(
      customLightSources.filter((light) => light.id !== id)
    );
  };

  // 应用自定义光源到生长模型
  const applyCustomLightSources = () => {
    // 通知父组件自定义光源已更新
    if (onCustomLightsChange) {
      // 记录当前是否有启动日相关的变化
      const hasStartDayChanges = customLightSources.some(
        (light) => light.startDay > 0
      );

      // 标记日志信息
      console.log(`应用自定义光源设置，含启动日设置: ${hasStartDayChanges}`);
      console.log("应用的光源:", customLightSources);

      // 触发父组件更新
      onCustomLightsChange(customLightSources);
    }
  };

  return (
    <StyledPaper elevation={3}>
      <SectionTitle variant="h6">环境参数控制</SectionTitle>

      <ControlGroup>
        <ControlTitle variant="h3">操作</ControlTitle>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Button
              variant="contained"
              fullWidth
              onClick={onPlayPause}
              sx={{
                backgroundColor: "var(--primary-color)",
                "&:hover": { backgroundColor: "var(--primary-dark)" },
                textTransform: "none",
                borderRadius: "var(--radius-small)",
                fontWeight: 600,
              }}
            >
              {isPlaying ? "暂停" : "播放"}
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="outlined"
              fullWidth
              onClick={onReset}
              sx={{
                color: "var(--primary-color)",
                borderColor: "var(--primary-color)",
                "&:hover": {
                  borderColor: "var(--primary-dark)",
                  backgroundColor: "rgba(99, 102, 241, 0.04)",
                },
                textTransform: "none",
                borderRadius: "var(--radius-small)",
                fontWeight: 600,
              }}
            >
              重置
            </Button>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          fullWidth
          onClick={onGenerateClick}
          disabled={isGenerating}
          sx={{
            backgroundColor: "var(--accent-color)",
            "&:hover": { backgroundColor: "var(--accent-dark)" },
            textTransform: "none",
            borderRadius: "var(--radius-small)",
            fontWeight: 600,
            mb: 2,
          }}
          startIcon={
            isGenerating ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {isGenerating ? "生成中..." : "生成新模拟"}
        </Button>

        <Button
          variant="outlined"
          fullWidth
          onClick={onExport}
          sx={{
            color: "var(--text-color)",
            borderColor: "var(--border-color)",
            "&:hover": {
              borderColor: "var(--text-color)",
              backgroundColor: "rgba(0, 0, 0, 0.02)",
            },
            textTransform: "none",
            borderRadius: "var(--radius-small)",
            fontWeight: 500,
          }}
        >
          导出CSV数据
        </Button>
      </ControlGroup>

      <ControlGroup>
        <ControlTitle variant="h3">重力环境</ControlTitle>
        <FormControlLabel
          control={
            <Switch
              checked={params.microgravity}
              onChange={handleBooleanChange("microgravity")}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">微重力环境（太空站模拟）</Typography>
          }
          sx={{ width: "100%", mb: 2 }}
        />

        <Typography variant="body2" gutterBottom>
          微重力效果强度
        </Typography>
        <StyledSlider
          value={params.exaggerationFactor}
          onChange={handleNumberChange("exaggerationFactor")}
          valueLabelDisplay="auto"
          step={0.1}
          marks
          min={0}
          max={1}
          disabled={!params.microgravity}
          valueLabelFormat={(value) => `${value.toFixed(1)}`}
        />
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ mt: 0.5, display: "block" }}
        >
          值越大，微重力效果越明显
        </Typography>
      </ControlGroup>

      <ControlGroup>
        <ControlTitle variant="h3">生长结构</ControlTitle>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" gutterBottom>
              茎数量
            </Typography>
            <StyledSlider
              value={params.stemCount}
              onChange={handleNumberChange("stemCount")}
              valueLabelDisplay="auto"
              step={1}
              marks
              min={1}
              max={8}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" gutterBottom>
              根数量
            </Typography>
            <StyledSlider
              value={params.rootCount}
              onChange={handleNumberChange("rootCount")}
              valueLabelDisplay="auto"
              step={1}
              marks
              min={1}
              max={12}
            />
          </Grid>
        </Grid>
      </ControlGroup>

      <ControlGroup>
        <ControlTitle variant="h3">光照条件</ControlTitle>

        <Typography variant="body2" gutterBottom sx={{ mb: 1 }}>
          光照方向（可多选）
        </Typography>

        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            坐标系说明：X轴(左右)、Y轴(前后)、Z轴(上下)，"+"表示正方向，"-"表示负方向
          </Typography>
        </Box>

        <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="caption" fontWeight="bold">
            主轴方向
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {[
              { value: "+x" as LightDirectionOption, label: "+X (右侧)" },
              { value: "-x" as LightDirectionOption, label: "-X (左侧)" },
              { value: "+y" as LightDirectionOption, label: "+Y (前方)" },
              { value: "-y" as LightDirectionOption, label: "-Y (后方)" },
              { value: "+z" as LightDirectionOption, label: "+Z (上方)" },
              { value: "-z" as LightDirectionOption, label: "-Z (下方)" },
            ].map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    size="small"
                    checked={params.lightDirections.includes(option.value)}
                    onChange={(e) =>
                      handleDirectionChange(option.value, e.target.checked)
                    }
                  />
                }
                label={option.label}
                sx={{
                  "& .MuiFormControlLabel-label": {
                    fontSize: "0.85rem",
                    color: "var(--text-color)",
                  },
                }}
              />
            ))}
          </Box>

          <Typography variant="caption" fontWeight="bold" sx={{ mt: 1 }}>
            对角线方向
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {[
              { value: "+x+z" as LightDirectionOption, label: "+X+Z (右上)" },
              { value: "-x+z" as LightDirectionOption, label: "-X+Z (左上)" },
              { value: "+y+z" as LightDirectionOption, label: "+Y+Z (前上)" },
              { value: "-y+z" as LightDirectionOption, label: "-Y+Z (后上)" },
              { value: "+x+y" as LightDirectionOption, label: "+X+Y (右前)" },
              { value: "-x+y" as LightDirectionOption, label: "-X+Y (左前)" },
              { value: "+x-y" as LightDirectionOption, label: "+X-Y (右后)" },
              { value: "-x-y" as LightDirectionOption, label: "-X-Y (左后)" },
            ].map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    size="small"
                    checked={params.lightDirections.includes(option.value)}
                    onChange={(e) =>
                      handleDirectionChange(option.value, e.target.checked)
                    }
                  />
                }
                label={option.label}
                sx={{
                  "& .MuiFormControlLabel-label": {
                    fontSize: "0.85rem",
                    color: "var(--text-color)",
                  },
                }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: 3, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              自定义光源位置
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LightbulbIcon />}
              onClick={() => setShowCustomLightPanel(!showCustomLightPanel)}
              sx={{
                textTransform: "none",
                borderRadius: "var(--radius-small)",
                fontSize: "0.8rem",
              }}
            >
              {showCustomLightPanel ? "隐藏光源面板" : "添加自定义光源"}
            </Button>
          </Box>

          {showCustomLightPanel && (
            <Box
              sx={{
                p: 2,
                mb: 2,
                borderRadius: "var(--radius-small)",
                bgcolor: "rgba(245, 158, 11, 0.05)",
                border: "1px dashed var(--accent-color)",
              }}
            >
              <Typography variant="caption" sx={{ display: "block", mb: 2 }}>
                自定义光源与标准光照方向具有相同的影响力，植物会按照设定的光源方向生长
              </Typography>

              {customLightSources.map((light) => (
                <Box
                  key={light.id}
                  sx={{
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-small)",
                    padding: "16px",
                    mb: 2,
                    position: "relative",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, fontWeight: 600 }}
                  >
                    光源 #{light.id}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <ParameterLabel>
                        X 坐标 <span>{light.x.toFixed(1)}</span>
                      </ParameterLabel>
                      <StyledSlider
                        value={light.x}
                        min={-10}
                        max={10}
                        step={0.5}
                        onChange={(e, val) =>
                          updateCustomLightSource(light.id, "x", val as number)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ParameterLabel>
                        Y 坐标 <span>{light.y.toFixed(1)}</span>
                      </ParameterLabel>
                      <StyledSlider
                        value={light.y}
                        min={-10}
                        max={10}
                        step={0.5}
                        onChange={(e, val) =>
                          updateCustomLightSource(light.id, "y", val as number)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ParameterLabel>
                        Z 坐标 <span>{light.z.toFixed(1)}</span>
                      </ParameterLabel>
                      <StyledSlider
                        value={light.z}
                        min={-10}
                        max={10}
                        step={0.5}
                        onChange={(e, val) =>
                          updateCustomLightSource(light.id, "z", val as number)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ParameterLabel>
                        光强 <span>{light.intensity}</span>
                      </ParameterLabel>
                      <StyledSlider
                        value={light.intensity}
                        min={50}
                        max={500}
                        step={10}
                        onChange={(e, val) =>
                          updateCustomLightSource(
                            light.id,
                            "intensity",
                            val as number
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ParameterLabel>
                        开始日期 <span>{light.startDay}</span>
                      </ParameterLabel>
                      <StyledSlider
                        value={light.startDay}
                        min={0}
                        max={30}
                        step={1}
                        onChange={(e, val) =>
                          updateCustomLightSource(
                            light.id,
                            "startDay",
                            val as number
                          )
                        }
                      />
                    </Grid>
                  </Grid>
                  <IconButton
                    size="small"
                    onClick={() => removeCustomLightSource(light.id)}
                    sx={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      color: "var(--error-color)",
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addCustomLightSource}
                  sx={{
                    textTransform: "none",
                    borderRadius: "var(--radius-small)",
                  }}
                >
                  添加光源
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  onClick={applyCustomLightSources}
                  disabled={customLightSources.length === 0}
                  sx={{
                    textTransform: "none",
                    borderRadius: "var(--radius-small)",
                    bgcolor: "var(--accent-color)",
                    "&:hover": {
                      bgcolor: "var(--accent-dark)",
                    },
                  }}
                >
                  应用光源设置
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        <Typography variant="body2" gutterBottom>
          光照强度 (Lux)
        </Typography>
        <StyledSlider
          value={params.lightIntensity}
          onChange={handleNumberChange("lightIntensity")}
          valueLabelDisplay="auto"
          step={10}
          min={50}
          max={500}
          valueLabelFormat={(value) => `${value} lux`}
        />

        <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
          红蓝光比例
        </Typography>
        <StyledSlider
          value={params.redBlueRatio}
          onChange={handleNumberChange("redBlueRatio")}
          valueLabelDisplay="auto"
          step={0.1}
          min={0.5}
          max={2}
          marks={[
            { value: 0.5, label: "蓝光" },
            { value: 1, label: "平衡" },
            { value: 2, label: "红光" },
          ]}
          valueLabelFormat={(value) => `${value.toFixed(1)}`}
        />
      </ControlGroup>

      <ControlGroup>
        <ControlTitle variant="h3">环境条件</ControlTitle>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" gutterBottom>
              温度 (°C)
            </Typography>
            <StyledSlider
              value={params.temp}
              onChange={handleNumberChange("temp")}
              valueLabelDisplay="auto"
              step={1}
              min={10}
              max={35}
              valueLabelFormat={(value) => `${value}°C`}
            />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" gutterBottom>
              湿度 (%)
            </Typography>
            <StyledSlider
              value={params.humidity}
              onChange={handleNumberChange("humidity")}
              valueLabelDisplay="auto"
              step={5}
              min={20}
              max={90}
              valueLabelFormat={(value) => `${value}%`}
            />
          </Grid>
        </Grid>

        <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
          CO₂ 浓度 (ppm)
        </Typography>
        <StyledSlider
          value={params.co2}
          onChange={handleNumberChange("co2")}
          valueLabelDisplay="auto"
          step={50}
          min={400}
          max={1500}
          valueLabelFormat={(value) => `${value} ppm`}
        />

        <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
          辐射强度 (相对单位)
        </Typography>
        <StyledSlider
          value={params.radiation}
          onChange={handleNumberChange("radiation")}
          valueLabelDisplay="auto"
          step={0.1}
          min={0}
          max={2}
          marks={[
            { value: 0, label: "无" },
            { value: 1, label: "中等" },
            { value: 2, label: "高" },
          ]}
          valueLabelFormat={(value) => value.toFixed(1)}
        />
      </ControlGroup>
    </StyledPaper>
  );
};

export default ControlPanel;
