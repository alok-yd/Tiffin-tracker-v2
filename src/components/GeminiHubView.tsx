import React, { useState, useRef, useEffect } from 'react';
import { UserPreferences, MealRecord, BillingSummary } from '../types';
import {
  Sparkles,
  Bot,
  Brain,
  Image as ImageIcon,
  Camera,
  Send,
  Loader2,
  Ratio,
  Maximize2,
  Download,
  Flame,
  CheckCircle,
  HelpCircle,
  User,
  Zap,
} from 'lucide-react';

interface GeminiHubViewProps {
  preferences: UserPreferences;
  meals: MealRecord[];
  billing: BillingSummary;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export const GeminiHubView: React.FC<GeminiHubViewProps> = ({
  preferences,
  meals,
  billing,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'analyze' | 'generate' | 'thinking'>('chat');

  // --- 1. Multi-turn Chat State ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Namaste! I am your AI Mess & Nutrition Advisor for ${preferences.examTarget}. How can I assist you with your daily tiffin schedule, diet stamina, or mess billing today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatModel, setChatModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview'>('gemini-3.5-flash');
  const [chatRole, setChatRole] = useState('dietitian');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const roleInstructions: Record<string, string> = {
    dietitian:
      'You are an expert student dietitian specializing in long study hours for competitive exams (UPSC, JEE, NEET). Suggest light, high-protein tiffin choices that prevent afternoon lethargy.',
    auditor:
      'You are a strict mess billing auditor and student rights advocate. Help aspirants reconcile meal counts, dispute overcharges with mess owners diplomatically, and calculate refunds.',
    quick_tips:
      'You are a fast, concise student assistant. Give quick 2-bullet answers for meal timings, hydration, and quick snacks during study breaks.',
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newThread = [...messages, userMsg];
    setMessages(newThread);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newThread.map((m) => ({ role: m.role, content: m.content })),
          model: chatModel,
          systemRole: roleInstructions[chatRole],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch reply');

      const botMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed,
      };
      setMessages([...newThread, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message || 'Unable to connect to Gemini API.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newThread, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- 2. Image Analysis State ---
  const [analyzeImageBase64, setAnalyzeImageBase64] = useState<string | null>(null);
  const [analyzePrompt, setAnalyzePrompt] = useState(
    'Analyze this tiffin meal plate. Count rotis, estimate protein and calories, evaluate freshness, and suggest feedback for my mess cook.'
  );
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAnalyzeImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = async () => {
    if (!analyzeImageBase64 || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalyzeResult(null);

    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: analyzeImageBase64,
          mimeType: 'image/jpeg',
          prompt: analyzePrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze image');
      setAnalyzeResult(data.analysis);
    } catch (err: any) {
      setAnalyzeResult(`Error analyzing image: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- 3. Image Generation State ---
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imagePrompt, setImagePrompt] = useState(
    'Steel Indian tiffin box with 4 fresh chapatis, yellow dal tadka, aloo gobi, and mint raita, study desk background with books'
  );
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageQuality, setImageQuality] = useState<'standard' | 'studio'>('standard');

  const aspectRatios = [
    { label: '1:1 Square (Instagram/Profile)', value: '1:1' },
    { label: '4:3 Standard Photo', value: '4:3' },
    { label: '16:9 Landscape (Dashboard Banner)', value: '16:9' },
    { label: '3:2 Classic Photo', value: '3:2' },
    { label: '2:3 Classic Portrait', value: '2:3' },
    { label: '3:4 Mobile Card', value: '3:4' },
    { label: '9:16 Vertical Story', value: '9:16' },
    { label: '21:9 Ultra-wide Panorama', value: '21:9' },
  ];

  const handleGenerateImage = async () => {
    if (!imagePrompt || isGeneratingImage) return;
    setIsGeneratingImage(true);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio,
          quality: imageQuality,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate image');
      setGeneratedImage(data.imageUrl);
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // --- 4. High Thinking Mode State ---
  const [thinkingPrompt, setThinkingPrompt] = useState(
    'Based on my current attendance (54 received out of 60 scheduled, 6 missed) at ₹55/tiffin, calculate exact weekly cost breakdown, draft a diplomatic WhatsApp message for my mess owner to deduct the ₹330 for missed meals, and recommend an ideal high-concentration meal timetable for my 12-hour study routine.'
  );
  const [thinkingResult, setThinkingResult] = useState<string | null>(null);
  const [isThinkingRunning, setIsThinkingRunning] = useState(false);

  const handleRunThinking = async () => {
    if (!thinkingPrompt || isThinkingRunning) return;
    setIsThinkingRunning(true);
    setThinkingResult(null);

    try {
      const res = await fetch('/api/thinking-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: thinkingPrompt,
          context: {
            messName: preferences.messName,
            rate: preferences.costPerTiffin,
            examTarget: preferences.examTarget,
            billingSummary: billing,
            dietType: preferences.dietType,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deep thinking failed');
      setThinkingResult(data.analysis);
    } catch (err: any) {
      setThinkingResult(`Thinking error: ${err.message}`);
    } finally {
      setIsThinkingRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and AI Sub Tabs */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full uppercase">
                Gemini 3 Suite
              </span>
              <span className="text-xs text-stone-500">Multimodal AI Engine</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mt-1">
              Gemini AI Aspirant Intelligence
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Multi-turn chatbot, food photo nutrition scanner, high reasoning thinking mode, and visual meal generator.
            </p>
          </div>

          <div className="flex flex-wrap items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'chat' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-indigo-600" />
              <span>Multi-turn Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('analyze')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'analyze' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>Analyze Food Photo</span>
            </button>
            <button
              onClick={() => setActiveTab('thinking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'thinking' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-purple-600" />
              <span>High Thinking Mode</span>
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'generate' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>Image Aspect Ratios</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- TAB 1: MULTI-TURN CHATBOT --- */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col h-[600px]">
          {/* Chat Settings Bar */}
          <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-700">Model:</span>
              <select
                value={chatModel}
                onChange={(e) => setChatModel(e.target.value as any)}
                className="bg-white border border-stone-300 rounded px-2.5 py-1 text-xs font-medium"
              >
                <option value="gemini-3.5-flash">gemini-3.5-flash (General Tasks)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Tasks)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-700">Role:</span>
              <select
                value={chatRole}
                onChange={(e) => setChatRole(e.target.value)}
                className="bg-white border border-stone-300 rounded px-2.5 py-1 text-xs font-medium"
              >
                <option value="dietitian">Student Dietitian (Stamina &amp; Nutrition)</option>
                <option value="auditor">Mess Bill Auditor &amp; Dispute Arbiter</option>
                <option value="quick_tips">Quick Tips &amp; Hydration Coach</option>
              </select>
            </div>
          </div>

          {/* Scrollable Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-2xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                    m.role === 'user' ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs space-y-1.5 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-amber-600 text-white rounded-tr-xs'
                      : 'bg-stone-100 text-stone-800 rounded-tl-xs border border-stone-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  <div className="flex items-center justify-between text-[10px] opacity-70 pt-1">
                    <span>{m.timestamp}</span>
                    {m.modelUsed && <span>{m.modelUsed}</span>}
                  </div>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-center gap-2 text-xs text-stone-500 italic p-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Gemini is thinking and drafting guidance...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-stone-200 flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about healthy mess meals, meal timing before exams, or billing rules..."
              className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isChatLoading || !inputMessage.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 2: ANALYZE IMAGES (gemini-3.1-pro-preview) --- */}
      {activeTab === 'analyze' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>Upload Photo (Tiffin Plate / Mess Bill)</span>
            </h3>
            <p className="text-xs text-stone-500">
              Uses <strong>gemini-3.1-pro-preview</strong> to inspect your tiffin plate, estimate portion balance, count rotis, or extract attendance data from paper mess cards.
            </p>

            <div className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center hover:bg-stone-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer block space-y-2">
                {analyzeImageBase64 ? (
                  <img
                    src={analyzeImageBase64}
                    alt="Uploaded meal"
                    className="max-h-56 mx-auto rounded-lg object-contain shadow-xs"
                  />
                ) : (
                  <div className="py-6">
                    <Camera className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                    <span className="text-xs font-semibold text-stone-700 block">
                      Click to upload thali or receipt photo
                    </span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      PNG, JPG, or WEBP up to 10MB
                    </span>
                  </div>
                )}
              </label>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block text-xs mb-1">
                Prompt / Specific Question for Gemini
              </label>
              <textarea
                value={analyzePrompt}
                onChange={(e) => setAnalyzePrompt(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                rows={3}
              />
            </div>

            <button
              onClick={handleAnalyzeImage}
              disabled={!analyzeImageBase64 || isAnalyzing}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing with gemini-3.1-pro-preview...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Meal with Gemini 3.1 Pro</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Nutritional &amp; Quality Analysis Output</span>
            </h3>

            {analyzeResult ? (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs text-stone-800 leading-relaxed whitespace-pre-wrap max-h-[460px] overflow-y-auto">
                {analyzeResult}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-stone-400 border border-stone-200 rounded-xl bg-stone-50">
                Upload a photo of your meal or mess receipt on the left to see instant Gemini 3.1 Pro vision insights.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: HIGH THINKING MODE (gemini-3.1-pro-preview + ThinkingLevel.HIGH) --- */}
      {activeTab === 'thinking' && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">
                  High Thinking Reasoning Engine
                </h3>
                <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full uppercase">
                  ThinkingLevel.HIGH
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Powered by <strong>gemini-3.1-pro-preview</strong> with high cognitive reasoning. Ideal for complex hostel dispute arbitration, monthly mess contract analysis, and multi-variable study routine optimization.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-semibold text-stone-700 block">
              Complex Strategic Query:
            </label>
            <textarea
              value={thinkingPrompt}
              onChange={(e) => setThinkingPrompt(e.target.value)}
              className="w-full p-3 border border-stone-300 rounded-xl text-xs focus:ring-1 focus:ring-purple-500"
              rows={4}
            />
          </div>

          <button
            onClick={handleRunThinking}
            disabled={isThinkingRunning || !thinkingPrompt.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            {isThinkingRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reasoning with High Thinking...</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Execute High Thinking Analysis</span>
              </>
            )}
          </button>

          {thinkingResult && (
            <div className="mt-4 p-5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">
              <div className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <span>Deep Strategic Reasoning Output:</span>
              </div>
              {thinkingResult}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: IMAGE GENERATION WITH ASPECT RATIOS --- */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Ratio className="w-4 h-4 text-amber-600" />
                <span>Aspect Ratio Controlled Image Generation</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Generate wholesome visual meal guides, student recipe posters, or custom mess cards.
              </p>
            </div>

            {/* Aspect Ratio Affordance */}
            <div>
              <label className="font-semibold text-stone-700 block text-xs mb-2">
                Choose Aspect Ratio:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {aspectRatios.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setAspectRatio(r.value)}
                    className={`p-2 rounded-lg border text-left transition-all text-[11px] ${
                      aspectRatio === r.value
                        ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="font-mono">{r.value}</div>
                    <div className="text-[9px] opacity-80 truncate">{r.label.split(' ')[1] || ''}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Model & Quality Selection */}
            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-stone-700">Model Engine:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="quality"
                  checked={imageQuality === 'standard'}
                  onChange={() => setImageQuality('standard')}
                  className="text-amber-600"
                />
                <span>gemini-nano-banana-2.1</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="quality"
                  checked={imageQuality === 'studio'}
                  onChange={() => setImageQuality('studio')}
                  className="text-amber-600"
                />
                <span>gemini-3-pro-image-preview (Studio)</span>
              </label>
            </div>

            {/* Prompt input */}
            <div>
              <label className="font-semibold text-stone-700 block text-xs mb-1">
                Visual Description Prompt:
              </label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs"
                rows={3}
              />
            </div>

            <button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || !imagePrompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating ({aspectRatio})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Tiffin Image ({aspectRatio})</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-col items-center justify-center text-center">
            {generatedImage ? (
              <div className="space-y-3 w-full">
                <img
                  src={generatedImage}
                  alt="Generated Tiffin"
                  className="max-h-80 mx-auto rounded-xl shadow-md object-contain border border-stone-200"
                />
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="font-semibold text-stone-600">Aspect Ratio: {aspectRatio}</span>
                  <a
                    href={generatedImage}
                    download={`tiffin_${aspectRatio.replace(':', 'x')}.png`}
                    className="flex items-center gap-1 px-3 py-1 bg-stone-900 text-white rounded-lg text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-12 text-stone-400 space-y-2">
                <ImageIcon className="w-10 h-10 mx-auto text-stone-300" />
                <p className="text-xs">
                  Select your desired aspect ratio (1:1, 16:9, 9:16, 4:3, etc.) and click Generate to see photorealistic tiffin visuals.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
