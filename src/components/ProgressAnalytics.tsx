import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FoodLogEntry, WeightRecord, UserProfile } from '../types';
import { kgToLbs, lbsToKg } from '../utils/nutritionCalculations';
import { TrendingUp, Plus, Calendar, Target, Scale } from 'lucide-react';

interface ProgressAnalyticsProps {
  profile: UserProfile;
  weights: WeightRecord[];
  logs: FoodLogEntry[];
  onAddWeight: (weightKg: number) => Promise<void>;
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({
  profile,
  weights,
  logs,
  onAddWeight,
}) => {
  const isImperial = profile.unitSystem === 'imperial';
  const [newWeightInput, setNewWeightInput] = useState<string>('');
  const [addingWeight, setAddingWeight] = useState(false);

  // Sort weights chronologically
  const sortedWeights = [...weights].sort((a, b) => a.timestamp - b.timestamp);
  const latestWeight = sortedWeights.length > 0 
    ? sortedWeights[sortedWeights.length - 1].weightKg 
    : profile.currentWeightKg;

  const currentDisplayWeight = isImperial ? kgToLbs(latestWeight) : latestWeight;
  const targetDisplayWeight = isImperial ? kgToLbs(profile.targetWeightKg) : profile.targetWeightKg;
  const unitLabel = isImperial ? 'lbs' : 'kg';

  // Last 7 days calorie adherence
  const getLast7DaysAdherence = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const weekday = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      
      const dayLogs = logs.filter(l => l.dateString === iso);
      const totalCal = dayLogs.reduce((acc, l) => acc + l.calories, 0);
      const target = profile.targetCalories || 2000;
      const ratio = target > 0 ? totalCal / target : 0;
      const diff = totalCal - target;

      list.push({
        iso,
        weekday,
        calories: totalCal,
        target,
        ratio,
        diff,
      });
    }
    return list;
  };

  const adherenceList = getLast7DaysAdherence();

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newWeightInput);
    if (!val || isNaN(val) || val <= 0) return;

    const kg = isImperial ? lbsToKg(val) : val;
    setAddingWeight(true);
    try {
      await onAddWeight(kg);
      setNewWeightInput('');
    } finally {
      setAddingWeight(false);
    }
  };

  // SVG Weight Line Chart calculations
  const chartPoints = sortedWeights.slice(-14); // up to last 14 entries
  const minW = chartPoints.length > 0 ? Math.min(...chartPoints.map(p => p.weightKg)) - 1 : 60;
  const maxW = chartPoints.length > 0 ? Math.max(...chartPoints.map(p => p.weightKg)) + 1 : 80;
  const rangeW = maxW - minW || 1;

  const chartWidth = 320;
  const chartHeight = 120;

  const polylineCoords = chartPoints.map((pt, idx) => {
    const x = chartPoints.length === 1 
      ? chartWidth / 2 
      : (idx / (chartPoints.length - 1)) * (chartWidth - 20) + 10;
    const y = chartHeight - ((pt.weightKg - minW) / rangeW) * (chartHeight - 30) - 15;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-6">
      {/* Weight Summary Card */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200/70 dark:border-neutral-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium block">
              Current Weight
            </span>
            <div className="text-4xl font-light text-neutral-900 dark:text-white mt-1">
              {currentDisplayWeight} <span className="text-lg text-neutral-400">{unitLabel}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium block">
              Goal
            </span>
            <div className="text-xl font-medium text-neutral-700 dark:text-neutral-300 mt-1">
              {targetDisplayWeight} {unitLabel}
            </div>
          </div>
        </div>

        {/* Weight over time SVG chart */}
        <div className="pt-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Weight History ({chartPoints.length} check-ins)</span>
            <span>Target: {targetDisplayWeight}{unitLabel}</span>
          </div>
          <div className="w-full bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl p-3 border border-neutral-100 dark:border-neutral-800/80">
            {chartPoints.length > 1 ? (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-28 overflow-visible">
                {/* Horizontal target guide line */}
                <line
                  x1="0"
                  y1={chartHeight - ((profile.targetWeightKg - minW) / rangeW) * (chartHeight - 30) - 15}
                  x2={chartWidth}
                  y2={chartHeight - ((profile.targetWeightKg - minW) / rangeW) * (chartHeight - 30) - 15}
                  stroke="#FF6B5B"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                  opacity="0.6"
                />
                {/* Weight line */}
                <polyline
                  fill="none"
                  stroke="#111111"
                  strokeWidth="2.5"
                  className="stroke-neutral-900 dark:stroke-white"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylineCoords}
                />
                {/* Plot points */}
                {chartPoints.map((pt, idx) => {
                  const x = (idx / (chartPoints.length - 1)) * (chartWidth - 20) + 10;
                  const y = chartHeight - ((pt.weightKg - minW) / rangeW) * (chartHeight - 30) - 15;
                  return (
                    <circle
                      key={pt.id}
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill="#FF6B5B"
                      className="ring-2 ring-white dark:ring-neutral-900"
                    />
                  );
                })}
              </svg>
            ) : (
              <div className="h-28 flex flex-col items-center justify-center text-xs text-neutral-400">
                Log at least two weight entries to generate trend line
              </div>
            )}
          </div>
        </div>

        {/* Quick Log Weight form */}
        <form onSubmit={handleWeightSubmit} className="pt-2 flex gap-2">
          <input
            type="number"
            step="0.1"
            placeholder={`Log new weight (${unitLabel})`}
            value={newWeightInput}
            onChange={(e) => setNewWeightInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/80 text-sm focus:outline-none focus:border-[#FF6B5B]"
          />
          <button
            type="submit"
            disabled={addingWeight || !newWeightInput}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {addingWeight ? 'Saving...' : 'Add Weight'}
          </button>
        </form>
      </div>

      {/* Calorie Adherence Chart (Past 7 Days) */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200/70 dark:border-neutral-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium block">
              Calorie Adherence
            </span>
            <div className="text-lg font-medium text-neutral-900 dark:text-white mt-0.5">
              Last 7 Days
            </div>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            Target: {profile.targetCalories} kcal
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2 items-end h-44">
          {adherenceList.map((day) => {
            const heightPercent = Math.min(100, Math.max(10, Math.round((day.calories / (profile.targetCalories * 1.3 || 2500)) * 100)));
            const isNearTarget = Math.abs(day.calories - profile.targetCalories) <= 150 && day.calories > 0;
            const isOver = day.calories > profile.targetCalories + 150;

            return (
              <div key={day.iso} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono">
                  {day.calories}
                </span>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-t-xl h-32 relative overflow-hidden flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ type: 'spring', damping: 20 }}
                    className={`w-full rounded-t-xl ${
                      day.calories === 0
                        ? 'bg-neutral-200 dark:bg-neutral-700'
                        : isNearTarget
                        ? 'bg-emerald-500'
                        : isOver
                        ? 'bg-[#FF6B5B]'
                        : 'bg-neutral-800 dark:bg-neutral-200'
                    }`}
                  />
                </div>
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mt-2">
                  {day.weekday}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 pt-3 text-[11px] text-neutral-400 border-t border-neutral-100 dark:border-neutral-800">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> On Target (±150 kcal)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B5B]" /> Over Target
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-800 dark:bg-neutral-200" /> Deficit
          </span>
        </div>
      </div>
    </div>
  );
};
