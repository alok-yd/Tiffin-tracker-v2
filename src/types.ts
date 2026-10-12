export interface MealRecord {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  dayName: string; // Monday, Tuesday, etc.
  lunchReceived: boolean;
  lunchStatus?: 'scheduled' | 'received' | 'missed' | 'cancelled';
  lunchDeliveredAt?: string;
  dinnerReceived: boolean;
  dinnerStatus?: 'scheduled' | 'received' | 'missed' | 'cancelled';
  dinnerDeliveredAt?: string;
  totalReceived: number;
  dailyCost: number;
  notes?: string;
  rating?: number;
  feedback?: string;
}

export interface DaySchedule {
  dayOfWeek: string;
  lunchEnabled: boolean;
  lunchTime: string; // e.g. "13:00"
  dinnerEnabled: boolean;
  dinnerTime: string; // e.g. "20:30"
}

export interface UserPreferences {
  examTarget: string; // UPSC, JEE, NEET, GATE, CAT, SSC, etc.
  messName: string;
  messPhone: string;
  costPerTiffin: number;
  dietType: 'Vegetarian' | 'Jain (No Onion/Garlic)' | 'Eggetarian' | 'Non-Vegetarian';
  spiceLevel: 'Mild' | 'Medium' | 'Spicy';
  rotiPreference: string;
  specialInstructions: string;
  deliveryAddress: string;
  lateLunchAlertTime: string; // e.g. "13:45"
  lateDinnerAlertTime: string; // e.g. "21:15"
  notificationsEnabled: boolean;
}

export interface FeedbackItem {
  id: string;
  date: string;
  mealType: 'Lunch' | 'Dinner' | 'Both';
  rating: number; // 1 to 5
  category: 'Late Delivery' | 'Food Quality' | 'Portion Size' | 'Cold Food' | 'Hygiene' | 'Other';
  comment: string;
  messResponse?: string;
  status: 'Logged' | 'Shared with Mess' | 'Resolved';
  createdAt: string;
}

export interface BillingSummary {
  periodStart: string;
  periodEnd: string;
  scheduledTiffins: number;
  missedTiffins: number;
  receivedTiffins: number;
  costPerTiffin: number;
  totalCost: number;
  daysCovered: number;
}
