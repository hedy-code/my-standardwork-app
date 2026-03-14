import { useState } from 'react';
import LeftPanel from './components/LeftPanel';
import RightChart from './components/RightChart';
import { useAuth } from './contexts/AuthContext';
import { useFirestore } from './hooks/useFirestore';
import type { ChartDocument } from './hooks/useFirestore';
import { HistoryModal } from './components/HistoryModal';

export interface TaskRow {
  id: string;
  sequence: number;
  name: string;
  manualTime: number | '';
  autoTime: number | '';
  walkTime: number | '';
}

function App() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { saveChart, loading } = useFirestore();
  
  const [currentChartId, setCurrentChartId] = useState<string | undefined>(undefined);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [workshopName, setWorkshopName] = useState('');
  const [processName, setProcessName] = useState('');
  
  // New Global Settings
  const [globalTimeUnit, setGlobalTimeUnit] = useState<'min' | 'sec'>('min');
  const [scaleValue, setScaleValue] = useState<number>(1);
  const [scaleUnit, setScaleUnit] = useState<'hour' | 'min' | 'sec'>('min');
  
  const [rows, setRows] = useState<TaskRow[]>([
    {
      id: crypto.randomUUID(),
      sequence: 1,
      name: '示例作业',
      manualTime: 120, // Stored in seconds now (120s = 2m)
      autoTime: '',
      walkTime: ''
    }
  ]);

  const addRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sequence: prev.length + 1,
        name: '',
        manualTime: '',
        autoTime: '',
        walkTime: ''
      }
    ]);
  };

  const updateRow = (id: string, updates: Partial<TaskRow>) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, ...updates } : row));
  };

  const deleteRow = (id: string) => {
    setRows(prev => {
      const remaining = prev.filter(row => row.id !== id);
      // Re-sequence
      return remaining.map((row, index) => ({ ...row, sequence: index + 1 }));
    });
  };

  const handleSave = async () => {
    const data = {
      workshopName,
      processName,
      globalTimeUnit,
      scaleValue,
      scaleUnit,
      rows
    };
    const savedId = await saveChart(data, currentChartId);
    if (savedId && !currentChartId) {
      setCurrentChartId(savedId);
      alert('保存成功！');
    } else if (savedId) {
      alert('已更新记录！');
    }
  };

  const handleSaveAs = async () => {
    const data = {
      workshopName: workshopName + ' (副本)',
      processName,
      globalTimeUnit,
      scaleValue,
      scaleUnit,
      rows
    };
    const savedId = await saveChart(data); // omits id, creating new
    if (savedId) {
      setCurrentChartId(savedId);
      setWorkshopName(data.workshopName);
      alert('另存为成功！');
    }
  };

  const handleLoad = (chart: ChartDocument) => {
    setCurrentChartId(chart.id);
    setWorkshopName(chart.workshopName || '');
    setProcessName(chart.processName || '');
    setGlobalTimeUnit(chart.globalTimeUnit || 'min');
    setScaleValue(chart.scaleValue || 1);
    setScaleUnit(chart.scaleUnit || 'min');
    
    // Ensure rows have required fields in case older schema
    const loadedRows = chart.rows ? chart.rows.map(r => ({
      id: r.id || crypto.randomUUID(),
      sequence: r.sequence || 1,
      name: r.name || '',
      manualTime: r.manualTime === undefined ? '' : r.manualTime,
      autoTime: r.autoTime === undefined ? '' : r.autoTime,
      walkTime: r.walkTime === undefined ? '' : r.walkTime
    })) : [];
    
    setRows(loadedRows.length > 0 ? loadedRows : [
      { id: crypto.randomUUID(), sequence: 1, name: '', manualTime: '', autoTime: '', walkTime: '' }
    ]);
    
    setIsHistoryModalOpen(false);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden text-sm">
      {isHistoryModalOpen && (
        <HistoryModal 
          onClose={() => setIsHistoryModalOpen(false)}
          onLoad={handleLoad}
          currentChartId={currentChartId}
        />
      )}
      {/* Global Header */}
      <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-gray-200 flex-shrink-0 z-30 relative shadow-sm">
        <div className="flex justify-between items-center mb-6 max-w-6xl mx-auto">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">标准作业组合表</h1>
          
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? '...' : (currentChartId ? '更新 保存' : '保存')}
                </button>
                <button
                  onClick={handleSaveAs}
                  disabled={loading || !currentChartId}
                  title="另存为不同表名"
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
                >
                  另存为
                </button>
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition"
                >
                  历史记录
                </button>
              
                <div className="flex items-center space-x-3 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 ml-4">
                  <img src={user.photoURL || ''} alt="User" className="w-6 h-6 rounded-full" />
                  <span className="text-sm font-medium text-slate-700">{user.displayName}</span>
                  <button 
                    onClick={signOut}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors ml-2"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 border border-slate-300 rounded-lg shadow-sm font-medium transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google 登录</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto items-end">
          <div className="flex flex-col space-y-1.5 min-w-[200px]">
            <label className="text-sm text-slate-500 font-semibold uppercase tracking-wider">车间名称</label>
            <input
              type="text"
              value={workshopName}
              onChange={(e) => setWorkshopName(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm font-medium text-slate-700 
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="输入车间名称"
            />
          </div>
          <div className="flex flex-col space-y-1.5 min-w-[200px]">
            <label className="text-sm text-slate-500 font-semibold uppercase tracking-wider">工程名称</label>
            <input
              type="text"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm font-medium text-slate-700 
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="输入工程名称"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-sm text-slate-500 font-semibold uppercase tracking-wider">时间单位</label>
            <div className="relative">
              <select
                value={globalTimeUnit}
                onChange={(e) => setGlobalTimeUnit(e.target.value as 'min' | 'sec')}
                className="w-full appearance-none pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-lg shadow-sm font-medium text-slate-700 
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="min">分</option>
                <option value="sec">秒</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-sm text-slate-500 font-semibold uppercase tracking-wider">图表分度 (1格=)</label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={scaleValue}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) setScaleValue(val);
                }}
                step="0.5"
                min="0.5"
                className="w-20 px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-center"
              />
              <div className="relative flex-1">
                <select
                  value={scaleUnit}
                  onChange={(e) => setScaleUnit(e.target.value as 'hour' | 'min' | 'sec')}
                  className="w-full appearance-none pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg shadow-sm font-medium text-slate-700 
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="hour">时</option>
                  <option value="min">分</option>
                  <option value="sec">秒</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Scroll Area */}
      <div className="flex-1 overflow-auto bg-slate-50 relative">
        <div className="flex min-w-max min-h-full">
          {/* Left Table Container */}
          <div className="w-[440px] lg:w-[490px] flex-shrink-0 sticky left-0 z-20 bg-white border-r border-slate-200 shadow-[2px_0_12px_-4px_rgba(0,0,0,0.1)]">
            <LeftPanel 
              rows={rows}
              globalTimeUnit={globalTimeUnit}
              onAddRow={addRow}
              onUpdateRow={updateRow}
              onDeleteRow={deleteRow}
            />
          </div>

          {/* Right Chart Container */}
          <div className="flex-1 bg-[#f8fafc]">
            <RightChart 
              rows={rows} 
              scaleValue={scaleValue}
              scaleUnit={scaleUnit}
              globalTimeUnit={globalTimeUnit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
