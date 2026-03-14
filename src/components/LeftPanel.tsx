import React, { useState, useEffect } from 'react';
import type { TaskRow } from '../App';
import { Plus, Trash2 } from 'lucide-react';

interface LeftPanelProps {
  rows: TaskRow[];
  globalTimeUnit: 'min' | 'sec';
  onAddRow: () => void;
  onUpdateRow: (id: string, updates: Partial<TaskRow>) => void;
  onDeleteRow: (id: string) => void;
}

function TimeInputCell({
  rowId,
  field,
  totalSeconds,
  globalTimeUnit,
  onUpdateRow
}: {
  rowId: string;
  field: keyof TaskRow;
  totalSeconds: number | '';
  globalTimeUnit: 'min' | 'sec';
  onUpdateRow: (id: string, updates: Partial<TaskRow>) => void;
}) {
  const [minStr, setMinStr] = useState('');
  const [secStr, setSecStr] = useState('');

  // Sync standard values without overriding exact typed values if they are mathematically equal
  useEffect(() => {
    if (totalSeconds === '') {
      setMinStr('');
      setSecStr('');
    } else if (globalTimeUnit === 'sec') {
      setSecStr(totalSeconds.toString());
      setMinStr('');
    } else {
      const currentMath = Math.round((parseFloat(minStr || '0') * 60) + parseInt(secStr || '0', 10));
      if (currentMath !== totalSeconds) {
        setMinStr(Math.floor(totalSeconds / 60).toString());
        setSecStr((totalSeconds % 60).toString());
      }
    }
  }, [totalSeconds, globalTimeUnit, minStr, secStr]);

  if (globalTimeUnit === 'sec') {
    return (
      <div className="bg-white/90 shadow-sm ring-1 ring-slate-200 rounded mx-1">
        <input
          type="number"
          min="0"
          step="1"
          value={secStr}
          onChange={(e) => {
            const val = e.target.value;
            setSecStr(val);
            if (val === '') {
              onUpdateRow(rowId, { [field]: '' });
              return;
            }
            const num = parseInt(val, 10);
            if (!isNaN(num)) {
              onUpdateRow(rowId, { [field]: num });
            }
          }}
          className="w-full px-2 py-1 text-center bg-transparent border-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors rounded appearance-none no-spin"
          placeholder="0"
        />
      </div>
    );
  }

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMinStr(val);
    if (val === '') {
      const s = parseInt(secStr, 10);
      onUpdateRow(rowId, { [field]: isNaN(s) ? '' : s });
      return;
    }
    const m = parseFloat(val);
    if (!isNaN(m)) {
      const s = parseInt(secStr || '0', 10);
      onUpdateRow(rowId, { [field]: Math.round(m * 60) + (isNaN(s) ? 0 : s) });
    }
  };

  const handleSecChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    let s = parseInt(val, 10);
    
    // Auto carry-over logic: if >= 60, add to minutes
    if (!isNaN(s) && s >= 60) {
      let m = parseFloat(minStr || '0');
      if (isNaN(m)) m = 0;
      const extraM = Math.floor(s / 60);
      s = s % 60;
      m += extraM;
      setMinStr(m.toString());
      setSecStr(s.toString());
      onUpdateRow(rowId, { [field]: Math.round(m * 60) + s });
      return;
    }
    
    setSecStr(val);
    if (val === '') {
      const m = parseFloat(minStr);
      onUpdateRow(rowId, { [field]: isNaN(m) ? '' : Math.round(m * 60) });
      return;
    }
    
    if (!isNaN(s)) {
      const m = parseFloat(minStr || '0');
      onUpdateRow(rowId, { [field]: Math.round((isNaN(m) ? 0 : m) * 60) + s });
    }
  };

  return (
    <div className="flex items-center justify-center space-x-1 w-full px-1">
      <div className="bg-white/90 shadow-sm ring-1 ring-slate-200 rounded flex-1">
        <input
          type="number"
          min="0"
          step="0.1"
          value={minStr}
          onChange={handleMinChange}
          className="w-full text-center bg-transparent border-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors rounded appearance-none px-1 py-1 no-spin"
          placeholder="00"
        />
      </div>
      <span className="text-slate-400 font-bold">:</span>
      <div className="bg-white/90 shadow-sm ring-1 ring-slate-200 rounded flex-1">
        <input
          type="number"
          min="0"
          step="1"
          value={secStr}
          onChange={handleSecChange}
          className="w-full text-center bg-transparent border-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors rounded appearance-none px-1 py-1 no-spin"
          placeholder="00"
        />
      </div>
    </div>
  );
}

export default function LeftPanel({
  rows,
  globalTimeUnit,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
}: LeftPanelProps) {

  const unitLabel = globalTimeUnit === 'min' ? '分' : '秒';

  const totalManual = rows.reduce((acc, row) => acc + (Number(row.manualTime) || 0), 0);
  const totalAuto = rows.reduce((acc, row) => acc + (Number(row.autoTime) || 0), 0);
  const totalWalk = rows.reduce((acc, row) => acc + (Number(row.walkTime) || 0), 0);

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
              <th className="px-0 w-[105px] text-center text-slate-600 font-semibold leading-tight">手动<br/><span className="text-[10px] font-normal text-slate-400">({unitLabel})</span></th>
              <th className="px-0 w-[105px] text-center text-slate-600 font-semibold leading-tight">自动<br/><span className="text-[10px] font-normal text-slate-400">({unitLabel})</span></th>
              <th className="px-0 w-[105px] text-center text-slate-600 font-semibold leading-tight">步行<br/><span className="text-[10px] font-normal text-slate-400">({unitLabel})</span></th>
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
                <td className="px-0 text-center">
                  <TimeInputCell rowId={row.id} field="manualTime" totalSeconds={row.manualTime} globalTimeUnit={globalTimeUnit} onUpdateRow={onUpdateRow} />
                </td>
                <td className="px-0 text-center">
                  <TimeInputCell rowId={row.id} field="autoTime" totalSeconds={row.autoTime} globalTimeUnit={globalTimeUnit} onUpdateRow={onUpdateRow} />
                </td>
                <td className="px-0 text-center relative pointer-events-none">
                  <div className="absolute top-[40px] left-0 right-0 z-10 pointer-events-auto">
                    <TimeInputCell rowId={row.id} field="walkTime" totalSeconds={row.walkTime} globalTimeUnit={globalTimeUnit} onUpdateRow={onUpdateRow} />
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
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center bg-indigo-50/50 border border-indigo-100/50 rounded py-1.5">
            <span className="text-slate-500 text-[10px] font-bold mb-0.5">手动总计</span>
            <span className="font-mono text-indigo-600 font-bold tracking-wider text-sm">{formatHHMMSS(totalManual)}</span>
          </div>
          <div className="flex flex-col items-center bg-rose-50/50 border border-rose-100/50 rounded py-1.5">
            <span className="text-slate-500 text-[10px] font-bold mb-0.5">自动总计</span>
            <span className="font-mono text-rose-600 font-bold tracking-wider text-sm">{formatHHMMSS(totalAuto)}</span>
          </div>
          <div className="flex flex-col items-center bg-orange-50/50 border border-orange-100/50 rounded py-1.5">
            <span className="text-slate-500 text-[10px] font-bold mb-0.5">步行总计</span>
            <span className="font-mono text-orange-600 font-bold tracking-wider text-sm">{formatHHMMSS(totalWalk)}</span>
          </div>
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
