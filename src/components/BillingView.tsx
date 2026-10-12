import React, { useState } from 'react';
import { MealRecord, UserPreferences } from '../types';
import { calculateBilling } from '../lib/storage';
import { generateTiffinRecordPDF } from '../lib/pdfGenerator';
import { Download, CheckCircle, Calculator, FileCheck, IndianRupee, PieChart, ShieldAlert } from 'lucide-react';

interface BillingViewProps {
  meals: MealRecord[];
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  meals,
  preferences,
  onUpdatePreferences,
}) => {
  const [rate, setRate] = useState(preferences.costPerTiffin);
  const [selectedCycle, setSelectedCycle] = useState('2026-09-16_2026-10-15');
  const [isPaid, setIsPaid] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

  // 16 Sep to 15 Oct 2026
  const billing = calculateBilling(meals, rate, '2026-09-16', '2026-10-15');

  const handleUpdateRate = (newRate: number) => {
    setRate(newRate);
    onUpdatePreferences({ ...preferences, costPerTiffin: newRate });
  };

  const handleDownloadPDF = () => {
    generateTiffinRecordPDF(
      meals.filter((m) => m.date >= '2026-09-16' && m.date <= '2026-10-15'),
      billing,
      {
        studentName: `Aspirant (${preferences.examTarget})`,
        messName: preferences.messName,
      }
    );
  };

  const totalPossible = billing.scheduledTiffins * rate;
  const savedAmount = billing.missedTiffins * rate;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase">
                Automated Mess Accounting
              </span>
              <span className="text-xs text-stone-500">Cycle: 16 Sep 2026 - 15 Oct 2026</span>
            </div>
            <h2 className="text-2xl font-black text-stone-900 mt-1">
              Monthly Tiffin Settlement
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Accurate billing strictly calculated based on recorded attendance. You only pay for meals received!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Statement</span>
            </button>
          </div>
        </div>

        {/* Big numbers highlight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-xs font-semibold text-amber-800">Total Payable Amount</div>
            <div className="text-3xl font-black text-amber-900 mt-1">
              ₹{billing.totalCost.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-amber-700 mt-1">
              {billing.receivedTiffins} meals × ₹{billing.costPerTiffin}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-xs font-semibold text-emerald-800">Deduction (Money Saved)</div>
            <div className="text-3xl font-black text-emerald-900 mt-1">
              ₹{savedAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">
              {billing.missedTiffins} missed meals deducted
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div className="text-xs font-semibold text-stone-600">Attendance Rate</div>
            <div className="text-3xl font-black text-stone-900 mt-1">
              {billing.scheduledTiffins > 0
                ? Math.round((billing.receivedTiffins / billing.scheduledTiffins) * 100)
                : 0}
              %
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              {billing.receivedTiffins} of {billing.scheduledTiffins} scheduled meals
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div className="text-xs font-semibold text-stone-600">Rate Configuration</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-stone-900">₹</span>
              <input
                type="number"
                min={20}
                max={200}
                value={rate}
                onChange={(e) => handleUpdateRate(Number(e.target.value))}
                className="w-20 px-2 py-0.5 border border-stone-300 rounded font-bold text-lg"
              />
              <span className="text-xs text-stone-500">/ meal</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              Mess: {preferences.messName}
            </div>
          </div>
        </div>
      </div>

      {/* Bill Breakdown and Dispute Proof */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-600" />
            <span>Audit Breakdown &amp; Mess Dispute Proof</span>
          </h3>
          <p className="text-xs text-stone-500">
            Hostel aspirants often get overcharged when mess operators claim "full 30 days counted". Here is your verified mathematical proof:
          </p>

          <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 text-xs">
            <div className="p-3 flex items-center justify-between bg-stone-50 font-semibold text-stone-700">
              <span>Metric</span>
              <span>Calculation &amp; Units</span>
            </div>
            <div className="p-3 flex items-center justify-between text-stone-800">
              <span>Cycle Dates</span>
              <span>16 September 2026 – 15 October 2026 ({billing.daysCovered} days)</span>
            </div>
            <div className="p-3 flex items-center justify-between text-stone-800">
              <span>Standard Schedule (Lunch + Dinner)</span>
              <span>{billing.daysCovered} days × 2 = {billing.scheduledTiffins} tiffins</span>
            </div>
            <div className="p-3 flex items-center justify-between text-emerald-800 font-medium">
              <span>Actual Tiffins Received (Attended)</span>
              <span>{billing.receivedTiffins} tiffins</span>
            </div>
            <div className="p-3 flex items-center justify-between text-rose-800 font-medium">
              <span>Tiffins Missed / Cancelled in advance</span>
              <span>{billing.missedTiffins} tiffins</span>
            </div>
            <div className="p-3 flex items-center justify-between text-stone-800">
              <span>Contract Cost per Tiffin</span>
              <span>₹{billing.costPerTiffin}</span>
            </div>
            <div className="p-3 flex items-center justify-between bg-amber-50 font-bold text-amber-900 text-sm">
              <span>Final Certified Net Total</span>
              <span>₹{billing.totalCost.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Transparent Verification: </span>
              Your PDF report contains daily checkmarks (✓) for every individual lunch and dinner. Mess owners can audit each date line-by-line without disputes!
            </div>
          </div>
        </div>

        {/* Settlement & UPI Payment Record */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <span>Payment Settlement</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Mark this cycle as settled and record transaction details for your records.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200 text-center">
              <div className="text-xs text-stone-500">Amount Due for {billing.periodStart.slice(0, 7)}</div>
              <div className="text-2xl font-black text-stone-900 mt-1">
                ₹{billing.totalCost.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                {isPaid ? 'Payment Recorded ✓' : 'Pending Settlement'}
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  UPI Reference / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g., UPI/628104829103/Paytm"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="font-medium text-stone-800">
                  Paid to {preferences.messName}
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate Official PDF Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
