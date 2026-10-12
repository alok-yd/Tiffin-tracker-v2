/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db, initAuth } from './lib/firebase';
import {
  getLocalMeals,
  saveLocalMeals,
  getLocalPreferences,
  saveLocalPreferences,
  getLocalSchedules,
  saveLocalSchedules,
  getLocalFeedbacks,
  saveLocalFeedbacks,
  calculateBilling,
  syncMealsToCloud,
  fetchMealsFromCloud,
} from './lib/storage';
import { MealRecord, UserPreferences, DaySchedule, FeedbackItem } from './types';
import { Navbar } from './components/Navbar';
import { DailyRecordsView } from './components/DailyRecordsView';
import { BillingView } from './components/BillingView';
import { SchedulesView } from './components/SchedulesView';
import { LateAlertsView } from './components/LateAlertsView';
import { PreferencesAndFeedbackView } from './components/PreferencesAndFeedbackView';
import { GeminiHubView } from './components/GeminiHubView';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('records');
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // App data state
  const [meals, setMeals] = useState<MealRecord[]>(() => getLocalMeals());
  const [preferences, setPreferences] = useState<UserPreferences>(() => getLocalPreferences());
  const [schedules, setSchedules] = useState<DaySchedule[]>(() => getLocalSchedules());
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => getLocalFeedbacks());

  // Connection testing as mandated by skill
  useEffect(() => {
    async function testFirestoreConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.log('Firebase client is offline, using local persistent cache.');
        }
      }
    }
    testFirestoreConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
        // Attempt cloud fetch when signed in
        if (navigator.onLine) {
          fetchMealsFromCloud()
            .then((cloudData) => {
              if (cloudData && cloudData.length > 0) {
                setMeals(cloudData);
                saveLocalMeals(cloudData);
              }
            })
            .catch((e) => {
              console.log('Initial sync fallback to local cache:', e);
            });
        }
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync pending local records
      if (user) {
        setIsSyncing(true);
        syncMealsToCloud(meals).finally(() => setIsSyncing(false));
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, meals]);

  // Handlers for modifying and saving data
  const handleUpdateMeals = (updated: MealRecord[]) => {
    setMeals(updated);
    saveLocalMeals(updated);
    if (user && isOnline) {
      syncMealsToCloud(updated);
    }
  };

  const handleUpdatePreferences = (updated: UserPreferences) => {
    setPreferences(updated);
    saveLocalPreferences(updated);
  };

  const handleUpdateSchedules = (updated: DaySchedule[]) => {
    setSchedules(updated);
    saveLocalSchedules(updated);
  };

  const handleUpdateFeedbacks = (updated: FeedbackItem[]) => {
    setFeedbacks(updated);
    saveLocalFeedbacks(updated);
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      alert('You are currently offline. Changes are saved locally and will auto-sync when connected.');
      return;
    }
    if (!user) {
      alert('Sign in with Google to synchronize your tiffin records across multiple devices.');
      return;
    }
    setIsSyncing(true);
    const ok = await syncMealsToCloud(meals);
    setIsSyncing(false);
    if (ok) {
      alert('All records successfully synchronized with cloud database!');
    }
  };

  const billing = calculateBilling(meals, preferences.costPerTiffin);

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Offline Mode Active • You can edit, modify, and save without internet. All data will auto-sync once connected.</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOnline={isOnline}
        onSync={handleManualSync}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'records' && (
          <DailyRecordsView
            meals={meals}
            onUpdateMeals={handleUpdateMeals}
            preferences={preferences}
            isOnline={isOnline}
          />
        )}

        {activeTab === 'billing' && (
          <BillingView
            meals={meals}
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
          />
        )}

        {activeTab === 'schedules' && (
          <SchedulesView
            schedules={schedules}
            onUpdateSchedules={handleUpdateSchedules}
            preferences={preferences}
            user={user}
          />
        )}

        {activeTab === 'alerts' && (
          <LateAlertsView
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            meals={meals}
          />
        )}

        {activeTab === 'preferences' && (
          <PreferencesAndFeedbackView
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            feedbacks={feedbacks}
            onUpdateFeedbacks={handleUpdateFeedbacks}
          />
        )}

        {activeTab === 'ai' && (
          <GeminiHubView
            preferences={preferences}
            meals={meals}
            billing={billing}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-5 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800">TiffinTrack</span>
            <span>• Built for competitive exam aspirants across India</span>
          </div>
          <div>
            <span>Tiffin Record • Calculation based on user-provided attendance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
