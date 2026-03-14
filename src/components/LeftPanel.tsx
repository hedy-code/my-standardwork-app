
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
    
    let displayValue: number | string = '';
    if (totalSeconds !== '') {
      if (globalTimeUnit === 'min') {
        const valInMin = totalSeconds / 60;
        displayValue = Number(valInMin.toFixed(1));
      } else {
        displayValue = totalSeconds;
      }
    }

    return (
      <div className="bg-white/90 shadow-sm ring-1 ring-slate-200 rounded mx-1">
        <input
          type="number"
          min="0"
          step={globalTimeUnit === 'min' ? "0.1" : "1"}
          value={displayValue}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
               onUpdateRow(row.id, { [field]: '' });
               return;
            }
            const num = parseFloat(val);
            if (!isNaN(num)) {
              if (globalTimeUnit === 'min') {
                onUpdateRow(row.id, { [field]: Math.round(num * 60) });
              } else {
                onUpdateRow(row.id, { [field]: Math.round(num) });
              }
            }
          }}
          className="w-full px-2 py-1 text-center bg-transparent border-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors rounded appearance-none"
          placeholder="0"
        />
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
