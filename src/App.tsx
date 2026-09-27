/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  auth, 
  db, 
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteUser,
  getDocs,
  writeBatch
} from './services/firebase';
import { User } from 'firebase/auth';
import { UserProfile, FoodLogEntry, WeightRecord } from './types';
import { getTodayDateString } from './utils/nutritionCalculations';
import { sanitizeForFirestore } from './utils/firestoreSanitizer';
import { CalScanLogo } from './components/CalScanLogo';
import { NutritionRings } from './components/NutritionRings';
import { OnboardingWizard } from './components/OnboardingWizard';
import { LogFoodSheet } from './components/LogFoodSheet';
import { DiaryHistory } from './components/DiaryHistory';
import { ProgressAnalytics } from './components/ProgressAnalytics';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';

import { 
  Flame, 
  Plus, 
  Calendar, 
  Activity, 
  Settings as SettingsIcon, 
  LayoutDashboard,
  Utensils,
  ChevronRight,
  Sparkles,
  Camera,
  Barcode,
  Search,
  CheckCircle2,
  RefreshCw,
  LogOut
} from 'lucide-react';

const LOCAL_USER_KEY = 'calibrate_local_user';
const LOCAL_PROFILE_KEY = 'calibrate_local_profile';
const LOCAL_LOGS_KEY = 'calibrate_local_logs';
const LOCAL_WEIGHTS_KEY = 'calibrate_local_weights';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocalMode, setIsLocalMode] = useState<boolean>(() => {
    return !!localStorage.getItem(LOCAL_USER_KEY);
  });
  const [authError, setAuthError] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Main navigation tab: 'today' | 'diary' | 'progress'
  const [activeTab, setActiveTab] = useState<'today' | 'diary' | 'progress'>('today');

  // Modal sheets
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Data states
  const [foodLogs, setFoodLogs] = useState<FoodLogEntry[]>([]);
  const [weights, setWeights] = useState<WeightRecord[]>([]);

  // 1. Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLocalMode(false);
        setCurrentUser(user);
        await loadCloudUserProfile(user.uid);
      } else {
        // Check if there is an active local user session
        const localUid = localStorage.getItem(LOCAL_USER_KEY);
        if (localUid) {
          setIsLocalMode(true);
          loadLocalUserProfile();
        } else {
          setCurrentUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Load cloud profile
  const loadCloudUserProfile = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        const today = getTodayDateString();
        let newStreak = data.streakCount || 1;
        if (data.lastActiveDate !== today) {
          const lastDate = new Date(data.lastActiveDate);
          const currentDate = new Date(today);
          const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            newStreak = 1;
          }
          await updateDoc(userRef, {
            streakCount: newStreak,
            lastActiveDate: today,
          });
          data.streakCount = newStreak;
          data.lastActiveDate = today;
        }
        setUserProfile(data);
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Failed to load cloud profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load local profile
  const loadLocalUserProfile = () => {
    try {
      const stored = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as UserProfile;
        const today = getTodayDateString();
        if (data.lastActiveDate !== today) {
          data.lastActiveDate = today;
          localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(data));
        }
        setUserProfile(data);
      } else {
        setUserProfile(null);
      }

      const storedLogs = localStorage.getItem(LOCAL_LOGS_KEY);
      if (storedLogs) {
        setFoodLogs(JSON.parse(storedLogs));
      }

      const storedWeights = localStorage.getItem(LOCAL_WEIGHTS_KEY);
      if (storedWeights) {
        setWeights(JSON.parse(storedWeights));
      }
    } catch (e) {
      console.error('Error loading local profile:', e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Real-time subscriptions for cloud user
  useEffect(() => {
    if (!currentUser || isLocalMode) return;

    const logsQuery = query(collection(db, 'users', currentUser.uid, 'logs'));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const items: FoodLogEntry[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...(doc.data() as any) });
      });
      items.sort((a, b) => b.timestamp - a.timestamp);
      setFoodLogs(items);
    });

    const weightsQuery = query(collection(db, 'users', currentUser.uid, 'weights'));
    const unsubWeights = onSnapshot(weightsQuery, (snapshot) => {
      const items: WeightRecord[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...(doc.data() as any) });
      });
      items.sort((a, b) => a.timestamp - b.timestamp);
      setWeights(items);
    });

    return () => {
      unsubLogs();
      unsubWeights();
    };
  }, [currentUser, isLocalMode]);

  // Auth Handlers
  const handleSignInWithGoogle = async () => {
    try {
      setAuthError(null);
      const res = await signInWithPopup(auth, googleProvider);
      setCurrentUser(res.user);
      setIsLocalMode(false);
      localStorage.removeItem(LOCAL_USER_KEY);
      await loadCloudUserProfile(res.user.uid);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      // If popup was blocked or closed or restricted, give helpful message
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed. Please try again.');
      } else if (err.code === 'auth/admin-restricted-operation') {
        setAuthError('Google sign in is configuring. You can use a local session in the meantime.');
      } else {
        setAuthError(err.message || 'Failed to sign in with Google');
      }
    }
  };

  const handleContinueAsGuest = async () => {
    const guestUid = 'local_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem(LOCAL_USER_KEY, guestUid);
    setIsLocalMode(true);
    setCurrentUser(null);
    setUserProfile(null);
  };

  // Onboarding Complete Handler
  const handleOnboardingComplete = async (profileData: Partial<UserProfile>) => {
    const today = getTodayDateString();
    const activeUid = currentUser ? currentUser.uid : (localStorage.getItem(LOCAL_USER_KEY) || 'guest_user');

    const fullProfile: UserProfile = {
      uid: activeUid,
      createdAt: Date.now(),
      healthConsentGiven: true,
      healthConsentDate: Date.now(),
      keepFoodPhotos: false,
      unitSystem: profileData.unitSystem || 'metric',
      goal: profileData.goal || 'lose',
      sex: profileData.sex || 'male',
      age: profileData.age || 28,
      heightCm: profileData.heightCm || 175,
      currentWeightKg: profileData.currentWeightKg || 75,
      targetWeightKg: profileData.targetWeightKg || 70,
      activityLevel: profileData.activityLevel || 'moderate',
      dietaryPreference: profileData.dietaryPreference || 'anything',
      weeklyRateKg: profileData.weeklyRateKg || 0.5,
      bmr: profileData.bmr || 1700,
      tdee: profileData.tdee || 2400,
      targetCalories: profileData.targetCalories || 2000,
      targetProteinGrams: profileData.targetProteinGrams || 140,
      targetCarbsGrams: profileData.targetCarbsGrams || 225,
      targetFatGrams: profileData.targetFatGrams || 60,
      onboardingCompleted: true,
      streakCount: 1,
      lastActiveDate: today,
    };

    const initialWeight: WeightRecord = {
      id: 'w_' + Date.now(),
      userId: activeUid,
      weightKg: fullProfile.currentWeightKg,
      timestamp: Date.now(),
      dateString: today,
    };

    if (currentUser && !isLocalMode) {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, sanitizeForFirestore(fullProfile));
      await addDoc(collection(db, 'users', currentUser.uid, 'weights'), sanitizeForFirestore({
        userId: currentUser.uid,
        weightKg: fullProfile.currentWeightKg,
        timestamp: Date.now(),
        dateString: today,
      }));
    } else {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(fullProfile));
      localStorage.setItem(LOCAL_WEIGHTS_KEY, JSON.stringify([initialWeight]));
      setWeights([initialWeight]);
    }

    setUserProfile(fullProfile);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  // Add Log Entry
  const handleSaveLog = async (entry: Omit<FoodLogEntry, 'id' | 'userId' | 'timestamp' | 'dateString'>) => {
    const today = getTodayDateString();
    const timestamp = Date.now();
    const activeUid = currentUser ? currentUser.uid : 'local_user';

    if (currentUser && !isLocalMode) {
      const cleanData = sanitizeForFirestore({
        ...entry,
        userId: currentUser.uid,
        timestamp,
        dateString: today,
      });
      await addDoc(collection(db, 'users', currentUser.uid, 'logs'), cleanData);
    } else {
      const newEntry: FoodLogEntry = {
        ...entry,
        id: 'log_' + timestamp + '_' + Math.random().toString(36).substr(2, 4),
        userId: activeUid,
        timestamp,
        dateString: today,
      };
      const updated = [newEntry, ...foodLogs];
      setFoodLogs(updated);
      localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(updated));
    }
  };

  // Delete Log
  const handleDeleteLog = async (logId: string) => {
    if (currentUser && !isLocalMode) {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'logs', logId));
    } else {
      const updated = foodLogs.filter(l => l.id !== logId);
      setFoodLogs(updated);
      localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(updated));
    }
  };

  // Update Log
  const handleUpdateLog = async (log: FoodLogEntry) => {
    if (currentUser && !isLocalMode) {
      const { id, ...data } = log;
      const cleanData = sanitizeForFirestore(data);
      await updateDoc(doc(db, 'users', currentUser.uid, 'logs', id), cleanData);
    } else {
      const updated = foodLogs.map(l => l.id === log.id ? log : l);
      setFoodLogs(updated);
      localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(updated));
    }
  };

  // Add Weight
  const handleAddWeight = async (weightKg: number) => {
    const today = getTodayDateString();
    const timestamp = Date.now();

    if (currentUser && !isLocalMode) {
      const cleanData = sanitizeForFirestore({
        userId: currentUser.uid,
        weightKg,
        timestamp,
        dateString: today,
      });
      await addDoc(collection(db, 'users', currentUser.uid, 'weights'), cleanData);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        currentWeightKg: weightKg,
      });
    } else {
      const newWeight: WeightRecord = {
        id: 'w_' + timestamp,
        userId: 'local_user',
        weightKg,
        timestamp,
        dateString: today,
      };
      const updated = [...weights, newWeight];
      setWeights(updated);
      localStorage.setItem(LOCAL_WEIGHTS_KEY, JSON.stringify(updated));
      if (userProfile) {
        const updatedProf = { ...userProfile, currentWeightKg: weightKg };
        setUserProfile(updatedProf);
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updatedProf));
      }
    }

    setUserProfile((prev) => prev ? { ...prev, currentWeightKg: weightKg } : null);
  };

  // Update Profile
  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (currentUser && !isLocalMode) {
      const cleanData = sanitizeForFirestore(data);
      await updateDoc(doc(db, 'users', currentUser.uid), cleanData);
    } else {
      if (userProfile) {
        const updated = { ...userProfile, ...data };
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
      }
    }
    setUserProfile((prev) => prev ? { ...prev, ...data } : null);
  };

  // Irreversible Delete Account and all data
  const handleDeleteAccountAndData = async () => {
    try {
      if (currentUser && !isLocalMode) {
        const uid = currentUser.uid;
        const logsSnap = await getDocs(collection(db, 'users', uid, 'logs'));
        const batch1 = writeBatch(db);
        logsSnap.forEach((d) => batch1.delete(d.ref));
        await batch1.commit();

        const weightsSnap = await getDocs(collection(db, 'users', uid, 'weights'));
        const batch2 = writeBatch(db);
        weightsSnap.forEach((d) => batch2.delete(d.ref));
        await batch2.commit();

        await deleteDoc(doc(db, 'users', uid));
        await deleteUser(currentUser);
      } else {
        localStorage.removeItem(LOCAL_USER_KEY);
        localStorage.removeItem(LOCAL_PROFILE_KEY);
        localStorage.removeItem(LOCAL_LOGS_KEY);
        localStorage.removeItem(LOCAL_WEIGHTS_KEY);
      }

      setUserProfile(null);
      setCurrentUser(null);
      setIsLocalMode(false);
      setFoodLogs([]);
      setWeights([]);
      setIsSettingsOpen(false);
    } catch (err) {
      console.error('Account deletion error:', err);
    }
  };

  const triggerStreakCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B5B', '#111111', '#FFA07A'],
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111111] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <CalScanLogo size={56} />
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-mono">Cal Scan</span>
        </div>
      </div>
    );
  }

  // Not signed in and no active session -> Show AuthScreen
  if (!currentUser && !isLocalMode) {
    return (
      <AuthScreen
        onSignInWithGoogle={handleSignInWithGoogle}
        onContinueAsGuest={handleContinueAsGuest}
        errorMessage={authError}
      />
    );
  }

  // If user hasn't completed onboarding or gave health consent, show Wizard
  if (!userProfile || !userProfile.onboardingCompleted) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // Today's totals calculation
  const todayLogs = foodLogs.filter(l => l.dateString === getTodayDateString());
  const todayCalories = todayLogs.reduce((acc, l) => acc + l.calories, 0);
  const todayProtein = todayLogs.reduce((acc, l) => acc + l.protein, 0);
  const todayCarbs = todayLogs.reduce((acc, l) => acc + l.carbs, 0);
  const todayFat = todayLogs.reduce((acc, l) => acc + l.fat, 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 flex font-sans selection:bg-[#FF6B5B]/20">
      {/* DESKTOP SIDEBAR (Visible on md+) */}
      <aside className="hidden md:flex flex-col justify-between w-64 border-r border-neutral-200/80 dark:border-neutral-800/80 p-6 bg-white dark:bg-[#111111] shrink-0 sticky top-0 h-screen">
        <div className="space-y-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-0.5 rounded-2xl bg-neutral-900 shadow-xs ring-1 ring-black/10 dark:ring-white/10 shrink-0">
              <CalScanLogo size={40} />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block text-neutral-900 dark:text-white leading-tight">
                Cal Scan
              </span>
              <span className="text-[10px] text-neutral-400 font-mono tracking-wider block">
                OPTICAL TRACKER
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('today')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
                activeTab === 'today'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#FF6B5B]" />
              Today's Dashboard
            </button>
            <button
              onClick={() => setActiveTab('diary')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
                activeTab === 'diary'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Food Diary & Logs
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
                activeTab === 'progress'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              Weight & Trends
            </button>
          </nav>
        </div>

        {/* Bottom Actions in Sidebar */}
        <div className="space-y-4 pt-6 border-t border-neutral-100 dark:border-neutral-800">
          {/* Streak indicator button */}
          <button
            onClick={triggerStreakCelebration}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-left hover:border-[#FF6B5B]/50 transition group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF6B5B]/10 text-[#FF6B5B] flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-900 dark:text-white block">
                  {userProfile.streakCount} Day Streak
                </span>
                <span className="text-[10px] text-neutral-400">Tap to celebrate</span>
              </div>
            </div>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <SettingsIcon className="w-4 h-4" />
            Settings & Privacy
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-h-screen pb-24 md:pb-8 max-w-4xl mx-auto w-full px-4 sm:px-8 pt-6 sm:pt-8">
        {/* Mobile Header Bar */}
        <div className="flex md:hidden items-center justify-between mb-6 pb-3 border-b border-neutral-100 dark:border-neutral-800/60">
          <div className="flex items-center gap-3">
            <div className="p-0.5 rounded-2xl bg-black shadow-md ring-1 ring-white/10 shrink-0">
              <CalScanLogo size={42} />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block text-neutral-900 dark:text-white leading-tight">
                Cal Scan
              </span>
              <span className="text-[10px] text-neutral-400 font-mono tracking-wider block">
                OPTICAL TRACKER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Streak pill */}
            <button
              onClick={triggerStreakCelebration}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-2xs hover:border-[#FF6B5B] transition active:scale-95"
            >
              <Flame className="w-3.5 h-3.5 text-[#FF6B5B]" />
              {userProfile.streakCount}d
            </button>
            {/* Settings button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Settings"
              className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition shadow-2xs active:scale-95"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TAB 1: TODAY'S DASHBOARD */}
        {activeTab === 'today' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Greeting & Date */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium block">
                  Today's Calibration
                </span>
                <h1 className="text-2xl sm:text-3xl font-light text-neutral-900 dark:text-white">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h1>
              </div>

              {/* Log Food CTA for Desktop */}
              <button
                onClick={() => setIsLogSheetOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF6B5B] text-white text-xs font-semibold shadow-sm hover:opacity-90 transition active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Log Food
              </button>
            </div>

            {/* Apple Health Style Nutrition Rings */}
            <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-neutral-200/70 dark:border-neutral-800/80 shadow-xs">
              <NutritionRings
                calorieTarget={userProfile.targetCalories}
                calorieConsumed={todayCalories}
                proteinTarget={userProfile.targetProteinGrams}
                proteinConsumed={todayProtein}
                carbsTarget={userProfile.targetCarbsGrams}
                carbsConsumed={todayCarbs}
                fatTarget={userProfile.targetFatGrams}
                fatConsumed={todayFat}
              />
            </div>

            {/* Quick Track Action Shortcuts */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              <button
                onClick={() => setIsLogSheetOpen(true)}
                className="flex flex-col sm:flex-row items-center sm:items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/80 hover:border-[#FF6B5B] transition shadow-xs text-center sm:text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FF6B5B]/10 text-[#FF6B5B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white block">AI Photo Scan</span>
                  <span className="text-[10px] text-neutral-400 hidden sm:block">Instant optical detection</span>
                </div>
              </button>

              <button
                onClick={() => setIsLogSheetOpen(true)}
                className="flex flex-col sm:flex-row items-center sm:items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/80 hover:border-[#FF6B5B] transition shadow-xs text-center sm:text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Barcode className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white block">Barcode Scan</span>
                  <span className="text-[10px] text-neutral-400 hidden sm:block">UPC & packaged items</span>
                </div>
              </button>

              <button
                onClick={() => setIsLogSheetOpen(true)}
                className="flex flex-col sm:flex-row items-center sm:items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/80 hover:border-[#FF6B5B] transition shadow-xs text-center sm:text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white block">Search / Quick</span>
                  <span className="text-[10px] text-neutral-400 hidden sm:block">Whole foods & pantry</span>
                </div>
              </button>
            </div>

            {/* Recently Logged Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                  Recently Logged Today
                </span>
                {todayLogs.length > 0 && (
                  <button
                    onClick={() => setActiveTab('diary')}
                    className="text-xs font-medium text-[#FF6B5B] hover:underline"
                  >
                    View All ({todayLogs.length})
                  </button>
                )}
              </div>

              {todayLogs.length === 0 ? (
                <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-[#FF6B5B]">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      No meals logged yet today
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Snap a photo, scan a barcode, or search standard items.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsLogSheetOpen(true)}
                    className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition"
                  >
                    Log First Meal
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/70 dark:border-neutral-800/80 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden shadow-xs">
                  {todayLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        {log.photoThumbnail ? (
                          <img
                            src={log.photoThumbnail}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-neutral-200 dark:border-neutral-800"
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
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-normal">
                                AI
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5 capitalize">
                            {log.mealType} • {log.servingSize || '1 portion'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {log.calories}
                        </span>
                        <span className="text-[10px] text-neutral-400 ml-1">kcal</span>
                        <div className="text-[10px] text-neutral-400">
                          P: {log.protein}g C: {log.carbs}g F: {log.fat}g
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DIARY & HISTORY */}
        {activeTab === 'diary' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium block">
                  Log History
                </span>
                <h1 className="text-2xl sm:text-3xl font-light text-neutral-900 dark:text-white">
                  Nutrition Diary
                </h1>
              </div>

              <button
                onClick={() => setIsLogSheetOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF6B5B] text-white text-xs font-semibold shadow-sm hover:opacity-90 transition"
              >
                <Plus className="w-4 h-4" />
                Add Meal
              </button>
            </div>

            <DiaryHistory
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              logs={foodLogs}
              onDeleteLog={handleDeleteLog}
              onUpdateLog={handleUpdateLog}
            />
          </div>
        )}

        {/* TAB 3: PROGRESS & TRENDS */}
        {activeTab === 'progress' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium block">
                Progress & Metrics
              </span>
              <h1 className="text-2xl sm:text-3xl font-light text-neutral-900 dark:text-white">
                Biometric Trends
              </h1>
            </div>

            <ProgressAnalytics
              profile={userProfile}
              weights={weights}
              logs={foodLogs}
              onAddWeight={handleAddWeight}
            />
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAFAFA]/90 dark:bg-[#111111]/90 backdrop-blur-md border-t border-neutral-200/70 dark:border-neutral-800/80 px-6 py-2.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'today' ? 'text-[#FF6B5B]' : 'text-neutral-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Today</span>
        </button>

        {/* Floating Centered Plus Action */}
        <div className="relative -top-4">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsLogSheetOpen(true)}
            className="w-13 h-13 rounded-full bg-[#FF6B5B] text-white flex items-center justify-center shadow-lg shadow-[#FF6B5B]/30 hover:opacity-95"
            aria-label="Log Food"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </motion.button>
        </div>

        <button
          onClick={() => setActiveTab('diary')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'diary' ? 'text-[#FF6B5B]' : 'text-neutral-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-medium">Diary</span>
        </button>

        <button
          onClick={() => setActiveTab('progress')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'progress' ? 'text-[#FF6B5B]' : 'text-neutral-400'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] font-medium">Trends</span>
        </button>
      </nav>

      {/* MODALS */}
      <AnimatePresence>
        {isLogSheetOpen && (
          <LogFoodSheet
            isOpen={isLogSheetOpen}
            onClose={() => setIsLogSheetOpen(false)}
            onSaveLog={handleSaveLog}
            keepFoodPhotosOptIn={userProfile.keepFoodPhotos || false}
          />
        )}
      </AnimatePresence>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={userProfile}
        logs={foodLogs}
        weights={weights}
        onUpdateProfile={handleUpdateProfile}
        onDeleteAccountAndData={handleDeleteAccountAndData}
      />
    </div>
  );
}
