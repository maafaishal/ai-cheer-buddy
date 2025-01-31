import { useState } from "react";
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

  const generateReminders = async () => {
    if (isSituationEmpty) return;

    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Given this situation: "${situation}", provide exactly 3 uplifting and meaningful quotes to be a reminder that could help someone feel better in their bad situation. Return the quotes with the author, then give explanation in simple terms so the users understand how to cheer up with emojis. The result will be '"[quote]" - [author] | [explanation]' || '"[quote]" - [author] | [explanation]'. Separate each quote by || and between the quote (author) and explanation`;

      const result = await model.generateContent(prompt);

      const response = result.response.text();
      console.log("🚀 ~ generateReminders ~ response:", response);
      const newReminders = response.split("||").map((reminder) => {
        const splittedReminder = reminder.split("|");

        return {
          quote: splittedReminder[0],
          explanation: splittedReminder[1],
        };
      });

      setReminders(newReminders);
      console.log("🚀 ~ generateReminders ~ newReminders:", newReminders);
    } catch (error) {
      console.error("Error generating reminders", error);
    } finally {
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
