import React, { useState } from 'react';
import { UserPreferences, FeedbackItem } from '../types';
import { Star, MessageSquare, Sliders, Check, Plus, AlertCircle, ThumbsUp, Send } from 'lucide-react';

interface PreferencesAndFeedbackViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  feedbacks: FeedbackItem[];
  onUpdateFeedbacks: (fbs: FeedbackItem[]) => void;
}

export const PreferencesAndFeedbackView: React.FC<PreferencesAndFeedbackViewProps> = ({
  preferences,
  onUpdatePreferences,
  feedbacks,
  onUpdateFeedbacks,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'preferences' | 'feedback'>('preferences');
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);
  const [isSaved, setIsSaved] = useState(false);

  // New feedback state
  const [rating, setRating] = useState(4);
  const [mealType, setMealType] = useState<'Lunch' | 'Dinner' | 'Both'>('Lunch');
  const [category, setCategory] = useState<FeedbackItem['category']>('Food Quality');
  const [comment, setComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePreferences(localPrefs);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const newFb: FeedbackItem = {
      id: `fb-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      mealType,
      rating,
      category,
      comment,
      status: 'Logged',
      createdAt: new Date().toISOString(),
    };

    onUpdateFeedbacks([newFb, ...feedbacks]);
    setComment('');
    setFeedbackSuccess(true);
    setTimeout(() => setFeedbackSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Sub tabs */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase">
                Aspirant Experience
              </span>
              <span className="text-xs text-stone-500">Hostel &amp; Mess Dashboard</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mt-1">
              Meal Preferences &amp; Daily Feedback
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Set customized food instructions (spice, roti count, Jain options) and log transparent reviews for the mess manager.
            </p>
          </div>

          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('preferences')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                activeSubTab === 'preferences'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Dietary Preferences</span>
            </button>
            <button
              onClick={() => setActiveSubTab('feedback')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                activeSubTab === 'feedback'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Feedback Log ({feedbacks.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Form */}
      {activeSubTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Exam Target & Mess Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 pb-2 border-b border-stone-100">
                Aspirant &amp; Vendor Profile
              </h3>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Competitive Exam Target</label>
                <input
                  type="text"
                  value={localPrefs.examTarget}
                  onChange={(e) => setLocalPrefs({ ...localPrefs, examTarget: e.target.value })}
                  placeholder="e.g. UPSC CSE, JEE Advanced, NEET-UG, GATE"
                  className="w-full p-2.5 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Mess / Tiffin Provider Name</label>
                <input
                  type="text"
                  value={localPrefs.messName}
                  onChange={(e) => setLocalPrefs({ ...localPrefs, messName: e.target.value })}
                  className="w-full p-2.5 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Mess Contact Number</label>
                <input
                  type="text"
                  value={localPrefs.messPhone}
                  onChange={(e) => setLocalPrefs({ ...localPrefs, messPhone: e.target.value })}
                  className="w-full p-2.5 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Hostel Room &amp; Delivery Address</label>
                <textarea
                  value={localPrefs.deliveryAddress}
                  onChange={(e) => setLocalPrefs({ ...localPrefs, deliveryAddress: e.target.value })}
                  className="w-full p-2.5 border border-stone-300 rounded-lg"
                  rows={2}
                />
              </div>
            </div>

            {/* Diet & Taste Preferences */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 pb-2 border-b border-stone-100">
                Dietary &amp; Cooking Preferences
              </h3>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Diet Category</label>
                <select
                  value={localPrefs.dietType}
                  onChange={(e) =>
                    setLocalPrefs({
                      ...localPrefs,
                      dietType: e.target.value as any,
                    })
                  }
                  className="w-full p-2.5 border border-stone-300 rounded-lg bg-white"
                >
                  <option value="Vegetarian">Standard Vegetarian</option>
                  <option value="Jain (No Onion/Garlic)">Jain (No Onion/Garlic/Root veg)</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Spice Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Mild', 'Medium', 'Spicy'] as const).map((level) => (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setLocalPrefs({ ...localPrefs, spiceLevel: level })}
                      className={`p-2.5 rounded-lg border font-semibold text-center transition-colors ${
                        localPrefs.spiceLevel === level
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Roti / Rice Portion Customization</label>
                <input
                  type="text"
                  value={localPrefs.rotiPreference}
                  onChange={(e) => setLocalPrefs({ ...localPrefs, rotiPreference: e.target.value })}
                  placeholder="e.g. 4 Phulkas with Ghee, Extra Rice on Sundays"
                  className="w-full p-2.5 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Special Health / Study Notes for Cook</label>
                <textarea
                  value={localPrefs.specialInstructions}
                  onChange={(e) => setLocalPrefs({ ...localPrefs, specialInstructions: e.target.value })}
                  placeholder="e.g., Less oil in dinner for better nighttime concentration, low salt..."
                  className="w-full p-2.5 border border-stone-300 rounded-lg"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <div className="text-xs text-stone-500">
              Preferences are saved in offline storage and synchronized to your account.
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <ThumbsUp className="w-4 h-4" />}
              <span>{isSaved ? 'Preferences Saved!' : 'Save All Preferences'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Feedback Tab */}
      {activeSubTab === 'feedback' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Feedback Submission */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <span>Log Meal Quality Review</span>
            </h3>
            <p className="text-xs text-stone-500">
              Share constructive feedback or report cold food / delayed deliveries.
            </p>

            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
              {/* Star Rating */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1.5">Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-stone-700 ml-2">{rating} / 5</span>
                </div>
              </div>

              {/* Meal Type & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Meal</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as any)}
                    className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Issue / Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="Food Quality">Food Quality / Taste</option>
                    <option value="Late Delivery">Late Delivery</option>
                    <option value="Cold Food">Cold Food</option>
                    <option value="Portion Size">Portion Size</option>
                    <option value="Hygiene">Hygiene &amp; Packaging</option>
                    <option value="Other">Compliment / Other</option>
                  </select>
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Specific Feedback</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Sabzi had excess oil today; please send extra onions or lemons..."
                  className="w-full p-2.5 border border-stone-300 rounded-lg"
                  rows={3}
                  required
                />
              </div>

              {feedbackSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Feedback saved to your log!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </button>
            </form>
          </div>

          {/* Feedbacks History List */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-stone-900">
              Logged Feedback &amp; Mess Communication History
            </h3>

            {feedbacks.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500">
                No feedback recorded yet. Share your first review above!
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-bold text-stone-800">{fb.category}</span>
                        <span className="text-stone-400">•</span>
                        <span className="text-stone-500">{fb.mealType}</span>
                      </div>
                      <span className="text-[11px] text-stone-400">{fb.date}</span>
                    </div>

                    <p className="text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      "{fb.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
