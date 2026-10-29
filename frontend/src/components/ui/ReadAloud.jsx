import { useEffect, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { SPEECH_LANG } from "../../utils/helpers";

// Read-aloud using the browser's built-in Speech Synthesis API.
// Degrades gracefully: if unsupported, the button simply does not render.
export default function ReadAloud({ text, language = "English", label = "Read aloud" }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => () => supported && window.speechSynthesis.cancel(), [supported]);

  if (!supported || !text) return null;

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG[language] || "en-IN";
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className="btn-ghost text-sm"
      title={label}
    >
      {speaking ? <Square size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
      {speaking ? "Stop" : label}
    </button>
  );
}
