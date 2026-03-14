import React from 'react';
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
  
  const handleSecondsInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    rowId: string,
    field: keyof TaskRow
  ) => {
    const val = e.target.value;
    if (val === '') {
      onUpdateRow(rowId, { [field]: '' });
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      onUpdateRow(rowId, { [field]: num });
    }
  };

  const handleMinSecInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    rowId: string,
    field: keyof TaskRow,
    currentTotalSeconds: number | '',
    type: 'min' | 'sec'
  ) => {
    const val = e.target.value;
    const num = val === '' ? 0 : parseInt(val, 10);
    
    if (val !== '' && isNaN(num)) return;

    const currentSecs = currentTotalSeconds === '' ? 0 : currentTotalSeconds;
    const currentMin = Math.floor(currentSecs / 60);
    const currentRemainderSec = currentSecs % 60;

    let newTotalSeconds = 0;
    if (type === 'min') {
      newTotalSeconds = num * 60 + currentRemainderSec;
    } else {
      newTotalSeconds = currentMin * 60 + num;
    }

    // If both boxes would be empty/0 and the user cleared the input, maybe set to ''
    if (val === '' && newTotalSeconds === 0) {
        onUpdateRow(rowId, { [field]: '' });
    } else {
        onUpdateRow(rowId, { [field]: newTotalSeconds });
    }
  };

  const renderTimeInput = (row: TaskRow, field: keyof TaskRow) => {
    const totalSeconds = row[field] as number | '';
    
    if (globalTimeUnit === 'sec') {
      return (
        <input
          type="number"
          min="0"
          step="1"
          value={totalSeconds}
          onChange={(e) => handleSecondsInput(e, row.id, field)}
          className="w-full px-2 py-1 text-center bg-transparent border-b border-transparent hover:bg-white focus:bg-white focus:border-blue-500 focus:outline-none transition-colors rounded"
        />
      );
    }

    // Minute Mode (Min:Sec)
    const displayMin = totalSeconds === '' ? '' : Math.floor(totalSeconds / 60);
    const displaySec = totalSeconds === '' ? '' : totalSeconds % 60;

    return (
      <div className="flex items-center justify-center space-x-1 w-full px-1">
        <input
          type="number"
          min="0"
          step="1"
          value={displayMin}
          onChange={(e) => handleMinSecInput(e, row.id, field, totalSeconds, 'min')}
          className="w-10 text-center bg-transparent border-b border-transparent hover:bg-white focus:bg-white focus:border-blue-500 focus:outline-none transition-colors rounded appearance-none"
          placeholder="00"
        />
        <span className="text-slate-400 font-bold">:</span>
        <input
          type="number"
          min="0"
          step="1"
          value={displaySec}
          onChange={(e) => handleMinSecInput(e, row.id, field, totalSeconds, 'sec')}
          className="w-10 text-center bg-transparent border-b border-transparent hover:bg-white focus:bg-white focus:border-blue-500 focus:outline-none transition-colors rounded appearance-none"
          placeholder="00"
        />
      </div>
    );
  };

  const unitLabel = globalTimeUnit === 'min' ? '分:秒' : '秒';

  return (
    <div className="flex flex-col h-full bg-white z-20 relative">
      <div className="flex-1">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm border-b border-slate-200">
            <tr className="h-14">
              <th className="px-2 w-12 text-center text-slate-600 font-semibold">序号</th>
              <th className="px-2 text-slate-600 font-semibold">作业名称</th>
              <th className="px-2 w-[100px] text-center text-slate-600 font-semibold leading-tight">手动<br/><span className="text-[10px] font-normal text-slate-400 tracking-wider">{unitLabel}(必输)</span></th>
              <th className="px-2 w-[100px] text-center text-slate-600 font-semibold leading-tight">自动<br/><span className="text-[10px] font-normal text-slate-400 tracking-wider">{unitLabel}(选填)</span></th>
              <th className="px-2 w-[100px] text-center text-slate-600 font-semibold leading-tight">步行<br/><span className="text-[10px] font-normal text-slate-400 tracking-wider">{unitLabel}(选填)</span></th>
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
                  <div className="absolute top-[40px] left-1 right-1 z-10 bg-white/90 shadow-sm ring-1 ring-slate-200 rounded pointer-events-auto">
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
      
      <div className="p-4 border-t border-slate-100 mt-auto">
        <button
          onClick={onAddRow}
          className="flex items-center justify-center w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 font-medium rounded-xl transition-all shadow-sm active:scale-[0.99]"
        >
          <Plus size={20} className="mr-2" /> 增加一行数据
        </button>
      </div>
    </div>
  );
}
