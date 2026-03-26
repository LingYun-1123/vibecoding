import { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays, startOfToday, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Triangle,
  ArrowLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyPlan, TimeBlock, TodoItem, AppState, ViewMode } from './types';
import { cn } from './lib/utils';

const STORAGE_KEY = 'quiet_planner_data';

const DEFAULT_TIME_BLOCKS = [
  "07:00–08:00", "08:00–09:00", "09:00–10:00", "10:00–11:00", 
  "11:00–12:00", "12:00–13:00", "13:00–14:00", "14:00–15:00",
  "15:00–16:00", "16:00–17:00", "17:00–18:00", "18:00–19:00",
  "19:00–20:00", "20:00–21:00", "21:00–22:00", "22:00–23:00"
];

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [currentDate, setCurrentDate] = useState(startOfToday());
  const [appState, setAppState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [displayLimit, setDisplayLimit] = useState(10);

  const dateKey = format(currentDate, 'yyyy-MM-dd');

  const currentPlan = useMemo(() => {
    if (appState[dateKey]) return appState[dateKey];
    
    // Initialize new plan
    return {
      date: dateKey,
      todos: [],
      plannedBlocks: DEFAULT_TIME_BLOCKS.map((time, i) => ({
        id: `p-${Date.now()}-${i}`,
        timeRange: time,
        taskName: '',
        duration: '',
        isDeepWork: false
      })),
      actualBlocks: DEFAULT_TIME_BLOCKS.map((time, i) => ({
        id: `a-${Date.now()}-${i}`,
        timeRange: time,
        taskName: '',
        duration: '',
        isDeepWork: false
      })),
      reflection: ''
    };
  }, [appState, dateKey]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  const updatePlan = (updates: Partial<DailyPlan>) => {
    setAppState(prev => ({
      ...prev,
      [dateKey]: { ...currentPlan, ...updates }
    }));
  };

  const handleDeletePlan = (key: string) => {
    const newState = { ...appState };
    delete newState[key];
    setAppState(newState);
  };

  const handleTodoToggle = (id: string) => {
    const newTodos = currentPlan.todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    updatePlan({ todos: newTodos });
  };

  const handleAddTodo = () => {
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: '',
      completed: false
    };
    updatePlan({ todos: [...currentPlan.todos, newTodo] });
  };

  const handleTodoChange = (id: string, text: string) => {
    const newTodos = currentPlan.todos.map(todo => 
      todo.id === id ? { ...todo, text } : todo
    );
    updatePlan({ todos: newTodos });
  };

  const handleRemoveTodo = (id: string) => {
    updatePlan({ todos: currentPlan.todos.filter(t => t.id !== id) });
  };

  const handleBlockChange = (type: 'planned' | 'actual', index: number, field: keyof TimeBlock, value: any) => {
    const blocksKey = type === 'planned' ? 'plannedBlocks' : 'actualBlocks';
    const newBlocks = [...currentPlan[blocksKey]];
    newBlocks[index] = { ...newBlocks[index], [field]: value };
    updatePlan({ [blocksKey]: newBlocks });
  };

  const handleAddTimeBlock = () => {
    const newId = Date.now().toString();
    const newPlanned: TimeBlock = { id: `p-${newId}`, timeRange: '00:00–00:00', taskName: '', duration: '', isDeepWork: false };
    const newActual: TimeBlock = { id: `a-${newId}`, timeRange: '00:00–00:00', taskName: '', duration: '', isDeepWork: false };
    updatePlan({ 
      plannedBlocks: [...currentPlan.plannedBlocks, newPlanned],
      actualBlocks: [...currentPlan.actualBlocks, newActual]
    });
  };

  const handleRemoveTimeBlock = (index: number) => {
    const newPlanned = currentPlan.plannedBlocks.filter((_, i) => i !== index);
    const newActual = currentPlan.actualBlocks.filter((_, i) => i !== index);
    updatePlan({ plannedBlocks: newPlanned, actualBlocks: newActual });
  };

  const sortedHistory = useMemo(() => {
    return Object.entries(appState)
      .sort(([a], [b]) => b.localeCompare(a));
  }, [appState]);

  const visibleHistory = sortedHistory.slice(0, displayLimit);

  if (viewMode === 'home') {
    return (
      <div className="min-h-screen py-12 px-4 flex flex-col items-center">
        <header className="max-w-[780px] w-full mb-12 text-center">
          <h1 className="font-serif text-5xl text-planner-ink mb-2 tracking-tight">静心计划 / Quiet Planner</h1>
          <p className="text-planner-secondary text-xs uppercase tracking-[0.3em] font-bold">每日仪式与反思</p>
        </header>

        <div className="max-w-[780px] w-full space-y-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-serif text-2xl">历史记录</h2>
            <button 
              onClick={() => {
                setCurrentDate(startOfToday());
                setViewMode('detail');
              }}
              className="bg-planner-accent text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-planner-accent/20 flex items-center gap-2"
            >
              <Plus size={16} />
              开始今日计划
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleHistory.map(([key, plan]) => (
              <motion.div 
                layout
                key={key}
                className="bg-white hairline-border p-6 hover:border-planner-accent transition-all group relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div onClick={() => { setCurrentDate(parseISO(key)); setViewMode('detail'); }} className="cursor-pointer flex-1">
                    <p className="font-serif text-xl group-hover:text-planner-accent transition-colors">
                      {format(parseISO(key), 'yyyy年MM月dd日', { locale: zhCN })}
                    </p>
                    <p className="text-xs text-planner-secondary uppercase tracking-widest">
                      {format(parseISO(key), 'EEEE', { locale: zhCN })}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeletePlan(key)}
                    className="text-planner-border hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="flex-1 h-1 bg-planner-bg rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-planner-accent transition-all duration-500"
                      style={{ width: `${plan.todos.length > 0 ? (plan.todos.filter(t => t.completed).length / plan.todos.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-planner-secondary uppercase">
                    {plan.todos.filter(t => t.completed).length}/{plan.todos.length} 任务完成
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {sortedHistory.length > displayLimit && (
            <div className="flex justify-center pt-8">
              <button 
                onClick={() => setDisplayLimit(prev => prev + 10)}
                className="text-planner-secondary hover:text-planner-accent text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
              >
                加载更多历史
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {sortedHistory.length === 0 && (
            <div className="text-center py-20 opacity-30">
              <CalendarIcon size={48} className="mx-auto mb-4" />
              <p className="font-serif italic text-xl">今日即是旅程的开始。</p>
            </div>
          )}
        </div>

        <footer className="mt-20 text-[10px] uppercase tracking-[0.3em] text-planner-secondary font-bold opacity-50">
          静心计划 &copy; {new Date().getFullYear()}
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 flex flex-col items-center">
      {/* Detail View Controls */}
      <div className="max-w-[780px] w-full flex justify-between items-center mb-8 text-planner-secondary">
        <button 
          onClick={() => setViewMode('home')}
          className="flex items-center gap-2 hover:text-planner-accent transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-xs uppercase tracking-widest font-medium">返回历史</span>
        </button>
        
        <div className="flex items-center gap-6">
          <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="hover:text-planner-accent">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(startOfToday())} className="text-xs uppercase tracking-widest font-bold hover:text-planner-accent">
            今天
          </button>
          <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="hover:text-planner-accent">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Main Planner Sheet */}
      <motion.main 
        key={dateKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-[780px] w-full bg-white shadow-[0_10px_40px_rgba(0,0,0,0.03)] hairline-border p-10 md:p-16 relative overflow-hidden"
      >
        {/* Date Stamp Header */}
        <header className="mb-12 border-b-2 border-planner-accent pb-4 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-5xl md:text-6xl text-planner-ink tracking-tight">
              {format(currentDate, 'M月d日', { locale: zhCN })}
            </h1>
            <p className="text-planner-accent font-serif italic text-xl mt-1">
              {format(currentDate, 'EEEE', { locale: zhCN })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-planner-secondary font-bold">年份</p>
            <p className="font-serif text-2xl">{format(currentDate, 'yyyy')}</p>
          </div>
        </header>

        {/* Todo Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-planner-secondary">待办事项 / To-do List</h2>
            <button 
              onClick={handleAddTodo}
              className="text-planner-accent hover:bg-planner-accent/5 p-1 rounded-full transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {currentPlan.todos.map(todo => (
              <div key={todo.id} className="group flex items-center gap-3">
                <button 
                  onClick={() => handleTodoToggle(todo.id)}
                  className="text-planner-accent flex-shrink-0"
                >
                  {todo.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </button>
                <input 
                  type="text"
                  value={todo.text}
                  onChange={(e) => handleTodoChange(todo.id, e.target.value)}
                  placeholder="新任务..."
                  className={cn(
                    "w-full bg-transparent border-none focus:ring-0 p-0 text-sm transition-all duration-300",
                    todo.completed && "text-planner-secondary line-through opacity-50"
                  )}
                />
                <button 
                  onClick={() => handleRemoveTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 text-planner-secondary hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {currentPlan.todos.length === 0 && (
              <p className="text-sm text-planner-secondary italic opacity-50">暂无任务。</p>
            )}
          </div>
        </section>

        {/* Planner Grid */}
        <section className="mb-12">
          <div className="grid grid-cols-2 gap-0 border-t hairline-border">
            <div className="p-4 border-r red-divider flex justify-between items-center">
              <h3 className="text-[10px] uppercase tracking-[0.15em] font-bold text-planner-secondary">计划完成 / Planned</h3>
              <button onClick={handleAddTimeBlock} className="text-planner-accent hover:bg-planner-accent/5 p-1 rounded-full"><Plus size={12} /></button>
            </div>
            <div className="p-4">
              <h3 className="text-[10px] uppercase tracking-[0.15em] font-bold text-planner-secondary text-center">实际完成 / Actual</h3>
            </div>
          </div>

          <div className="divide-y hairline-border border-b">
            {currentPlan.plannedBlocks.map((block, idx) => (
              <div key={block.id} className="grid grid-cols-2 group hover:bg-planner-bg/50 transition-colors relative">
                {/* Planned Column */}
                <div className={cn(
                  "flex items-center gap-2 p-2 border-r red-divider relative",
                  block.isDeepWork && "border-l-2 border-l-planner-accent"
                )}>
                  <input 
                    type="text"
                    value={block.timeRange}
                    onChange={(e) => handleBlockChange('planned', idx, 'timeRange', e.target.value)}
                    className="text-[9px] font-mono text-planner-secondary w-20 flex-shrink-0 bg-transparent border-none focus:ring-0 p-0"
                  />
                  <button 
                    onClick={() => handleBlockChange('planned', idx, 'isDeepWork', !block.isDeepWork)}
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      block.isDeepWork ? "text-planner-accent" : "text-planner-border hover:text-planner-secondary"
                    )}
                    title="深度工作"
                  >
                    <Triangle size={10} fill={block.isDeepWork ? "currentColor" : "none"} />
                  </button>
                  <input 
                    type="text"
                    value={block.taskName}
                    onChange={(e) => handleBlockChange('planned', idx, 'taskName', e.target.value)}
                    placeholder="..."
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs"
                  />
                </div>

                {/* Actual Column */}
                <div className="flex items-center gap-2 p-2 relative">
                  <input 
                    type="text"
                    value={currentPlan.actualBlocks[idx]?.taskName || ''}
                    onChange={(e) => handleBlockChange('actual', idx, 'taskName', e.target.value)}
                    placeholder="..."
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs"
                  />
                  <input 
                    type="text"
                    value={currentPlan.actualBlocks[idx]?.duration || ''}
                    onChange={(e) => handleBlockChange('actual', idx, 'duration', e.target.value)}
                    placeholder="分钟"
                    className="w-8 bg-transparent border-none focus:ring-0 p-0 text-[10px] text-right text-planner-secondary font-mono"
                  />
                  
                  {/* Row Delete Button */}
                  <button 
                    onClick={() => handleRemoveTimeBlock(idx)}
                    className="absolute right-[-24px] opacity-0 group-hover:opacity-100 text-planner-border hover:text-red-500 transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reflection Section */}
        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-planner-secondary mb-4">每日总结 / Daily Reflection</h2>
          <textarea 
            value={currentPlan.reflection}
            onChange={(e) => updatePlan({ reflection: e.target.value })}
            placeholder="在这里写下你的想法..."
            className="w-full h-32 bg-transparent border-none focus:ring-0 p-0 text-sm leading-relaxed resize-none font-serif italic"
          />
        </section>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
          <CalendarIcon size={120} />
        </div>
      </motion.main>

      <footer className="mt-12 text-[10px] uppercase tracking-[0.3em] text-planner-secondary font-bold opacity-50">
        静心计划 &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
