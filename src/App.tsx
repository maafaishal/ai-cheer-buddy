import { useState } from "react";

import { Quote } from "lucide-react";

function App() {
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangeSituation:
    | React.ChangeEventHandler<HTMLTextAreaElement>
    | undefined = (e) => {
    setSituation(e.target.value);
  };

  const generateReminders = () => {
    setLoading(true);

    try {
      console.log("try");
    } catch {
      console.error("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
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
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? "Generating reminders..." : "Get Uplifting Reminders"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
