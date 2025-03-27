import { useState, useEffect } from "react";

import dayjs from "dayjs";
import ky from "ky";

import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  AlertCircle,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LS_KEY = "reminderGeneration";

const AI_GOOGLE = "gemini";
const AI_OPENAI = "gpt";

function App() {
  const [situation, setSituation] = useState("");
  const [lastSituation, setLastSituation] = useState("");
  const [language] = useState("English");
  const [reminders, setReminders] = useState<
    { quote: string; explanation: string }[]
  >([]);
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [nextResetTime, setNextResetTime] = useState("");
  const [aiAPI, setAIAPI] = useState(AI_GOOGLE);

  const isSituationEmpty = situation.trim().length === 0;

  useEffect(() => {
    const loadAttempts = () => {
      const stored = localStorage.getItem(LS_KEY);

      if (stored) {
        const { attempts, resetTime } = JSON.parse(stored);

        const now = new Date().getTime();

        if (now > resetTime) {
          setRemainingAttempts(3);
          setNextResetTime("");

          localStorage.removeItem(LS_KEY);
        } else {
          setRemainingAttempts(3 - attempts);
          setNextResetTime(dayjs(resetTime).format("DD MMM YYYY - HH:mm A"));
        }
      }
    };

    loadAttempts();
  }, []);

  const updateAttemps = () => {
    const stored = localStorage.getItem(LS_KEY);
    const nextDay = dayjs(`${dayjs().format("YYYY-MM-DD")} 00:000`)
      .add(1, "d")
      .valueOf();

    const resetTime = stored ? JSON.parse(stored).resetTime : nextDay;

    const currentAttempts = stored ? JSON.parse(stored).attempts + 1 : 1;

    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        attempts: currentAttempts,
        resetTime,
      })
    );

    setRemainingAttempts(3 - currentAttempts);
    setNextResetTime(dayjs(resetTime).format("DD MMM YYYY - HH:mm A"));
  };

  const generateReminders = async () => {
    if (isSituationEmpty || remainingAttempts <= 0) return;

    setLoading(true);

    try {
      const fetchPath = aiAPI === AI_GOOGLE ? "gemini" : "gpt";

      const fetchResponse = await ky
        .post(`${window.location.origin}/api/${fetchPath}`, {
          json: {
            situation,
            language,
          },
        })
        .json<{
          response: string;
        }>();

      const response = fetchResponse.response;

      if (response) {
        const newReminders = response.split("||").map((reminder) => {
          const splittedReminder = reminder.split("|");

          const theQuote = splittedReminder[0];

          return {
            quote: theQuote,
            explanation: splittedReminder[1],
          };
        });
        updateAttemps();
        setReminders(newReminders);
        setSituation("");
        setLastSituation(situation);
      }
    } catch (error) {
      console.error("Error generating reminders", error);
    } finally {
      setCurrentReminderIndex(0);
      setLoading(false);
    }
  };

  const handleEnter:
    | React.KeyboardEventHandler<HTMLTextAreaElement>
    | undefined = (e) => {
    if (e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      generateReminders();
    }
  };

  const handleChangeSituation:
    | React.ChangeEventHandler<HTMLTextAreaElement>
    | undefined = (e) => {
    setSituation(e.target.value);
  };

  const handleViwPreviousReminder = () => {
    if (currentReminderIndex === 0) return;

    setCurrentReminderIndex((prev) => prev - 1);
  };
  const handleViewNextReminder = () => {
    if (currentReminderIndex === 2) return;

    setCurrentReminderIndex((prev) => prev + 1);
  };

  const handleChangeTab = (tab: string) => {
    setAIAPI(tab);
  };

  return (
    <div className="min-h-screen min-w-screen animate-gradient flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full glass-effect bg-white rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="flex w-full justify-between items-center gap-2 mb-8">
          <div className="flex items-center gap-2 flex-1">
            <div className="bg-white/30 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-sky-500" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500">
              AI Cheer Buddy
            </h1>
          </div>
          <div>
            <Tabs defaultValue={AI_GOOGLE} className="">
              <TabsList>
                <TabsTrigger
                  value={AI_GOOGLE}
                  onClick={() => handleChangeTab(AI_GOOGLE)}
                >
                  Google Gemini
                </TabsTrigger>
                <TabsTrigger
                  value={AI_OPENAI}
                  onClick={() => handleChangeTab(AI_OPENAI)}
                >
                  Chat GPT
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="space-y-6">
          {remainingAttempts < 2 && (
            <div className="flex items-center gap-2 text-sm bg-sky-50/50 p-4 rounded-xl border border-sky-100">
              <AlertCircle className="w-4 h-4 text-sky-500" />
              <span className="text-sky-900">
                You have {remainingAttempts} attempt remaining.
                {nextResetTime && ` Resets at ${nextResetTime}`}
              </span>
            </div>
          )}
          <div>
            <label
              htmlFor="situation-input"
              className="block text-sm font-medium text-sky-700 mb-2"
            >
              Share what's on your mind
            </label>
            <div className="relative">
              <textarea
                id="situation-input"
                value={situation}
                onChange={handleChangeSituation}
                onKeyDown={handleEnter}
                rows={4}
                disabled={remainingAttempts === 0}
                placeholder="Tell us what's troubling you..."
                className="w-full px-4 py-3 rounded-xl border border-sky-100 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all resize-none placeholder-sky-400"
              />
              <button
                onClick={generateReminders}
                disabled={
                  loading || isSituationEmpty || remainingAttempts === 0
                }
                className="absolute bottom-3 right-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {lastSituation && (
        <div className="mt-8 bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm py-2 px-4 rounded-xl border border-white/20 flex flex-col items-center justifycenter relative shadow-lg">
          <h1>{lastSituation}</h1>
        </div>
      )}
      {reminders.length > 0 && (
        <div className="max-w-6xl mt-8 space-y-4">
          <div className="bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm p-8 rounded-xl border border-white/20 min-h-[200px] flex flex-col items-center justifycenter relative shadow-lg">
            <p className="text-xl text-center text-gray-800 font-bold italic mb-8">
              {reminders[currentReminderIndex].quote}
            </p>
            <p className="text-lg text-center text-gray-800 font-medium italic">
              {reminders[currentReminderIndex].explanation}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleViwPreviousReminder}
              disabled={currentReminderIndex === 0}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-sky-200" />
            </button>
            <span className="text-sm text-sky-300">
              {currentReminderIndex + 1} of {reminders.length}
            </span>
            <button
              onClick={handleViewNextReminder}
              disabled={currentReminderIndex === reminders.length - 1}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-sky-200" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
