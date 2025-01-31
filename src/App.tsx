import { useState, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { Quote, ChevronLeft, ChevronRight } from "lucide-react";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);

// const hehe =
//   "I just got fired after searching job for 6 months. Now, I need to search jobs again. I don't know when I will get a job for months :(";

function App() {
  const [situation, setSituation] = useState("");
  const [reminders, setReminders] = useState<
    { quote: string; explanation: string }[]
  >([]);
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const isSituationEmpty = situation.trim().length === 0;

  const previousSituation = useRef("");
  const previousQuotes = useRef<string[]>([]);

  const generateReminders = async () => {
    if (previousSituation.current !== situation) {
      previousSituation.current = situation;
      previousQuotes.current = [];
    }

    if (isSituationEmpty) return;

    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Given this situation: "${situation}", provide exactly 3 **unique and non-repetitive** quotes that can help someone feel better. **DO NOT** use the previous quotes as follow:
        
        ${previousQuotes.current.join(",")}

        Each quote **must be from a different category**, such as:  
        1. **Ancient wisdom or philosophy** (e.g., from Stoicism, Confucianism, or old proverbs)  
        2. **Modern authors, scientists, or leaders** (20th century to present)  
        3. **A surprising or unexpected source** (e.g., songs, movies, cultural sayings, folklore)  

        Ensure each quote is **distinct in meaning and phrasing**. Avoid using similar themes across all three.  

        For each quote, return:  
        1. The quote itself  
        2. The author's name  
        3. A **fresh** and **simple** explanation that is engaging and includes **emojis** to help users understand how to cheer up.  

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

      setReminders(newReminders);
    } catch (error) {
      console.error("Error generating reminders", error);
    } finally {
      setCurrentReminderIndex(0);
      setLoading(false);
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
    <div className="min-h-screen min-w-screen flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <Quote className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">
            Uplifting Reminder
          </h1>
        </div>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="situation-input"
              className="block text-sm font-medium text-gray700 mb-2"
            >
              Share your situation
            </label>
            <textarea
              id="situation-input"
              value={situation}
              onChange={handleChangeSituation}
              rows={4}
              placeholder="Tell us what's troubling you..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            />
          </div>
          <button
            onClick={generateReminders}
            disabled={loading || isSituationEmpty}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? "Generating reminders..." : "Get Uplifting Reminders"}
          </button>
        </div>
      </div>
      {reminders.length > 0 && (
        <div className="max-w-6xl mt-8 space-y-4">
          <div className="bg-purple-50 p-6 rounded-lg min-h-[200px] flex flex-col items-center justify-center relative">
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
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-sm text-gray-600">
              {currentReminderIndex + 1} of {reminders.length}
            </span>
            <button
              onClick={handleViewNextReminder}
              disabled={currentReminderIndex === reminders.length - 1}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
