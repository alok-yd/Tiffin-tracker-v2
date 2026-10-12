import React, { useState, useEffect } from 'react';
import { UserPreferences, MealRecord } from '../types';
import { Bell, BellRing, Phone, AlertTriangle, Clock, Volume2, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface LateAlertsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updated: UserPreferences) => void;
  meals: MealRecord[];
}

export const LateAlertsView: React.FC<LateAlertsViewProps> = ({
  preferences,
  onUpdatePreferences,
  meals,
}) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [alertFired, setAlertFired] = useState<string | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification('TiffinTrack Alerts Activated 🍱', {
          body: `You will now receive automatic real-time push alerts if your tiffin delivery from ${preferences.messName} is delayed!`,
          icon: '/favicon.ico',
        });
      }
    }
  };

  const triggerLateAlertSimulation = (mealType: 'Lunch' | 'Dinner') => {
    setIsTestRunning(true);
    const expectedTime = mealType === 'Lunch' ? preferences.lateLunchAlertTime : preferences.lateDinnerAlertTime;
    const msg = `⚠️ Late Arrival Alert: Your ${mealType} tiffin was scheduled before ${expectedTime}. It has not arrived yet! Tap to call mess or mark refund.`;

    setAlertFired(msg);

    // Audio chime synthesis via Web Audio API
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Audio fallback
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🍱 Late ${mealType} Alert!`, {
        body: msg,
      });
    }

    setTimeout(() => {
      setIsTestRunning(false);
    }, 1500);
  };

  // Find meals with late records or remarks
  const lateHistory = meals.filter(
    (m) => (m.notes && m.notes.toLowerCase().includes('late')) || m.totalReceived === 0
  );

  return (
    <div className="space-y-6">
      {/* Push Notification Setup Banner */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-500/30">
              <BellRing className="w-3.5 h-3.5" />
              <span>Real-Time Push Notification Engine</span>
            </div>
            <h2 className="text-xl font-bold">Late Arrival Alarm &amp; Notification Monitor</h2>
            <p className="text-xs text-stone-300 max-w-xl">
              Don't let late deliveries derail your study timetable. TiffinTrack monitors delivery windows and triggers instant notifications when food is overdue.
            </p>
          </div>

          <div>
            {notificationPermission === 'granted' ? (
              <div className="flex items-center gap-2 bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 px-3.5 py-2 rounded-xl text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Push Notifications Active</span>
              </div>
            ) : (
              <button
                onClick={requestPermission}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span>Enable Browser Push Notifications</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Alert Banner if triggered */}
      {alertFired && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Late Delivery Notification Triggered</h4>
                <p className="text-xs text-rose-700 mt-0.5">{alertFired}</p>
                <div className="flex items-center gap-3 mt-3">
                  <a
                    href={`tel:${preferences.messPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Mess ({preferences.messPhone})</span>
                  </a>
                  <button
                    onClick={() => setAlertFired(null)}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Dismiss Alert
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setAlertFired(null)}
              className="text-rose-400 hover:text-rose-700 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Threshold Configuration and Test Trigger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Delivery Cut-off Watchdog Times</span>
          </h3>
          <p className="text-xs text-stone-500">
            If your meal is not marked received before this cutoff time, an automatic late notification and vibration alert will fire.
          </p>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800">Lunch Late Alert Threshold</span>
                <input
                  type="time"
                  value={preferences.lateLunchAlertTime}
                  onChange={(e) =>
                    onUpdatePreferences({ ...preferences, lateLunchAlertTime: e.target.value })
                  }
                  className="px-2 py-1 bg-white border border-stone-300 rounded text-xs font-bold text-stone-800"
                />
              </div>
              <p className="text-[11px] text-stone-500">
                Scheduled lunch time is 1:00 PM. Alert triggers if delivery is {'>'} 30 mins late.
              </p>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800">Dinner Late Alert Threshold</span>
                <input
                  type="time"
                  value={preferences.lateDinnerAlertTime}
                  onChange={(e) =>
                    onUpdatePreferences({ ...preferences, lateDinnerAlertTime: e.target.value })
                  }
                  className="px-2 py-1 bg-white border border-stone-300 rounded text-xs font-bold text-stone-800"
                />
              </div>
              <p className="text-[11px] text-stone-500">
                Scheduled dinner time is 8:30 PM. Alert triggers if delivery is {'>'} 30 mins late.
              </p>
            </div>
          </div>
        </div>

        {/* Live Simulator & Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-600" />
            <span>Late Notification Simulator</span>
          </h3>
          <p className="text-xs text-stone-500">
            Test the acoustic and visual push notification mechanism to verify your device alerts work during study sessions.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => triggerLateAlertSimulation('Lunch')}
              disabled={isTestRunning}
              className="p-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex flex-col items-center justify-center text-center transition-colors"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 mb-1" />
              <span>Test Late Lunch Alert</span>
              <span className="text-[10px] text-amber-700 font-normal mt-0.5">Sound + Notification</span>
            </button>

            <button
              onClick={() => triggerLateAlertSimulation('Dinner')}
              disabled={isTestRunning}
              className="p-3 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-semibold flex flex-col items-center justify-center text-center transition-colors"
            >
              <AlertTriangle className="w-5 h-5 text-rose-600 mb-1" />
              <span>Test Late Dinner Alert</span>
              <span className="text-[10px] text-rose-700 font-normal mt-0.5">Sound + Notification</span>
            </button>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-stone-700">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Mess Vendor: {preferences.messName}</span>
            </div>
            <a
              href={`tel:${preferences.messPhone}`}
              className="font-bold text-emerald-700 hover:underline"
            >
              {preferences.messPhone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
