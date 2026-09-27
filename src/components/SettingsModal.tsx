import React, { useState } from 'react';
import { UserProfile, FoodLogEntry, WeightRecord } from '../types';
import { 
  Sliders, 
  Bell, 
  Download, 
  Trash2, 
  FileText, 
  Shield, 
  AlertTriangle, 
  Check, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { calculateDietTargets } from '../utils/nutritionCalculations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  logs: FoodLogEntry[];
  weights: WeightRecord[];
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  onDeleteAccountAndData: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  logs,
  weights,
  onUpdateProfile,
  onDeleteAccountAndData,
}) => {
  const [activeLegalModal, setActiveLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Editable settings
  const [targetCalories, setTargetCalories] = useState(profile.targetCalories);
  const [targetProtein, setTargetProtein] = useState(profile.targetProteinGrams);
  const [targetCarbs, setTargetCarbs] = useState(profile.targetCarbsGrams);
  const [targetFat, setTargetFat] = useState(profile.targetFatGrams);
  const [unitSystem, setUnitSystem] = useState(profile.unitSystem);
  const [keepPhotos, setKeepPhotos] = useState(profile.keepFoodPhotos || false);
  const [notifications, setNotifications] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveSettings = async () => {
    await onUpdateProfile({
      targetCalories,
      targetProteinGrams: targetProtein,
      targetCarbsGrams: targetCarbs,
      targetFatGrams: targetFat,
      unitSystem,
      keepFoodPhotos: keepPhotos,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Data Export as JSON
  const handleExportData = () => {
    const exportPayload = {
      exportTimestamp: new Date().toISOString(),
      app: 'Cal Scan',
      version: '1.0.0-beta',
      user: {
        uid: profile.uid,
        goal: profile.goal,
        sex: profile.sex,
        age: profile.age,
        heightCm: profile.heightCm,
        currentWeightKg: profile.currentWeightKg,
        targetWeightKg: profile.targetWeightKg,
        targetCalories: profile.targetCalories,
        targetMacros: {
          proteinGrams: profile.targetProteinGrams,
          carbsGrams: profile.targetCarbsGrams,
          fatGrams: profile.targetFatGrams,
        },
        healthConsentGiven: profile.healthConsentGiven,
        healthConsentDate: profile.healthConsentDate,
      },
      weightsCount: weights.length,
      weights,
      logsCount: logs.length,
      logs,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cal_scan_data_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExecuteDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    try {
      setIsDeleting(true);
      await onDeleteAccountAndData();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#FAFAFA] dark:bg-[#111111] rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-medium text-neutral-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition"
          >
            Done
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Permanent Medical Disclaimer Banner */}
          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
            <Info className="w-5 h-5 text-[#FF6B5B] shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <span className="font-semibold text-neutral-900 dark:text-white block mb-0.5">
                Clinical Notice
              </span>
              Cal Scan provides estimates for informational purposes only and is not a substitute for professional medical or dietary advice.
            </div>
          </div>

          {/* Section 1: Target Adjustment */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                Daily Nutrition Targets
              </h3>
              {savedSuccess && (
                <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-semibold bg-transparent focus:outline-none text-neutral-900 dark:text-white"
                />
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={targetProtein}
                  onChange={(e) => setTargetProtein(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-semibold bg-transparent focus:outline-none text-neutral-900 dark:text-white"
                />
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={targetCarbs}
                  onChange={(e) => setTargetCarbs(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-semibold bg-transparent focus:outline-none text-neutral-900 dark:text-white"
                />
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <label className="text-[10px] uppercase text-neutral-400 block mb-1">Fat (g)</label>
                <input
                  type="number"
                  value={targetFat}
                  onChange={(e) => setTargetFat(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-semibold bg-transparent focus:outline-none text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition"
            >
              Update Targets
            </button>
          </div>

          {/* Section 2: Preferences */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
              Preferences & Units
            </h3>

            <div className="space-y-3">
              {/* Unit System */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-white">Unit System</div>
                  <div className="text-xs text-neutral-400">Metric (kg, cm) vs Imperial (lbs, ft/in)</div>
                </div>
                <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => {
                      setUnitSystem('metric');
                      onUpdateProfile({ unitSystem: 'metric' });
                    }}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      unitSystem === 'metric' ? 'bg-white dark:bg-neutral-900 shadow-xs' : 'text-neutral-500'
                    }`}
                  >
                    Metric
                  </button>
                  <button
                    onClick={() => {
                      setUnitSystem('imperial');
                      onUpdateProfile({ unitSystem: 'imperial' });
                    }}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      unitSystem === 'imperial' ? 'bg-white dark:bg-neutral-900 shadow-xs' : 'text-neutral-500'
                    }`}
                  >
                    Imperial
                  </button>
                </div>
              </div>

              {/* Photo Retention Opt-in */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-white">
                    Visual Food Diary (Keep Photos)
                  </div>
                  <div className="text-xs text-neutral-400 max-w-xs">
                    By default, AI food photos are discarded upon confirmation. Opt in to retain thumbnails in your diary.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={keepPhotos}
                  onChange={(e) => {
                    setKeepPhotos(e.target.checked);
                    onUpdateProfile({ keepFoodPhotos: e.target.checked });
                  }}
                  className="w-4 h-4 text-[#FF6B5B] rounded accent-[#FF6B5B] cursor-pointer"
                />
              </div>

              {/* Notification preferences */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-white">Meal Reminders</div>
                  <div className="text-xs text-neutral-400">Gentle notifications to keep daily consistency</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 text-[#FF6B5B] rounded accent-[#FF6B5B] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Data Management & Export */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
              Data Portability & Account
            </h3>

            <div className="space-y-3">
              {/* Download JSON Data */}
              <button
                type="button"
                onClick={handleExportData}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-white">
                      Export My Data (JSON)
                    </div>
                    <div className="text-xs text-neutral-400">
                      Download complete biometric and food log archive
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              {/* Legal Links */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveLegalModal('privacy')}
                  className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-left hover:border-neutral-300 transition flex items-center justify-between"
                >
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Privacy Policy
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLegalModal('terms')}
                  className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-left hover:border-neutral-300 transition flex items-center justify-between"
                >
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Terms of Service
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              </div>

              {/* Delete Account Button */}
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-200 dark:border-red-950/60 hover:bg-red-500/10 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-red-600 dark:text-red-400">
                      Delete my account and all my data
                    </div>
                    <div className="text-xs text-red-500/70">
                      Irreversibly deletes profile, weights, and all meal records
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
                Permanently Delete Account?
              </h3>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                This action is irreversible. All of your personal health data, Mifflin-St Jeor targets, weight entries, and logged meals will be permanently deleted from the database.
              </p>
            </div>

            <div className="pt-2">
              <label className="block text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1">
                Type <span className="font-bold text-red-500">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono text-center uppercase"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteInput('');
                }}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteAccount}
                disabled={deleteInput !== 'DELETE' || isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-xs font-semibold disabled:opacity-40 hover:bg-red-700 transition"
              >
                {isDeleting ? 'Deleting...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEGAL MODALS (Placeholder Beta Disclaimers) */}
      {activeLegalModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white capitalize">
                {activeLegalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <button
                onClick={() => setActiveLegalModal(null)}
                className="text-xs font-medium text-neutral-400 hover:text-neutral-700"
              >
                Close
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium">
              Demo/Beta Notice: This document is a prototype placeholder. Official legal documentation must replace this text prior to general public commercial deployment.
            </div>

            <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-h-64 overflow-y-auto pr-2">
              <p>
                <strong>1. Nature of Service:</strong> Cal Scan provides optical nutritional scanning, tracking, and biometric estimates using established scientific formulas (Mifflin-St Jeor) and multimodal artificial intelligence. It is not licensed medical hardware or healthcare advice.
              </p>
              <p>
                <strong>2. Health Data Protection:</strong> All records are stored with authenticated user isolation. Access is strictly scoped to the individual account holder.
              </p>
              <p>
                <strong>3. Image Processing:</strong> Food photographs are transmitted ephemerally to AI visual inference models and are not permanently cataloged unless the user opts into a visual diary in Settings.
              </p>
              <p>
                <strong>4. Right to Erasure:</strong> Users maintain unencumbered rights to export all account records or trigger irreversible database deletion at any time via Settings.
              </p>
            </div>

            <button
              onClick={() => setActiveLegalModal(null)}
              className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
