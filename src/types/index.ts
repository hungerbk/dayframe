export interface TimeBlock {
  id: string
  startTime: string
  endTime: string
  title?: string
  color: string
}

export interface ThemeUI {
  primary: string
  border: string
  background: string
  text: string
}

export interface Theme {
  name: string
  blockColors: string[]
  ui: ThemeUI
}
