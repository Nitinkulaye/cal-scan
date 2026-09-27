import React from 'react';
import { motion } from 'motion/react';

interface NutritionRingsProps {
  calorieTarget: number;
  calorieConsumed: number;
  proteinTarget: number;
  proteinConsumed: number;
  carbsTarget: number;
  carbsConsumed: number;
  fatTarget: number;
  fatConsumed: number;
}

export const NutritionRings: React.FC<NutritionRingsProps> = ({
  calorieTarget,
  calorieConsumed,
  proteinTarget,
  proteinConsumed,
  carbsTarget,
  carbsConsumed,
  fatTarget,
  fatConsumed,
}) => {
  const caloriesRemaining = Math.max(0, calorieTarget - calorieConsumed);
  const calPercent = calorieTarget > 0 ? Math.min(1.5, calorieConsumed / calorieTarget) : 0;
  const isOver = calorieConsumed > calorieTarget;

  // Primary Calorie Ring parameters
  const primaryRadius = 88;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * primaryRadius;
  const calStrokeOffset = circumference - Math.min(1, calPercent) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* Main Calorie Ring */}
      <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 210 210">
          {/* Background track */}
          <circle
            cx="105"
            cy="105"
            r={primaryRadius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-neutral-200 dark:text-neutral-800 transition-colors"
          />
          {/* Active progress track */}
          <motion.circle
            cx="105"
            cy="105"
            r={primaryRadius}
            stroke="#FF6B5B"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: calStrokeOffset }}
            transition={{ type: 'spring', damping: 24, stiffness: 90 }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
            {isOver ? 'Cal Over' : 'Remaining'}
          </span>
          <motion.span 
            key={caloriesRemaining}
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="text-4xl sm:text-5xl font-light tracking-tight text-neutral-900 dark:text-white mt-0.5"
          >
            {isOver ? Math.abs(calorieConsumed - calorieTarget) : caloriesRemaining}
          </motion.span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {calorieConsumed} / {calorieTarget} kcal
          </span>
        </div>
      </div>

      {/* 3 Macro Rings / Stats */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm mt-4 px-2">
        <MacroMiniCard
          label="Protein"
          current={proteinConsumed}
          target={proteinTarget}
          unit="g"
          ringColor="#3B82F6"
          bgColor="rgba(59, 130, 246, 0.1)"
        />
        <MacroMiniCard
          label="Carbs"
          current={carbsConsumed}
          target={carbsTarget}
          unit="g"
          ringColor="#10B981"
          bgColor="rgba(16, 185, 129, 0.1)"
        />
        <MacroMiniCard
          label="Fat"
          current={fatConsumed}
          target={fatTarget}
          unit="g"
          ringColor="#F59E0B"
          bgColor="rgba(245, 158, 11, 0.1)"
        />
      </div>
    </div>
  );
};

interface MacroMiniCardProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  ringColor: string;
  bgColor: string;
}

const MacroMiniCard: React.FC<MacroMiniCardProps> = ({ label, current, target, unit, ringColor, bgColor }) => {
  const percent = target > 0 ? Math.min(1.5, current / target) : 0;
  const radius = 22;
  const stroke = 4.5;
  const circ = 2 * Math.PI * radius;
  const strokeOffset = circ - Math.min(1, percent) * circ;

  return (
    <div className="flex flex-col items-center p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-neutral-200/60 dark:border-neutral-800/80 transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      <div className="relative w-14 h-14 flex items-center justify-center mb-1.5">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 54 54">
          <circle
            cx="27"
            cy="27"
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            className="text-neutral-200 dark:text-neutral-800"
          />
          <motion.circle
            cx="27"
            cy="27"
            r={radius}
            stroke={ringColor}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: strokeOffset }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
          {Math.round(percent * 100)}%
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ringColor }} />
        <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">{label}</span>
      </div>
      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
        {Math.round(current)}<span className="text-[10px] text-neutral-400 font-normal">/{target}{unit}</span>
      </span>
    </div>
  );
};
