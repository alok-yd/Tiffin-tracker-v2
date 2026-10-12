import React, { useState } from 'react';
import { DaySchedule, UserPreferences } from '../types';
import { syncMealRemindersToCalendar } from '../lib/calendar';
import { Calendar, Clock, Check, Save, Sparkles, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { User } from 'firebase/auth';

interface SchedulesViewProps {
  schedules: DaySchedule[];
  onUpdateSchedules: (updated: DaySchedule[]) => void;
  preferences: UserPreferences;
  user: User | null;
}

export const SchedulesView: React.FC<SchedulesViewProps> = ({
  schedules,
  onUpdateSchedules,
  preferences,
  user,
}) => {
  const [localSchedules, setLocalSchedules] = useState<DaySchedule[]>(schedules);
  const [isSaved, setIsSaved] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  const handleToggleMeal = (dayIndex: number, mealType: 'lunch' | 'dinner') => {
    const next = [...localSchedules];
    if (mealType === 'lunch') {
      next[dayIndex].lunchEnabled = !next[dayIndex].lunchEnabled;
    } else {
      next[dayIndex].dinnerEnabled = !next[dayIndex].dinnerEnabled;
    }
    setLocalSchedules(next);
    setIsSaved(false);
  };

  const handleTimeChange = (
    dayIndex: number,
    mealType: 'lunch' | 'dinner',
    timeVal: string
  ) => {
    const next = [...localSchedules];
    if (mealType === 'lunch') {
      next[dayIndex].lunchTime = timeVal;
    } else {
      next[dayIndex].dinnerTime = timeVal;
    }
    setLocalSchedules(next);
    setIsSaved(false);
  };

  const handleSaveSchedules = () => {
    onUpdateSchedules(localSchedules);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleConfirmCalendarSync = async () => {
    setIsSyncingCalendar(true);
    setSyncStatusMessage(null);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const result = await syncMealRemindersToCalendar(
        todayStr,
        7,
        localSchedules[0]?.lunchTime || '13:00',
        localSchedules[0]?.dinnerTime || '20:30',
        preferences.messName
      );
      setSyncStatusMessage(result.message);
    } catch (e: any) {
      setSyncStatusMessage(e.message || 'Failed to sync with Google Calendar.');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Calendar sync card */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase">
                Aspirant Routine
              </span>
              <span className="text-xs text-stone-500">Weekly Meal Timetable</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mt-1">
              Custom Delivery Schedules
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Customize meal delivery times to synchronize with coaching classes, test series, and study blocks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCalendarModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Sync with Google Calendar</span>
            </button>
            <button
              onClick={handleSaveSchedules}
              className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'Saved!' : 'Save Schedule'}</span>
            </button>
          </div>
        </div>

        {syncStatusMessage && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
            <span>{syncStatusMessage}</span>
            <button
              onClick={() => setSyncStatusMessage(null)}
              className="text-blue-700 hover:text-blue-900 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Weekday Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {localSchedules.map((schedule, idx) => {
          const isWeekend = schedule.dayOfWeek === 'Saturday' || schedule.dayOfWeek === 'Sunday';

          return (
            <div
              key={schedule.dayOfWeek}
              className={`bg-white rounded-xl p-4 border transition-all ${
                isWeekend ? 'border-amber-200 shadow-2xs' : 'border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="font-bold text-sm text-stone-900">{schedule.dayOfWeek}</span>
                {isWeekend && (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Special Menu
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-3 text-xs">
                {/* Lunch Row */}
                <div className="p-2.5 rounded-lg border border-stone-100 bg-stone-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                      <input
                        type="checkbox"
                        checked={schedule.lunchEnabled}
                        onChange={() => handleToggleMeal(idx, 'lunch')}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Lunch Tiffin</span>
                    </label>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        schedule.lunchEnabled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {schedule.lunchEnabled ? 'Scheduled' : 'Skipped'}
                    </span>
                  </div>

                  {schedule.lunchEnabled && (
                    <div className="flex items-center justify-between pt-1 text-stone-600">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>Expected Delivery:</span>
                      </span>
                      <input
                        type="time"
                        value={schedule.lunchTime}
                        onChange={(e) => handleTimeChange(idx, 'lunch', e.target.value)}
                        className="px-2 py-0.5 bg-white border border-stone-300 rounded text-xs font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* Dinner Row */}
                <div className="p-2.5 rounded-lg border border-stone-100 bg-stone-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                      <input
                        type="checkbox"
                        checked={schedule.dinnerEnabled}
                        onChange={() => handleToggleMeal(idx, 'dinner')}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Dinner Tiffin</span>
                    </label>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        schedule.dinnerEnabled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {schedule.dinnerEnabled ? 'Scheduled' : 'Skipped'}
                    </span>
                  </div>

                  {schedule.dinnerEnabled && (
                    <div className="flex items-center justify-between pt-1 text-stone-600">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>Expected Delivery:</span>
                      </span>
                      <input
                        type="time"
                        value={schedule.dinnerTime}
                        onChange={(e) => handleTimeChange(idx, 'dinner', e.target.value)}
                        className="px-2 py-0.5 bg-white border border-stone-300 rounded text-xs font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mandatory User Confirmation Dialog for Google Calendar Sync */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-stone-900">
              Sync Meal Delivery to Google Calendar?
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              This will create reminder events in your Google Calendar for your next 7 days of scheduled lunch and dinner delivery slots from <strong>{preferences.messName}</strong> with 15-minute advance popup notifications.
            </p>

            <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lunch events: 1:00 PM (30 min duration)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dinner events: 8:30 PM (30 min duration)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Requested with permission to update calendar events</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                disabled={isSyncingCalendar}
                className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleConfirmCalendarSync();
                  setShowCalendarModal(false);
                }}
                disabled={isSyncingCalendar}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2"
              >
                {isSyncingCalendar ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <span>Confirm &amp; Add Events</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
