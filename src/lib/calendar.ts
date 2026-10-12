import { getAccessToken } from './firebase';

export interface CalendarSyncResult {
  success: boolean;
  eventsCreated: number;
  message: string;
}

export async function syncMealRemindersToCalendar(
  startDateStr: string,
  daysCount: number = 7,
  lunchTime: string = '13:00',
  dinnerTime: string = '20:30',
  messName: string = 'Annapurna Mess'
): Promise<CalendarSyncResult> {
  const token = await getAccessToken();
  if (!token) {
    return {
      success: false,
      eventsCreated: 0,
      message: 'Please sign in with Google to enable Google Calendar synchronization.',
    };
  }

  let createdCount = 0;
  const startDate = new Date(startDateStr);

  for (let i = 0; i < daysCount; i++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    const datePart = current.toISOString().split('T')[0];

    // Lunch Event
    const [lHour, lMin] = lunchTime.split(':').map(Number);
    const lunchStart = new Date(current);
    lunchStart.setHours(lHour, lMin, 0, 0);
    const lunchEnd = new Date(lunchStart.getTime() + 30 * 60000);

    const lunchEvent = {
      summary: `🍱 Tiffin Lunch: ${messName}`,
      description: `Daily aspirant meal delivery reminder.\nExpected delivery: ${lunchTime}.\nMark delivery status in TiffinTrack app!`,
      start: { dateTime: lunchStart.toISOString() },
      end: { dateTime: lunchEnd.toISOString() },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'popup', minutes: 0 },
        ],
      },
    };

    // Dinner Event
    const [dHour, dMin] = dinnerTime.split(':').map(Number);
    const dinnerStart = new Date(current);
    dinnerStart.setHours(dHour, dMin, 0, 0);
    const dinnerEnd = new Date(dinnerStart.getTime() + 30 * 60000);

    const dinnerEvent = {
      summary: `🍛 Tiffin Dinner: ${messName}`,
      description: `Daily aspirant dinner delivery reminder.\nExpected delivery: ${dinnerTime}.\nMark delivery status in TiffinTrack app!`,
      start: { dateTime: dinnerStart.toISOString() },
      end: { dateTime: dinnerEnd.toISOString() },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'popup', minutes: 0 },
        ],
      },
    };

    try {
      const resLunch = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lunchEvent),
      });
      if (resLunch.ok) createdCount++;

      const resDinner = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dinnerEvent),
      });
      if (resDinner.ok) createdCount++;
    } catch (e) {
      console.error('Error creating calendar event:', e);
    }
  }

  return {
    success: createdCount > 0,
    eventsCreated: createdCount,
    message: `Successfully scheduled ${createdCount} tiffin delivery events in your Google Calendar!`,
  };
}
