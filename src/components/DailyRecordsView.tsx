import React, { useState } from 'react';
import { MealRecord, UserPreferences, BillingSummary } from '../types';
import { calculateBilling } from '../lib/storage';
import { generateTiffinRecordPDF } from '../lib/pdfGenerator';
import { Download, Plus, Edit2, CheckCircle2, XCircle, Search, Calendar, AlertTriangle, ArrowUpDown, Clock } from 'lucide-react';

interface DailyRecordsViewProps {
  meals: MealRecord[];
  onUpdateMeals: (updated: MealRecord[]) => void;
  preferences: UserPreferences;
  isOnline: boolean;
}

export const DailyRecordsView: React.FC<DailyRecordsViewProps> = ({
  meals,
  onUpdateMeals,
  preferences,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRange, setSelectedRange] = useState<'sample' | 'all' | 'custom'>('sample');
  const [customStart, setCustomStart] = useState('2026-09-16');
  const [customEnd, setCustomEnd] = useState('2026-10-15');
  const [editingMeal, setEditingMeal] = useState<MealRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Meal Form state
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newLunch, setNewLunch] = useState(true);
  const [newDinner, setNewDinner] = useState(true);
  const [newNotes, setNewNotes] = useState('');

  // Determine active date range
  let activeStart = '2026-09-16';
  let activeEnd = '2026-10-15';

  if (selectedRange === 'all') {
    activeStart = meals.length > 0 ? meals[0].date : '';
    activeEnd = meals.length > 0 ? meals[meals.length - 1].date : '';
  } else if (selectedRange === 'custom') {
    activeStart = customStart;
    activeEnd = customEnd;
  }

  // Filtered meals
  const filteredMeals = meals
    .filter((m) => {
      if (selectedRange !== 'all') {
        if (m.date < activeStart || m.date > activeEnd) return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          m.date.toLowerCase().includes(query) ||
          m.dayName.toLowerCase().includes(query) ||
          (m.notes && m.notes.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Billing summary
  const billing: BillingSummary = calculateBilling(
    filteredMeals,
    preferences.costPerTiffin,
    activeStart,
    activeEnd
  );

  // Toggle Lunch received inline
  const handleToggleLunch = (id: string) => {
    const updated = meals.map((m) => {
      if (m.id === id) {
        const nextLunch = !m.lunchReceived;
        const total = (nextLunch ? 1 : 0) + (m.dinnerReceived ? 1 : 0);
        return {
          ...m,
          lunchReceived: nextLunch,
          totalReceived: total,
          dailyCost: total * preferences.costPerTiffin,
        };
      }
      return m;
    });
    onUpdateMeals(updated);
  };

  // Toggle Dinner received inline
  const handleToggleDinner = (id: string) => {
    const updated = meals.map((m) => {
      if (m.id === id) {
        const nextDinner = !m.dinnerReceived;
        const total = (m.lunchReceived ? 1 : 0) + (nextDinner ? 1 : 0);
        return {
          ...m,
          dinnerReceived: nextDinner,
          totalReceived: total,
          dailyCost: total * preferences.costPerTiffin,
        };
      }
      return m;
    });
    onUpdateMeals(updated);
  };

  // Quick action today
  const todayStr = '2026-10-12'; // Aligned with runtime context or real date
  const todayRecord = meals.find((m) => m.date === todayStr) || meals[meals.length - 1];

  const handleDownloadPDF = () => {
    generateTiffinRecordPDF(filteredMeals, billing, {
      studentName: preferences.examTarget ? `Aspirant (${preferences.examTarget})` : 'Aspirant',
      messName: preferences.messName,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeal) return;
    const total = (editingMeal.lunchReceived ? 1 : 0) + (editingMeal.dinnerReceived ? 1 : 0);
    const updatedRecord: MealRecord = {
      ...editingMeal,
      totalReceived: total,
      dailyCost: total * preferences.costPerTiffin,
    };
    const updated = meals.map((m) => (m.id === updatedRecord.id ? updatedRecord : m));
    onUpdateMeals(updated);
    setEditingMeal(null);
  };

  const handleAddNewMeal = (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(newDate + 'T00:00:00');
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const total = (newLunch ? 1 : 0) + (newDinner ? 1 : 0);

    const newRecord: MealRecord = {
      id: newDate,
      date: newDate,
      dayName,
      lunchReceived: newLunch,
      dinnerReceived: newDinner,
      totalReceived: total,
      dailyCost: total * preferences.costPerTiffin,
      notes: newNotes,
    };

    // Replace if exists, else append & sort
    const existingIdx = meals.findIndex((m) => m.date === newDate);
    let updated: MealRecord[];
    if (existingIdx >= 0) {
      updated = [...meals];
      updated[existingIdx] = newRecord;
    } else {
      updated = [...meals, newRecord].sort((a, b) => a.date.localeCompare(b.date));
    }

    onUpdateMeals(updated);
    setShowAddModal(false);
    setNewNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Today's Quick Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Tiffin Status Card */}
        <div className="md:col-span-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Today's Tiffin Log
                </span>
                <h2 className="text-xl font-bold mt-1">
                  {todayRecord ? `${todayRecord.date} (${todayRecord.dayName})` : 'Today'}
                </h2>
                <p className="text-amber-100 text-xs mt-0.5">
                  Mess: {preferences.messName} • ₹{preferences.costPerTiffin} per meal
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black">
                  ₹{todayRecord ? todayRecord.dailyCost : 0}
                </div>
                <div className="text-[11px] text-amber-100">
                  {todayRecord ? todayRecord.totalReceived : 0} / 2 Delivered
                </div>
              </div>
            </div>

            {/* Quick Toggle Buttons */}
            {todayRecord && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => handleToggleLunch(todayRecord.id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border font-medium text-xs transition-all ${
                    todayRecord.lunchReceived
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                      : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Lunch (1:00 PM)</span>
                  </span>
                  <span className="text-sm font-bold">
                    {todayRecord.lunchReceived ? '✓ Received' : '○ Not Received'}
                  </span>
                </button>

                <button
                  onClick={() => handleToggleDinner(todayRecord.id)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border font-medium text-xs transition-all ${
                    todayRecord.dinnerReceived
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                      : 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Dinner (8:30 PM)</span>
                  </span>
                  <span className="text-sm font-bold">
                    {todayRecord.dinnerReceived ? '✓ Received' : '○ Not Received'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Month Stat Card matching PDF summary */}
        <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Billing Summary</span>
              <span className="text-emerald-400 font-semibold">{billing.daysCovered} Days</span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white">
              ₹{billing.totalCost.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-stone-400 mt-1">
              {billing.receivedTiffins} received / {billing.scheduledTiffins} scheduled (Saved ₹{billing.missedTiffins * billing.costPerTiffin} on {billing.missedTiffins} missed meals)
            </p>
          </div>

          <div className="pt-3 border-t border-stone-800 flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold text-xs py-2 px-3 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Record</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control bar: Range filter, Search, and Add Record */}
      <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Range tabs */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setSelectedRange('sample')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedRange === 'sample' ? 'bg-white shadow-2xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Current Cycle (16 Sep - 15 Oct)
            </button>
            <button
              onClick={() => setSelectedRange('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedRange === 'all' ? 'bg-white shadow-2xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setSelectedRange('custom')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedRange === 'custom' ? 'bg-white shadow-2xs text-stone-900 font-bold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Log Date</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        </div>

        {/* Custom Date Inputs & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-stone-100">
          {selectedRange === 'custom' && (
            <div className="flex items-center gap-2 text-xs text-stone-600 w-full sm:w-auto">
              <span>From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 border border-stone-300 rounded text-xs"
              />
              <span>To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 border border-stone-300 rounded text-xs"
              />
            </div>
          )}

          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search date, day (e.g. Wednesday), or notes (e.g. library, mock exam)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Main Records Table reproducing the exact layout of the PDF */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Tiffin Attendance &amp; Cost Sheet ({billing.periodStart} to {billing.periodEnd})
            </h3>
            <p className="text-xs text-stone-500">
              Click checkboxes or table rows to toggle meal delivery status or edit notes.
            </p>
          </div>
          <div className="text-xs text-stone-600 font-medium bg-white px-3 py-1 rounded-md border border-stone-200">
            Rate: ₹{preferences.costPerTiffin} / tiffin
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3 text-center">Lunch</th>
                <th className="px-4 py-3 text-center">Dinner</th>
                <th className="px-4 py-3 text-center">Received</th>
                <th className="px-4 py-3 text-right">Daily Cost</th>
                <th className="px-4 py-3 text-left">Notes / Reason</th>
                <th className="px-3 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredMeals.map((meal, index) => {
                const isZero = meal.totalReceived === 0;
                const isPartial = meal.totalReceived === 1;

                return (
                  <tr
                    key={meal.id}
                    className={`transition-colors hover:bg-amber-50/50 ${
                      isZero ? 'bg-stone-50/70 text-stone-400' : index % 2 === 1 ? 'bg-stone-50/30' : 'bg-white'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-stone-800 whitespace-nowrap">
                      {meal.date}
                    </td>
                    <td className="px-4 py-2.5 text-stone-600 whitespace-nowrap">
                      {meal.dayName}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => handleToggleLunch(meal.id)}
                        title="Click to toggle Lunch"
                        className={`w-6 h-6 rounded inline-flex items-center justify-center font-bold text-sm transition-transform active:scale-90 ${
                          meal.lunchReceived
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-stone-100 text-stone-300 border border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {meal.lunchReceived ? '✓' : ''}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => handleToggleDinner(meal.id)}
                        title="Click to toggle Dinner"
                        className={`w-6 h-6 rounded inline-flex items-center justify-center font-bold text-sm transition-transform active:scale-90 ${
                          meal.dinnerReceived
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-stone-100 text-stone-300 border border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {meal.dinnerReceived ? '✓' : ''}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-stone-800">
                      {meal.totalReceived}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-stone-900 whitespace-nowrap">
                      ₹{meal.dailyCost}
                    </td>
                    <td className="px-4 py-2.5 text-stone-500 max-w-xs truncate">
                      {meal.notes || (isZero ? 'Skipped / Off' : isPartial ? 'Partial delivery' : '—')}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => setEditingMeal(meal)}
                        className="p-1 hover:bg-stone-200 rounded text-stone-500 hover:text-stone-800"
                        title="Edit entry details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Footer Box matching user's PDF exact structure */}
        <div className="p-4 bg-stone-50 border-t border-stone-200">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
            <div className="p-2.5 bg-white rounded-xl border border-stone-200">
              <div className="text-[11px] text-stone-500">Scheduled tiffins</div>
              <div className="text-base font-bold text-stone-900 mt-0.5">{billing.scheduledTiffins}</div>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200">
              <div className="text-[11px] text-stone-500">Tiffins missed</div>
              <div className="text-base font-bold text-rose-600 mt-0.5">{billing.missedTiffins}</div>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200">
              <div className="text-[11px] text-stone-500">Tiffins received</div>
              <div className="text-base font-bold text-emerald-600 mt-0.5">{billing.receivedTiffins}</div>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200">
              <div className="text-[11px] text-stone-500">Cost per tiffin</div>
              <div className="text-base font-bold text-stone-900 mt-0.5">₹{billing.costPerTiffin}</div>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200 bg-amber-50/50">
              <div className="text-[11px] text-stone-500">Total cost</div>
              <div className="text-base font-extrabold text-amber-700 mt-0.5">
                ₹{billing.totalCost.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200">
              <div className="text-[11px] text-stone-500">Days covered</div>
              <div className="text-base font-bold text-stone-900 mt-0.5">{billing.daysCovered}</div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-1 border-t border-stone-200 pt-2">
            <span>
              <strong>Legend:</strong> ✓ = tiffin received; blank = tiffin not received. Partial days are marked with one ✓.
            </span>
            <span className="text-stone-400">Offline-capable • Auto-calculated billing</span>
          </div>
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-stone-900">
              Edit Tiffin Record - {editingMeal.date}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">{editingMeal.dayName}</p>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-stone-700 block">Meal Delivery Attendance</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={editingMeal.lunchReceived}
                      onChange={(e) =>
                        setEditingMeal({ ...editingMeal, lunchReceived: e.target.checked })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-medium text-stone-800">Lunch (₹{preferences.costPerTiffin})</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={editingMeal.dinnerReceived}
                      onChange={(e) =>
                        setEditingMeal({ ...editingMeal, dinnerReceived: e.target.checked })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-medium text-stone-800">Dinner (₹{preferences.costPerTiffin})</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Daily Reason / Notes</label>
                <textarea
                  value={editingMeal.notes || ''}
                  onChange={(e) => setEditingMeal({ ...editingMeal, notes: e.target.value })}
                  placeholder="e.g., Skipped dinner due to test series, late arrival by 40 mins..."
                  className="w-full p-2.5 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingMeal(null)}
                  className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Add or Log Meal Date</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Record attendance for any past or upcoming date.
            </p>

            <form onSubmit={handleAddNewMeal} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-stone-700 block">Attendance Received</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={newLunch}
                      onChange={(e) => setNewLunch(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span className="font-medium text-stone-800">Lunch Received</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                    <input
                      type="checkbox"
                      checked={newDinner}
                      onChange={(e) => setNewDinner(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span className="font-medium text-stone-800">Dinner Received</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Notes / Reason</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Sunday special meal, fasted on Ekadashi..."
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
