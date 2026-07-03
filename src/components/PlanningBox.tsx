import { WeatherRecommendations } from "../types";
import { Sparkles, ShieldCheck, HeartPulse, Shirt, CalendarRange, MapPin, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface PlanningBoxProps {
  recommendations: WeatherRecommendations | null;
  isLoading: boolean;
  onRefresh: () => void;
  isFallback: boolean;
}

export default function PlanningBox({ recommendations, isLoading, onRefresh, isFallback }: PlanningBoxProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-100/50 border border-dashed border-slate-800 dark:border-slate-800 border-slate-300 p-8 rounded-2xl flex flex-col items-center justify-center gap-4 text-center min-h-[250px]" id="planning-loading">
        <div className="relative">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <Sparkles className="w-4 h-4 text-amber-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-mono uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400 light:text-slate-600">Querying Aether Synthesis Engine</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Generating personalized planning intelligence...</p>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="bg-slate-900/10 dark:bg-slate-900/10 light:bg-slate-150 border border-slate-800 dark:border-slate-800 border-slate-200 p-6 rounded-2xl text-center" id="planning-empty">
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Aether intelligence system uninitialized.</p>
        <button
          onClick={onRefresh}
          className="mt-3 px-4 py-2 bg-blue-600 text-xs text-white font-mono uppercase tracking-wider rounded-lg hover:bg-blue-500 transition"
        >
          Synthesize Intelligence
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      id="planning-box"
    >
      {/* Primary summary bubble */}
      <div className="bg-blue-600/10 dark:bg-blue-900/10 light:bg-blue-50 border-l-4 border-blue-500 p-6 md:p-8 rounded-r-3xl shadow-md relative">
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span className="text-[9px] font-mono border border-blue-500/30 text-blue-400 dark:text-blue-400 light:text-blue-600 px-1.5 py-0.5 rounded uppercase">
            {isFallback ? "Rule Engine V1.2" : "Gemini 3.5 Flash"}
          </span>
          <button
            onClick={onRefresh}
            className="p-1 rounded-lg hover:bg-blue-500/10 text-blue-400 transition"
            title="Recalculate recommendations"
            id="re-synthesize-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-blue-500 dark:text-blue-400 light:text-blue-600 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 animate-spin-slow" /> Tactical Intelligence Summary
        </h3>
        <p className="text-xl md:text-2xl font-serif italic leading-relaxed text-slate-100 dark:text-slate-100 light:text-slate-900">
          "{recommendations.summary}"
        </p>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Clothing Suggestions */}
        <div className="bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-50 border border-slate-800/60 dark:border-slate-800/60 border-slate-200 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 light:text-slate-600 mb-3 flex items-center gap-1.5">
              <Shirt className="w-4 h-4 text-emerald-500" /> Layering & Apparel
            </h4>
            <ul className="space-y-2 text-xs text-slate-350 dark:text-slate-300 light:text-slate-700">
              {recommendations.clothing.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 select-none">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Suitable Activities */}
        <div className="bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-50 border border-slate-800/60 dark:border-slate-800/60 border-slate-200 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 light:text-slate-600 mb-3 flex items-center gap-1.5">
              <CalendarRange className="w-4 h-4 text-cyan-500" /> Optimal Activities
            </h4>
            <ul className="space-y-2 text-xs text-slate-350 dark:text-slate-300 light:text-slate-700">
              {recommendations.activities.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5 select-none">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Health & Safety Precautions */}
        <div className="bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-50 border border-slate-800/60 dark:border-slate-800/60 border-slate-200 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 light:text-slate-600 mb-3 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-500 animate-pulse" /> Safety Precautions
            </h4>
            <ul className="space-y-2 text-xs text-slate-350 dark:text-slate-300 light:text-slate-700 font-medium">
              {recommendations.precautions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-250 dark:text-slate-200 light:text-slate-800">
                  <span className="text-rose-500 mt-0.5 select-none">!</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Hourly Best Timeframe */}
        <div className="bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-50 border border-slate-800/60 dark:border-slate-800/60 border-slate-200 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 light:text-slate-600 mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-500" /> Best Time Windows
            </h4>
            <p className="text-sm font-medium text-slate-200 dark:text-slate-200 light:text-slate-900 leading-relaxed font-sans">
              {recommendations.hourly_best}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
