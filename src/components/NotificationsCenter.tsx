import { useState, useEffect } from "react";
import { Bell, BellOff, X, AlertTriangle, AlertOctagon, Check, ShieldAlert, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WeatherAlert } from "../types";

interface NotificationsCenterProps {
  alerts: WeatherAlert[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onSimulateAlert: (severity: "info" | "warning" | "severe", title: string, message: string) => void;
  cityName: string;
}

export default function NotificationsCenter({
  alerts,
  onDismiss,
  onClearAll,
  onSimulateAlert,
  cityName
}: NotificationsCenterProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("weather_push_enabled") === "true";
  });
  const [showHistory, setShowHistory] = useState(false);
  const [simulatedPermission, setSimulatedPermission] = useState<"default" | "granted" | "denied">(() => {
    return (localStorage.getItem("weather_push_permission") as any) || "default";
  });

  useEffect(() => {
    localStorage.setItem("weather_push_enabled", String(isEnabled));
  }, [isEnabled]);

  useEffect(() => {
    localStorage.setItem("weather_push_permission", simulatedPermission);
  }, [simulatedPermission]);

  const requestPermission = async () => {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setSimulatedPermission(permission);
        if (permission === "granted") {
          setIsEnabled(true);
        }
      } catch (err) {
        setSimulatedPermission("granted"); // fallback simulation
        setIsEnabled(true);
      }
    } else {
      setSimulatedPermission("granted");
      setIsEnabled(true);
    }
  };

  const handleToggle = () => {
    if (!isEnabled && simulatedPermission !== "granted") {
      requestPermission();
    } else {
      setIsEnabled(!isEnabled);
    }
  };

  // Filter out dismissed alerts for active notifications popups
  const activeAlerts = alerts.filter(a => !a.dismissed);

  // Severe options for simulation
  const simulationScenarios = [
    {
      severity: "severe" as const,
      title: "Severe Thunderstorm Warning",
      message: `Severe warning for ${cityName || "your area"}. Damaging winds up to 70 km/h and intense lightning expected. Seek shelter.`
    },
    {
      severity: "warning" as const,
      title: "Excessive Heat Advisory",
      message: `High temperatures exceeding peak thresholds. UV index extreme. Restrict outdoor workouts to early hours.`
    },
    {
      severity: "info" as const,
      title: "Rapid Temperature Drop",
      message: `A sudden cold front is moving into ${cityName || "your area"}. Temperatures will plummet by 8°C in the next 3 hours.`
    }
  ];

  return (
    <div className="relative" id="notifications-center">
      {/* Settings Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isEnabled ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
            {isEnabled ? <Bell className="w-5 h-5 animate-pulse" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Severe Weather Push Alerts
              {isEnabled && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEnabled 
                ? "Active intelligence scanner is running in the background." 
                : "Enable push notifications for immediate severe storm warnings."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            id="toggle-history-btn"
          >
            History ({alerts.length})
          </button>
          
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isEnabled ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"}`}
            id="notification-toggle-switch"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>

      {/* Simulator Tools Panel */}
      <div className="mt-3 p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Weather Alert Simulator
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {simulationScenarios.map((sc, idx) => (
            <button
              key={idx}
              disabled={!isEnabled}
              onClick={() => onSimulateAlert(sc.severity, sc.title, sc.message)}
              className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition ${
                !isEnabled 
                  ? "bg-slate-100/50 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800/30 opacity-50 cursor-not-allowed" 
                  : sc.severity === "severe"
                    ? "bg-rose-50/50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-800 dark:text-rose-200"
                    : sc.severity === "warning"
                      ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-800 dark:text-amber-200"
                      : "bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-800 dark:text-blue-200"
              }`}
              id={`simulate-btn-${idx}`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs mb-1">
                {sc.severity === "severe" ? <AlertOctagon className="w-3.5 h-3.5" /> : sc.severity === "warning" ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                {sc.severity.toUpperCase()}
              </div>
              <span className="text-slate-700 dark:text-slate-300 font-medium text-xs truncate w-full">{sc.title}</span>
            </button>
          ))}
        </div>
        {!isEnabled && (
          <p className="text-[10px] text-amber-500 mt-2 text-center">
            ⚠️ Enable push alerts above to run simulations.
          </p>
        )}
      </div>

      {/* Popups Overlay (Standard Active Alerts) */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {isEnabled && activeAlerts.slice(-3).map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 50, transition: { duration: 0.15 } }}
              className={`p-4 rounded-2xl shadow-xl pointer-events-auto border flex gap-3 ${
                alert.severity === "severe"
                  ? "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100"
                  : alert.severity === "warning"
                    ? "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100"
                    : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100"
              }`}
              id={`popup-alert-${alert.id}`}
            >
              <div className="shrink-0 mt-0.5">
                {alert.severity === "severe" ? (
                  <AlertOctagon className="w-5 h-5 text-rose-500 animate-bounce" />
                ) : alert.severity === "warning" ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-blue-500" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    {alert.severity === "severe" ? "Critical Alert" : alert.severity === "warning" ? "Advisory" : "Weather Info"}
                  </span>
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
                    id={`dismiss-popup-${alert.id}`}
                  >
                    <X className="w-4 h-4 opacity-60 hover:opacity-100" />
                  </button>
                </div>
                <h4 className="font-bold text-sm mt-0.5">{alert.title}</h4>
                <p className="text-xs mt-1 leading-relaxed opacity-90">{alert.message}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[10px] opacity-60">
                  <span>{alert.city}</span>
                  <span>{alert.timestamp}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* History Modal / Drawer */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]"
              id="alert-history-modal"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">Weather Alert History</h3>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
                      <BellOff className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No warnings logged</p>
                      <p className="text-xs text-slate-400 mt-1">Simulated alerts or severe weather will display here.</p>
                    </div>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-2xl border flex gap-3 relative overflow-hidden ${
                        alert.dismissed 
                          ? "bg-slate-50 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-800/50 opacity-60" 
                          : alert.severity === "severe"
                            ? "bg-rose-50/50 dark:bg-rose-950/15 border-rose-200/80 dark:border-rose-900/60 text-rose-900 dark:text-rose-100"
                            : alert.severity === "warning"
                              ? "bg-amber-50/50 dark:bg-amber-950/15 border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-100"
                              : "bg-blue-50/50 dark:bg-blue-950/15 border-blue-200/80 dark:border-blue-900/60 text-blue-900 dark:text-blue-100"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {alert.severity === "severe" ? (
                          <AlertOctagon className="w-4 h-5 text-rose-500" />
                        ) : alert.severity === "warning" ? (
                          <AlertTriangle className="w-4 h-5 text-amber-500" />
                        ) : (
                          <ShieldAlert className="w-4 h-5 text-blue-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {alert.severity}
                          </span>
                          {!alert.dismissed && (
                            <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-600 rounded-md font-semibold">Active</span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm mt-0.5 text-slate-900 dark:text-slate-100">{alert.title}</h4>
                        <p className="text-xs mt-1 text-slate-600 dark:text-slate-350">{alert.message}</p>
                        <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400">
                          <span>{alert.city}</span>
                          <span>{alert.timestamp}</span>
                        </div>
                      </div>

                      {/* Action buttons inside alert item */}
                      <div className="absolute right-3 top-3 flex gap-1">
                        {!alert.dismissed ? (
                          <button
                            onClick={() => onDismiss(alert.id)}
                            className="p-1 rounded-lg bg-slate-200/40 dark:bg-slate-800/40 hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-500 transition"
                            title="Mark as read"
                            id={`history-read-${alert.id}`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium px-1">Read</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {alerts.length > 0 && (
                <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                  <button
                    onClick={onClearAll}
                    className="px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition"
                    id="clear-all-alerts-btn"
                  >
                    Clear All Logs
                  </button>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl transition"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
