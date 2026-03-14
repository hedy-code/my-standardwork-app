import React, { useEffect, useState } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import type { ChartDocument } from '../hooks/useFirestore';

interface HistoryModalProps {
  onClose: () => void;
  onLoad: (chart: ChartDocument) => void;
  currentChartId?: string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onClose, onLoad, currentChartId }) => {
  const { loadCharts, deleteChart, loading, error } = useFirestore();
  const [charts, setCharts] = useState<ChartDocument[]>([]);

  useEffect(() => {
    fetchCharts();
  }, []);

  const fetchCharts = async () => {
    const data = await loadCharts();
    setCharts(data);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这条记录吗？')) {
      await deleteChart(id);
      await fetchCharts();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">历史记录</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          {loading && charts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">加载中...</div>
          ) : error ? (
            <div className="text-center py-12 text-rose-500">{error}</div>
          ) : charts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center">
              <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              暂无保存的记录
            </div>
          ) : (
            <div className="grid gap-3">
              {charts.map((chart) => {
                const isCurrent = chart.id === currentChartId;
                const d = chart.updatedAt?.toDate ? chart.updatedAt.toDate() : new Date();
                const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                return (
                  <div 
                    key={chart.id}
                    className={`
                      relative group flex flex-col p-4 rounded-xl border transition-all cursor-pointer
                      ${isCurrent ? 'border-blue-400 bg-blue-50/50 shadow-inner' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'}
                    `}
                    onClick={() => onLoad(chart)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 text-base">{chart.workshopName || '未命名车间'}</h3>
                      <button 
                        onClick={(e) => chart.id && handleDelete(chart.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                        title="删除记录"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex text-xs text-slate-500 space-x-4">
                      <span className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {chart.processName || '-'}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        {chart.rows?.length || 0} 道工序
                      </span>
                      <span className="flex items-center ml-auto bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        {dateStr}
                      </span>
                    </div>
                    
                    {isCurrent && (
                      <div className="absolute top-0 right-0 -mt-2 -mr-2">
                        <div className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          当前使用中
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-white">
          <p className="text-xs text-slate-500 text-center">点击记录加载，或点击右上角删除图标进行删除</p>
        </div>
      </div>
    </div>
  );
};
