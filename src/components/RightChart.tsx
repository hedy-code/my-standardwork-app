import { useMemo } from 'react';
import type { TaskRow } from '../App';

interface RightChartProps {
  rows: TaskRow[];
  scaleValue: number;
  scaleUnit: 'hour' | 'min' | 'sec';
  globalTimeUnit: 'min' | 'sec';
}

export default function RightChart({ rows, scaleValue, scaleUnit, globalTimeUnit }: RightChartProps) {
  // Chart configurations
  const ROW_HEIGHT = 56; // Matches table row height exactly (h-14)
  const HEADER_HEIGHT = 56; // Matches left header exactly (h-14)
  const TICK_WIDTH = 20; // Width of 1 tick block in pixels
  const DEFAULT_MAX_TICKS = 60; // Max horizontal ticks displayed initially

  // Calculate scaling factor
  const secondsPerTick = useMemo(() => {
    switch (scaleUnit) {
      case 'hour': return scaleValue * 3600;
      case 'min': return scaleValue * 60;
      case 'sec': return scaleValue;
      default: return 60;
    }
  }, [scaleValue, scaleUnit]);

  // Calculate coordinates for blocks
  const chartData = useMemo(() => {
    let currentManualStartSeconds = 0;
    let lastAutoEndSeconds = 0;

    return rows.map((row) => {
      const manualTimeSec = Number(row.manualTime) || 0;
      const autoTimeSec = Number(row.autoTime) || 0;
      const walkTimeSec = Number(row.walkTime) || 0;

      // Solid line logic: starts at the end of the previous sequence
      const manualStartSec = currentManualStartSeconds;
      const manualEndSec = manualStartSec + manualTimeSec;

      // Dashed line logic: max of current manual end or last auto end
      const autoStartSec = Math.max(manualEndSec, lastAutoEndSeconds);
      const autoEndSec = autoStartSec + autoTimeSec;

      // Update trackers for next row calculation
      currentManualStartSeconds = manualEndSec + walkTimeSec;
      if (autoTimeSec > 0) {
        lastAutoEndSeconds = autoEndSec;
      }

      // Calculate pixel widths and offsets
      const manualStartPx = (manualStartSec / secondsPerTick) * TICK_WIDTH;
      const manualWidthPx = (manualTimeSec / secondsPerTick) * TICK_WIDTH;
      
      const autoStartPx = (autoStartSec / secondsPerTick) * TICK_WIDTH;
      const autoWidthPx = (autoTimeSec / secondsPerTick) * TICK_WIDTH;
      
      const walkStartPx = (manualEndSec / secondsPerTick) * TICK_WIDTH;
      const walkWidthPx = (walkTimeSec / secondsPerTick) * TICK_WIDTH;

      return {
        ...row,
        manualStartPx,
        manualWidthPx,
        autoStartPx,
        autoWidthPx,
        walkStartPx,
        walkWidthPx,
        manualTimeSec,
        autoTimeSec
      };
    });
  }, [rows, secondsPerTick]);

  // Determine chart width dynamically to fit all max values
  const maxCalculatedPixels = chartData.length > 0 ? 
    Math.max(
      ...chartData.map(d => d.autoStartPx + d.autoWidthPx), 
      ...chartData.map(d => d.manualStartPx + d.manualWidthPx + d.walkWidthPx)
    ) : 0;
  
  // Ensure we have at least DEFAULT_MAX_TICKS ticks, or round up calculated width to next 10 ticks (+10 buffer)
  const totalTicks = Math.max(DEFAULT_MAX_TICKS, Math.ceil(maxCalculatedPixels / TICK_WIDTH / 10) * 10 + 10);
  const chartWidth = totalTicks * TICK_WIDTH;

  const getUnitLabel = () => {
    if (scaleUnit === 'hour') return '时';
    if (scaleUnit === 'min') return '分';
    return '秒';
  };

  const unitLabel = getUnitLabel();

  // Helper to format tooltip time
  const formatTime = (totalSeconds: number) => {
    if (totalSeconds === 0) return '0';
    if (globalTimeUnit === 'sec') return `${totalSeconds}秒`;
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m > 0 && s > 0) return `${m}分${s}秒`;
    if (m > 0) return `${m}分钟`;
    return `${s}秒`;
  };

  return (
    <div className="relative h-full bg-[#f8fafc] select-none shadow-[inset_4px_0_24px_-12px_rgba(0,0,0,0.1)]" style={{ minWidth: '100%' }}>
      {/* Chart Header - Time Axis */}
      <div 
        className="sticky top-0 bg-slate-50 border-b border-slate-200 shadow-sm z-10 font-mono text-xs flex items-end pb-1"
        style={{ height: HEADER_HEIGHT, width: chartWidth }}
      >
        <div className="absolute font-bold text-slate-500 top-4 left-4 text-xs font-sans">
          作业时间 (1格={scaleValue}{unitLabel})
        </div>
        {/* Render horizontal axis ticks */}
        {Array.from({ length: totalTicks }).map((_, i) => (
          <div 
            key={i} 
            className="absolute bottom-0 border-l border-gray-300 h-2"
            style={{ left: i * TICK_WIDTH }}
          >
            {i % 10 === 0 && (
              <span className="absolute -top-5 -left-2 text-gray-400">
                {i * scaleValue}
              </span>
            )}
            {i % 5 === 0 && i % 10 !== 0 && (
              <span className="absolute -top-3 -left-1 text-[10px] text-gray-300">
                {i * scaleValue}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Chart Body - Grid and Bars */}
      <div className="relative" style={{ width: chartWidth, minHeight: `calc(100% - ${HEADER_HEIGHT}px)` }}>
        {/* Background Grid */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, transparent 55px, #f1f5f9 55px, #f1f5f9 56px)`,
            backgroundSize: `${TICK_WIDTH}px 100%, 100% 56px`
          }}
        />

        {/* SVG Connectors for Walk Time */}
        <svg 
          className="absolute inset-0 pointer-events-none z-0"
          style={{ width: chartWidth, height: chartData.length * ROW_HEIGHT }}
        >
          {chartData.map((data, index) => {
            if (data.walkWidthPx > 0) {
              const startX = data.manualStartPx + data.manualWidthPx;
              const startY = index * ROW_HEIGHT + ROW_HEIGHT / 2;
              
              const endX = startX + data.walkWidthPx;
              const endY = (index < chartData.length - 1) 
                ? ((index + 1) * ROW_HEIGHT + ROW_HEIGHT / 2) 
                : startY;

              const dx = endX - startX;
              const dy = endY - startY;

              let path = "";
              if (dy === 0) {
                // If it's the same row (e.g. last row loopback or placeholder)
                // Draw a simple horizontal wavy bump
                const bulgeX = Math.max(20, dx * 0.5);
                const bulgeY = 20;
                path = `M ${startX} ${startY} C ${startX + bulgeX} ${startY + bulgeY}, ${endX - bulgeX} ${startY - bulgeY}, ${endX} ${startY}`;
              } else {
                // Perfect S-Curve matching the paper drawing
                // The curve bulges right from the start point, creating a smooth wide sweep that crosses over.
                const bulge = Math.max(40, dx * 1.5 + 15);
                const cp1X = startX + bulge;
                const cp1Y = startY;
                const cp2X = endX - bulge;
                const cp2Y = endY;
                
                path = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
              }
              
              return (
                <path 
                  key={`walk-${data.id}`}
                  d={path}
                  fill="none"
                  stroke="#fb923c" // Orange 400
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            }
            return null;
          })}
        </svg>

        {/* Rows */}
        <div className="relative z-10">
          {chartData.map((data) => (
            <div 
              key={data.id} 
              className="relative border-b border-transparent group hover:bg-blue-50/50"
              style={{ height: ROW_HEIGHT }}
            >
              {/* Manual Time (Solid block) */}
              {data.manualWidthPx > 0 && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md rounded-md border border-indigo-700 transition-all duration-300 hover:brightness-110"
                  style={{ 
                    left: data.manualStartPx, 
                    width: data.manualWidthPx 
                  }}
                  title={`手动时间: ${formatTime(data.manualTimeSec)}`}
                />
              )}

              {/* Auto Time (Dashed block) */}
              {data.autoWidthPx > 0 && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 border-b-[2.5px] border-dashed border-rose-500 pointer-events-auto"
                  style={{ 
                    left: data.autoStartPx, 
                    width: data.autoWidthPx,
                    height: '2.5px'
                  }}
                  title={`自动时间: ${formatTime(data.autoTimeSec)}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
