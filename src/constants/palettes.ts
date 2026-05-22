interface ThemeUI {
  primary: string;
  border: string;
  background: string;
  page: string;
  text: string;
}

export interface Theme {
  id: string;
  name: string;
  blockColors: string[];
  ui: ThemeUI;
}

export const THEMES: Theme[] = [
  {
    id: "coral",
    name: "Coral",
    blockColors: ["#FF6B6B", "#FF8E8E", "#FFB3B3", "#FFD6D6"],
    ui: {
      primary: "#FF6B6B",
      border: "#FFB3B3",
      background: "#FFF0F0",
      page: "#FFF8F8",
      text: "#CC3333",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    blockColors: ["#1A6B8A", "#2E8FAB", "#4DB6CC", "#89D4E3"],
    ui: {
      primary: "#2E8FAB",
      border: "#89D4E3",
      background: "#F0F9FF",
      page: "#F8FCFF",
      text: "#1A6B8A",
    },
  },
  {
    id: "forest",
    name: "Forest",
    blockColors: ["#2D6A4F", "#40916C", "#52B788", "#95D5B2"],
    ui: {
      primary: "#40916C",
      border: "#95D5B2",
      background: "#F0FDF4",
      page: "#F8FEFA",
      text: "#2D6A4F",
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    blockColors: ["#7C3AED", "#9F67F5", "#C4B5FD", "#DDD6FE"],
    ui: {
      primary: "#7C3AED",
      border: "#C4B5FD",
      background: "#F5F3FF",
      page: "#FAF9FF",
      text: "#5B21B6",
    },
  },
];
