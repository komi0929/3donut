export const GRID_SIZE = 6;
export const TARGET_CLEARS = 50;
export const TIME_LIMIT = 30;

export const COLORS = {
  background: '#87CEEB',
  text: '#5D4037',
  primary: '#FF6347',
  secondary: '#FFD700',
  accent: '#D35400',
};

export const DONUT_COLORS = {
  STRAWBERRY: { base: '#FFB7B2', frosting: '#FF69B4', detail: '#FF1493', img: '/donut_strawberry.png' }, // Pink
  VANILLA:    { base: '#FFF8E7', frosting: '#FFFFFF', detail: '#E6C200', img: '/donut_vanilla.png' }, // White
  LEMON:      { base: '#FFFACD', frosting: '#FFD700', detail: '#FFA500', img: '/donut_lemon.png' }, // Yellow
  CHOCOLATE:  { base: '#D2691E', frosting: '#8B4513', detail: '#5D4037', img: '/donut_chocolate.png' }, // Brown
  MATCHA:     { base: '#90EE90', frosting: '#228B22', detail: '#006400', img: '/donut_matcha.png' }, // Green
  SODA:       { base: '#E0FFFF', frosting: '#00BFFF', detail: '#1E90FF', img: '/donut_soda.png' }, // Cyan
  GOLD:       { base: '#FFD700', frosting: '#FFD700', detail: '#DAA520', img: '/donut_gold.png' }, // Gold
  SILVER:     { base: '#C0C0C0', frosting: '#C0C0C0', detail: '#A9A9A9', img: '/donut_silver.png' }, // Silver
  RAINBOW:    { base: '#FFFFFF', frosting: 'linear-gradient(45deg, red, blue)', detail: '#FFF', img: '/donut_rainbow.png' }, // Rainbow
};

export const SPECIAL_SPAWN_RATES = {
  RAINBOW: 0.002,  // 10ゲームに1回
  GOLD:    0.004,  // 5ゲームに1回
  SILVER:  0.007,  // 3ゲームに1回
};

export const DONUT_PROMPTS = {
  STRAWBERRY: "A glossy pink strawberry donut with sprinkles",
  VANILLA:    "A classic white vanilla glazed donut",
  LEMON:      "A lemon glazed donut with zest",
  CHOCOLATE:  "A rich chocolate glazed donut with nuts",
  MATCHA:     "A green tea matcha donut with white chocolate drizzle",
  SODA:       "A blue soda flavored donut with fizz",
  GOLD:       "A shiny metallic gold donut",
  SILVER:     "A shiny metallic silver donut",
  RAINBOW:    "A rainbow colored psychedelic donut",
};

export const BACKGROUND_PROMPT = "A whimsical clay world sky with soft clouds";

export const getDonutPrompt = (type: string): string => {
  return DONUT_PROMPTS[type as keyof typeof DONUT_PROMPTS] || "A generic donut";
};