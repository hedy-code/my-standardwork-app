
import type { TaskRow } from '../App';
import { Plus, Trash2 } from 'lucide-react';

interface LeftPanelProps {
  rows: TaskRow[];
  globalTimeUnit: 'min' | 'sec';
  onAddRow: () => void;
  onUpdateRow: (id: string, updates: Partial<TaskRow>) => void;
  onDeleteRow: (id: string) => void;
}

export default function LeftPanel({
  rows,
  globalTimeUnit,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
}: LeftPanelProps) {
  
  const renderTimeInput = (row: TaskRow, field: keyof TaskRow) => {
    const totalSeconds = row[field] as number | '';
    
    if (globalTimeUnit === 'sec') {
      return (
        <div className="bg-white/90 shadow-sm ring-1 ring-slate-200 rounded mx-1">
          <input
            type="number"
            min="0"
            step="1"
            value={totalSeconds}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                onUpdateRow(row.id, { [field]: '' });
                return;
              }
              const num = parseInt(val, 10);
              if (!isNaN(num)) {
                onUpdateRow(row.id, { [field]: num });
              }
            }}
            className="w-full px-2 py-1 text-center bg-transparent border-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors rounded appearance-none"
            placeholder="0"
          />
        </div>
      );
    }

    // Minute Mode (Min:Sec Boxes)
    let displayMin: number | string = '';
    let displaySec: number | string = '';
    
    if (totalSeconds !== '') {
      displayMin = Math.floor(totalSeconds / 60);
      displaySec = totalSeconds % 60;
    }

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '') {
        // If minutes are cleared but seconds exist, just store the seconds
        if (displaySec !== '') {
           onUpdateRow(row.id, { [field]: Number(displaySec) });
        } else {
           onUpdateRow(row.id, { [field]: '' });
        }
        return;
      }
      const m = parseFloat(val);
      if (!isNaN(m)) {
        const s = displaySec !== '' ? Number(displaySec) : 0;
        onUpdateRow(row.id, { [field]: Math.round(m * 60) + s });
      }
    };

    const handleSecChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '') {
        if (displayMin !== '') {
           onUpdateRow(row.id, { [field]: Math.round(Number(displayMin) * 60) });
        } else {
           onUpdateRow(row.id, { [field]: '' });
        }
        return;
      }
      
      let s = parseInt(val, 10);
      if (!isNaN(s)) {
        let m = displayMin !== '' ? Number(displayMin) : 0;
        
        // Auto carry-over logic: if > 59 or 60, add to minutes
        if (s >= 60) {
          const extraMins = Math.floor(s / 60);
          s = s % 60;
          m += extraMins;
        }
        
        onUpdateRow(row.id, { [field]: Math.round(m * 60) + s });
      }
    };

    return (
      <div className="flex items-center justify-center space-x-1 w-full px-1">
        <div className="bg-white/90 shadow-sm ring-1 ring-slate-200 rounded flex-1">
          <input
            type="number"
            min="0"
            step="0.1"
            value={displayMin === 0 && displaySec === '' ? '' : displayMin}
            onChange={handleMinChange}
            className="w-full text-center bg-transparent border-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors rounded appearance-none px-1 py-1"
            placeholder="00"
          />
        </div>
        <span className="text-slate-400 font-bold">:</span>
        <div className="bg-white/90 shadow-sm ring-1 ring-slate-200 rounded flex-1">
          <input
            type="number"
            min="0"
            step="1"
            value={displaySec === 0 && displayMin === '' ? '' : (displaySec !== '' ? displaySec.toString().padStart(2, '0') : '')}
            onChange={handleSecChange}
            className="w-full text-center bg-transparent border-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors rounded appearance-none px-1 py-1"
            placeholder="00"
          />
        </div>
      </div>
    );
  };

  const unitLabel = globalTimeUnit === 'min' ? '分' : '秒';

  const totalSecondsAll = rows.reduce((acc, row) => 
    acc + (Number(row.manualTime) || 0) + (Number(row.autoTime) || 0) + (Number(row.walkTime) || 0), 0);

  const formatHHMMSS = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-white z-20 relative">
      <div className="flex-1">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm border-b border-slate-200">
            <tr className="h-14">
              <th className="px-1 w-10 text-center text-slate-600 font-semibold">序号</th>
              <th className="px-2 text-slate-600 font-semibold">作业名称</th>
              <th className="px-1 w-[70px] text-center text-slate-600 font-semibold leading-tight">手动<br/><span className="text-[10px] font-normal text-slate-400">({unitLabel})</span></th>
              <th className="px-1 w-[70px] text-center text-slate-600 font-semibold leading-tight">自动<br/><span className="text-[10px] font-normal text-slate-400">({unitLabel})</span></th>
              <th className="px-1 w-[70px] text-center text-slate-600 font-semibold leading-tight">步行<br/><span className="text-[10px] font-normal text-slate-400">({unitLabel})</span></th>
              <th className="px-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="h-14 border-b border-slate-100 hover:bg-indigo-50/40 group transition-colors duration-200">
                <td className="px-2 text-center text-slate-500 font-medium">{row.sequence}</td>
                <td className="px-2">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => onUpdateRow(row.id, { name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-transparent border border-transparent rounded focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all placeholder:text-slate-300"
                    placeholder="作业内容..."
                  />
                </td>
                <td className="px-1 text-center">
                  {renderTimeInput(row, 'manualTime')}
                </td>
                <td className="px-1 text-center">
                  {renderTimeInput(row, 'autoTime')}
                </td>
                <td className="px-1 text-center relative pointer-events-none">
                  <div className="absolute top-[40px] left-0 right-0 z-10 pointer-events-auto">
                    {renderTimeInput(row, 'walkTime')}
                  </div>
                </td>
                <td className="px-2 text-center">
                  <button
                    onClick={() => onDeleteRow(row.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-50 active:scale-95"
                    title="删除行"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-slate-100 mt-auto flex flex-col space-y-3 bg-slate-50">
        <div className="flex justify-between items-center px-2">
          <span className="text-slate-600 font-bold">总计时间</span>
          <span className="font-mono text-indigo-600 text-xl font-black tracking-wider">
            {formatHHMMSS(totalSecondsAll)}
          </span>
        </div>
        <button
          onClick={onAddRow}
          className="flex items-center justify-center w-full py-2.5 border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 font-medium rounded-xl transition-all shadow-sm active:scale-[0.99]"
        >
          <Plus size={20} className="mr-2" /> 增加一行数据
        </button>
      </div>
    </div>
  );
}
