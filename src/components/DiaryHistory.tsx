import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FoodLogEntry } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Barcode, 
  FileText,
  Utensils,
  Camera
} from 'lucide-react';

interface DiaryHistoryProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  logs: FoodLogEntry[];
  onDeleteLog: (id: string) => Promise<void>;
  onUpdateLog: (log: FoodLogEntry) => Promise<void>;
}

export const DiaryHistory: React.FC<DiaryHistoryProps> = ({
  selectedDate,
  onSelectDate,
  logs,
  onDeleteLog,
  onUpdateLog,
}) => {
  // Generate a 14-day calendar strip (7 days before, today, 6 days after)
  const [editingLog, setEditingLog] = useState<FoodLogEntry | null>(null);

  const getCalendarDays = () => {
    const days = [];
    const base = new Date();
    for (let i = -7; i <= 6; i++) {
      const d = new Date();
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      days.push({ iso, weekday, dayNum, isToday: i === 0 });
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const filteredLogs = logs.filter(l => l.dateString === selectedDate);

  // Group by meal
  const meals = [
    { type: 'breakfast', label: 'Breakfast' },
    { type: 'lunch', label: 'Lunch' },
    { type: 'dinner', label: 'Dinner' },
    { type: 'snack', label: 'Snacks' },
  ] as const;

  const totalDayCalories = filteredLogs.reduce((acc, l) => acc + l.calories, 0);
  const totalDayProtein = filteredLogs.reduce((acc, l) => acc + l.protein, 0);
  const totalDayCarbs = filteredLogs.reduce((acc, l) => acc + l.carbs, 0);
  const totalDayFat = filteredLogs.reduce((acc, l) => acc + l.fat, 0);

  return (
    <div className="space-y-6">
      {/* Calendar Strip */}
      <div className="bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-3xl border border-neutral-200/70 dark:border-neutral-800/80 shadow-xs">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
              Date
            </span>
            <button
              onClick={() => onSelectDate(new Date().toISOString().split('T')[0])}
              className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
            >
              Today
            </button>
          </div>
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 no-scrollbar">
          {calendarDays.map((d) => {
            const isSelected = d.iso === selectedDate;
            return (
              <button
                key={d.iso}
                onClick={() => onSelectDate(d.iso)}
                className={`flex flex-col items-center min-w-[44px] py-2.5 px-1.5 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-[#FF6B5B] text-white shadow-xs font-semibold'
                    : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span className="text-[10px] uppercase font-medium">{d.weekday}</span>
                <span className="text-sm mt-0.5">{d.dayNum}</span>
                {d.isToday && (
                  <span
                    className={`w-1 h-1 rounded-full mt-1 ${
                      isSelected ? 'bg-white' : 'bg-[#FF6B5B]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Summary Bar */}
      <div className="grid grid-cols-4 gap-2 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/80 text-center">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">Total</span>
          <span className="text-base font-semibold text-neutral-900 dark:text-white">
            {totalDayCalories}
          </span>
          <span className="text-[10px] text-neutral-400 block">kcal</span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">Protein</span>
          <span className="text-base font-semibold text-neutral-900 dark:text-white">
            {Math.round(totalDayProtein)}g
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">Carbs</span>
          <span className="text-base font-semibold text-neutral-900 dark:text-white">
            {Math.round(totalDayCarbs)}g
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">Fat</span>
          <span className="text-base font-semibold text-neutral-900 dark:text-white">
            {Math.round(totalDayFat)}g
          </span>
        </div>
      </div>

      {/* Meal Group Sections */}
      <div className="space-y-4">
        {meals.map((m) => {
          const items = filteredLogs.filter(l => l.mealType === m.type);
          const mealCalories = items.reduce((acc, l) => acc + l.calories, 0);

          return (
            <div
              key={m.type}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/80 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-700 dark:text-neutral-300">
                  {m.label}
                </span>
                <span className="text-xs font-mono font-medium text-neutral-500">
                  {mealCalories} kcal
                </span>
              </div>

              {items.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-400">
                  No foods logged for {m.label.toLowerCase()}
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {items.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition group"
                    >
                      <div className="flex items-center gap-3">
                        {log.photoThumbnail ? (
                          <img
                            src={log.photoThumbnail}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                            {log.source === 'photo' ? (
                              <Camera className="w-4 h-4 text-[#FF6B5B]" />
                            ) : log.source === 'barcode' ? (
                              <Barcode className="w-4 h-4" />
                            ) : (
                              <Utensils className="w-4 h-4" />
                            )}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-neutral-900 dark:text-white flex items-center gap-1.5">
                            {log.name}
                            {log.source === 'photo' && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-normal">
                                <Sparkles className="w-2.5 h-2.5 text-[#FF6B5B]" /> AI
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            {log.servingSize || '1 portion'} • P: {log.protein}g C: {log.carbs}g F: {log.fat}g
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {log.calories}
                          </span>
                          <span className="text-[10px] text-neutral-400 ml-1">kcal</span>
                        </div>

                        {/* Edit & Delete actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingLog(log)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="Edit entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteLog(log.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-500 transition rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 space-y-4 border border-neutral-200 dark:border-neutral-800 shadow-xl">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Edit Entry</h3>
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">Food Name</label>
              <input
                type="text"
                value={editingLog.name}
                onChange={(e) => setEditingLog({ ...editingLog, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">Calories (kcal)</label>
              <input
                type="number"
                value={editingLog.calories}
                onChange={(e) => setEditingLog({ ...editingLog, calories: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-sm font-semibold"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] uppercase text-neutral-400">Protein (g)</label>
                <input
                  type="number"
                  value={editingLog.protein}
                  onChange={(e) => setEditingLog({ ...editingLog, protein: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-neutral-400">Carbs (g)</label>
                <input
                  type="number"
                  value={editingLog.carbs}
                  onChange={(e) => setEditingLog({ ...editingLog, carbs: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-neutral-400">Fat (g)</label>
                <input
                  type="number"
                  value={editingLog.fat}
                  onChange={(e) => setEditingLog({ ...editingLog, fat: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onUpdateLog(editingLog);
                  setEditingLog(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-medium bg-[#FF6B5B] text-white hover:opacity-90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
