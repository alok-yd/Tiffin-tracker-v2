import { MealRecord, DaySchedule, UserPreferences, FeedbackItem, BillingSummary } from '../types';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, query, where } from 'firebase/firestore';

const STORAGE_KEYS = {
  MEALS: 'tiffin_tracker_meals_v1',
  SCHEDULES: 'tiffin_tracker_schedules_v1',
  PREFERENCES: 'tiffin_tracker_preferences_v1',
  FEEDBACKS: 'tiffin_tracker_feedbacks_v1',
  OFFLINE_QUEUE: 'tiffin_tracker_offline_queue_v1',
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  examTarget: 'UPSC CSE & State PCS',
  messName: 'Annapurna Aspirant Mess',
  messPhone: '+91 98765 43210',
  costPerTiffin: 55,
  dietType: 'Vegetarian',
  spiceLevel: 'Medium',
  rotiPreference: '4 Phulkas with Ghee',
  specialInstructions: 'Prefer warm dal, low chili in dinner, extra salad on weekends',
  deliveryAddress: 'Room 204, Pragati Vihar Hostel, Mukherjee Nagar, Delhi',
  lateLunchAlertTime: '13:30',
  lateDinnerAlertTime: '21:00',
  notificationsEnabled: true,
};

export const DEFAULT_SCHEDULES: DaySchedule[] = [
  { dayOfWeek: 'Monday', lunchEnabled: true, lunchTime: '13:00', dinnerEnabled: true, dinnerTime: '20:30' },
  { dayOfWeek: 'Tuesday', lunchEnabled: true, lunchTime: '13:00', dinnerEnabled: true, dinnerTime: '20:30' },
  { dayOfWeek: 'Wednesday', lunchEnabled: true, lunchTime: '13:00', dinnerEnabled: true, dinnerTime: '20:30' },
  { dayOfWeek: 'Thursday', lunchEnabled: true, lunchTime: '13:00', dinnerEnabled: true, dinnerTime: '20:30' },
  { dayOfWeek: 'Friday', lunchEnabled: true, lunchTime: '13:00', dinnerEnabled: true, dinnerTime: '20:30' },
  { dayOfWeek: 'Saturday', lunchEnabled: true, lunchTime: '13:00', dinnerEnabled: true, dinnerTime: '20:30' },
  { dayOfWeek: 'Sunday', lunchEnabled: true, lunchTime: '13:00', dinnerEnabled: true, dinnerTime: '20:30' },
];

export const INITIAL_MEALS: MealRecord[] = [
  { id: '2026-09-16', date: '2026-09-16', dayName: 'Wednesday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-09-17', date: '2026-09-17', dayName: 'Thursday', lunchReceived: false, dinnerReceived: false, totalReceived: 0, dailyCost: 0, notes: 'Studying at library; skipped' },
  { id: '2026-09-18', date: '2026-09-18', dayName: 'Friday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-09-19', date: '2026-09-19', dayName: 'Saturday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-09-20', date: '2026-09-20', dayName: 'Sunday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-09-21', date: '2026-09-21', dayName: 'Monday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-09-22', date: '2026-09-22', dayName: 'Tuesday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-09-23', date: '2026-09-23', dayName: 'Wednesday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-09-24', date: '2026-09-24', dayName: 'Thursday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-09-25', date: '2026-09-25', dayName: 'Friday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-09-26', date: '2026-09-26', dayName: 'Saturday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-09-27', date: '2026-09-27', dayName: 'Sunday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-09-28', date: '2026-09-28', dayName: 'Monday', lunchReceived: true, dinnerReceived: false, totalReceived: 1, dailyCost: 55, notes: 'Dinner skipped - coaching mock exam' },
  { id: '2026-09-29', date: '2026-09-29', dayName: 'Tuesday', lunchReceived: false, dinnerReceived: false, totalReceived: 0, dailyCost: 0, notes: 'Home visit' },
  { id: '2026-09-30', date: '2026-09-30', dayName: 'Wednesday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-01', date: '2026-10-01', dayName: 'Thursday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-02', date: '2026-10-02', dayName: 'Friday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-03', date: '2026-10-03', dayName: 'Saturday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-04', date: '2026-10-04', dayName: 'Sunday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-05', date: '2026-10-05', dayName: 'Monday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-06', date: '2026-10-06', dayName: 'Tuesday', lunchReceived: true, dinnerReceived: false, totalReceived: 1, dailyCost: 55, notes: 'Dinner fasting' },
  { id: '2026-10-07', date: '2026-10-07', dayName: 'Wednesday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-08', date: '2026-10-08', dayName: 'Thursday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-09', date: '2026-10-09', dayName: 'Friday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-10', date: '2026-10-10', dayName: 'Saturday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-11', date: '2026-10-11', dayName: 'Sunday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-12', date: '2026-10-12', dayName: 'Monday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-13', date: '2026-10-13', dayName: 'Tuesday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-14', date: '2026-10-14', dayName: 'Wednesday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
  { id: '2026-10-15', date: '2026-10-15', dayName: 'Thursday', lunchReceived: true, dinnerReceived: true, totalReceived: 2, dailyCost: 110 },
];

export const INITIAL_FEEDBACKS: FeedbackItem[] = [
  {
    id: 'fb-1',
    date: '2026-10-08',
    mealType: 'Dinner',
    rating: 4,
    category: 'Food Quality',
    comment: 'Dal was flavorful and warm. Chapatis were very soft.',
    status: 'Logged',
    createdAt: '2026-10-08T21:15:00.000Z',
  },
  {
    id: 'fb-2',
    date: '2026-10-06',
    mealType: 'Lunch',
    rating: 2,
    category: 'Late Delivery',
    comment: 'Arrived at 2:15 PM instead of 1:00 PM. Delayed my afternoon revision slot.',
    status: 'Shared with Mess',
    createdAt: '2026-10-06T14:30:00.000Z',
  },
];

// Offline localStorage helpers
export function getLocalMeals(): MealRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(INITIAL_MEALS));
      return INITIAL_MEALS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_MEALS;
  }
}

export function saveLocalMeals(meals: MealRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));
  } catch (e) {
    console.error('Failed to save meals locally', e);
  }
}

export function getLocalPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(DEFAULT_PREFERENCES));
      return DEFAULT_PREFERENCES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_PREFERENCES;
  }
}

export function saveLocalPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences locally', e);
  }
}

export function getLocalSchedules(): DaySchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(DEFAULT_SCHEDULES));
      return DEFAULT_SCHEDULES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_SCHEDULES;
  }
}

export function saveLocalSchedules(schedules: DaySchedule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  } catch (e) {
    console.error('Failed to save schedules locally', e);
  }
}

export function getLocalFeedbacks(): FeedbackItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(INITIAL_FEEDBACKS));
      return INITIAL_FEEDBACKS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_FEEDBACKS;
  }
}

export function saveLocalFeedbacks(feedbacks: FeedbackItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(feedbacks));
  } catch (e) {
    console.error('Failed to save feedbacks locally', e);
  }
}

// Compute billing summary from a list of meal records
export function calculateBilling(
  meals: MealRecord[],
  costPerTiffin: number,
  startDate?: string,
  endDate?: string
): BillingSummary {
  let filtered = [...meals].sort((a, b) => a.date.localeCompare(b.date));
  if (startDate) {
    filtered = filtered.filter((m) => m.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter((m) => m.date <= endDate);
  }

  const daysCovered = filtered.length;
  // Standard 2 tiffins scheduled per day
  const scheduledTiffins = daysCovered * 2;
  const receivedTiffins = filtered.reduce((acc, m) => acc + (m.totalReceived || 0), 0);
  const missedTiffins = Math.max(0, scheduledTiffins - receivedTiffins);
  const totalCost = receivedTiffins * costPerTiffin;

  const periodStart = filtered.length > 0 ? filtered[0].date : '';
  const periodEnd = filtered.length > 0 ? filtered[filtered.length - 1].date : '';

  return {
    periodStart,
    periodEnd,
    scheduledTiffins,
    missedTiffins,
    receivedTiffins,
    costPerTiffin,
    totalCost,
    daysCovered,
  };
}

// Cloud synchronization with Firestore
export async function syncMealsToCloud(meals: MealRecord[]): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !navigator.onLine) return false;

  try {
    const batch = writeBatch(db);
    meals.forEach((meal) => {
      const ref = doc(db, 'meals', `${user.uid}_${meal.id}`);
      batch.set(
        ref,
        {
          ...meal,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });
    await batch.commit();
    return true;
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.WRITE, 'meals');
    } catch (e) {
      console.warn('Sync failed:', e);
    }
    return false;
  }
}

export async function fetchMealsFromCloud(): Promise<MealRecord[] | null> {
  const user = auth.currentUser;
  if (!user || !navigator.onLine) return null;

  try {
    const mealsRef = collection(db, 'meals');
    const q = query(mealsRef, where('userId', '==', user.uid));
    const snap = await getDocs(q);
    const cloudMeals: MealRecord[] = [];
    snap.forEach((d) => {
      const data = d.data() as MealRecord;
      cloudMeals.push(data);
    });
    if (cloudMeals.length > 0) {
      cloudMeals.sort((a, b) => a.date.localeCompare(b.date));
      return cloudMeals;
    }
    return null;
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.LIST, 'meals');
    } catch (e) {
      console.warn('Cloud fetch failed:', e);
    }
    return null;
  }
}
