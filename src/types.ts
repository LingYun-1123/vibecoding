export interface TimeBlock {
  id: string;
  timeRange: string;
  taskName: string;
  duration: string;
  isDeepWork: boolean;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyPlan {
  date: string; // ISO string (yyyy-MM-dd)
  todos: TodoItem[];
  plannedBlocks: TimeBlock[];
  actualBlocks: TimeBlock[];
  reflection: string;
}

export type AppState = Record<string, DailyPlan>;

export type ViewMode = 'home' | 'detail';
