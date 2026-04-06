import { useEffect, useState } from "react";

interface EmotionEvent {
  emoji: string;
  id: string;
  nickname?: string;
}

interface EmotionOverlayProps {
  emotion: EmotionEvent | null;
}

export default function EmotionOverlay({ emotion }: EmotionOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState("");
  const [currentNickname, setCurrentNickname] = useState("");

  useEffect(() => {
    if (emotion) {
      setCurrentEmoji(emotion.emoji);
      setCurrentNickname(emotion.nickname || "");
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [emotion]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-2">
        <div className="text-[120px] animate-emotion-pop">
          {currentEmoji}
        </div>
        {currentNickname && (
          <span className="text-sm font-semibold text-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-md animate-fade-in">
            {currentNickname}
          </span>
        )}
      </div>
    </div>
  );
}
