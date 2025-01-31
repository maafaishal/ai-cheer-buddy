import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

import dayjs from "dayjs";

import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  AlertCircle,
} from "lucide-react";

const LS_KEY = "reminderGeneration";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);

function App() {
  const [situation, setSituation] = useState("");
  const [language] = useState("English");
  const [reminders, setReminders] = useState<
    { quote: string; explanation: string }[]
  >([]);
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [nextResetTime, setNextResetTime] = useState("");

  const previousSituation = useRef("");
  const previousQuotes = useRef<string[]>([]);

  const isSituationEmpty = situation.trim().length === 0;
  const isSituationTheSame = previousSituation.current === situation;

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
    if (!isSituationTheSame) {
      previousSituation.current = situation;
      previousQuotes.current = [];
    }

    if (isSituationEmpty || remainingAttempts <= 0) return;

    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Given this situation: "${situation}", first **analyze the situation carefully** to understand its context, emotional tone, and the challenges involved. Based on this detailed understanding, provide exactly 3 **unique and relevant** quotes that can help someone feel better. The quotes should be **directly related to the situation** and provide emotional support, motivation, or practical advice for overcoming the difficulty.
        
        **DO NOT** use the previous quotes as follow:
        
        ${previousQuotes.current.join(",")}

        Each quote **must be from a different category**, such as:  
        1. **Ancient wisdom or philosophy** (e.g., from Stoicism, Confucianism, or old proverbs)  
        2. **Modern authors, scientists, or leaders** (20th century to present)  
        3. **A surprising or unexpected source** (e.g., songs, movies, cultural sayings, folklore)  

        Ensure each quote is **distinct in meaning and phrasing**. Avoid using similar themes across all three.  

        For each quote, return:  
        1. The quote itself  
        2. The author's name  
        3. A **clear, actionable explanation** that offers both emotional support and **practical advice or steps** the user can take to improve their situation. The explanation should be **simple and engaging**, with **emojis** to make it approachable. The focus should be on suggesting solutions, such as mindset shifts, coping strategies, or small actions to move forward.


        The user prefers in ${language} for the explanation. Keep the quote in English.

        Format the result as follows:  
        '"[quote]" - [author] | [explanation]' || '"[quote]" - [author] | [explanation]'. Separate each quote with "||".  
      `;

      const result = await model.generateContent(prompt);

      const response = result.response.text();
      const newReminders = response.split("||").map((reminder) => {
        const splittedReminder = reminder.split("|");

        const theQuote = splittedReminder[0];

        previousQuotes.current.push(theQuote);

        return {
          quote: theQuote,
          explanation: splittedReminder[1],
        };
      });

      updateAttemps();
      setReminders(newReminders);
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

  return (
    <div className="min-h-screen min-w-screen animate-gradient flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full glass-effect bg-white rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-white/30 p-2 rounded-lg">
            <Sparkles className="w-6 h-6 text-sky-500" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500">
            AI Cheer Buddy
          </h1>
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
                  loading ||
                  isSituationEmpty ||
                  isSituationTheSame ||
                  remainingAttempts === 0
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
