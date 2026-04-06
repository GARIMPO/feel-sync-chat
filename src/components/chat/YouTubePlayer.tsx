import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, X, Send, ChevronDown, ChevronUp } from "lucide-react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface YouTubePlayerProps {
  videoId: string | null;
  isPlaying: boolean;
  onSubmitLink: (videoId: string) => void;
  onTogglePlay: () => void;
  onClose: () => void;
  onSeek?: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
  seekTo?: number | null;
  seekId?: number;
  readOnly?: boolean;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

let ytApiLoaded = false;
let ytApiReady = false;
const ytApiCallbacks: (() => void)[] = [];

function loadYTApi(cb: () => void) {
  if (ytApiReady) { cb(); return; }
  ytApiCallbacks.push(cb);
  if (ytApiLoaded) return;
  ytApiLoaded = true;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
  window.onYouTubeIframeAPIReady = () => {
    ytApiReady = true;
    ytApiCallbacks.forEach((fn) => fn());
    ytApiCallbacks.length = 0;
  };
}

export default function YouTubePlayer({
  videoId, isPlaying, onSubmitLink, onTogglePlay, onClose, onSeek, onTimeUpdate, seekTo, seekId, readOnly,
}: YouTubePlayerProps) {
  const [linkInput, setLinkInput] = useState("");
  const [minimized, setMinimized] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSeekRef = useRef<number>(0);
  const ignoreSeekRef = useRef(false);
  const playerReadyRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const lastAppliedSeekIdRef = useRef<number>(-1);
  const isPlayingRef = useRef(isPlaying);

  // Keep isPlayingRef in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Build / destroy player when videoId or minimized changes
  useEffect(() => {
    if (!videoId || minimized) return;
    playerReadyRef.current = false;
    loadYTApi(() => {
      if (!containerRef.current) return;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
      containerRef.current.innerHTML = "";
      const div = document.createElement("div");
      div.id = "yt-player-" + Date.now();
      containerRef.current.appendChild(div);

      playerRef.current = new window.YT.Player(div.id, {
        videoId,
        playerVars: { autoplay: 1, enablejsapi: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            playerReadyRef.current = true;
            // Apply pending seek if any (for users joining mid-video)
            if (pendingSeekRef.current != null) {
              playerRef.current.seekTo(pendingSeekRef.current, true);
              lastSeekRef.current = pendingSeekRef.current;
              pendingSeekRef.current = null;
            }
            // Sync play/pause state
            if (!isPlayingRef.current) {
              playerRef.current.pauseVideo();
            }
          },
          onStateChange: (event: any) => {
            if (readOnly) return;
            if (event.data === window.YT.PlayerState.PLAYING || event.data === window.YT.PlayerState.PAUSED) {
              const currentTime = playerRef.current?.getCurrentTime?.() || 0;
              if (Math.abs(currentTime - lastSeekRef.current) > 3 && !ignoreSeekRef.current) {
                onSeek?.(currentTime);
              }
              lastSeekRef.current = currentTime;
              // Publish play/pause changes from owner
              const nowPlaying = event.data === window.YT.PlayerState.PLAYING;
              if (nowPlaying !== isPlayingRef.current) {
                onTogglePlay();
              }
            }
          },
        },
      });
    });

    return () => {
      playerReadyRef.current = false;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [videoId, minimized]);

  // Owner: periodically report current time for sync
  useEffect(() => {
    if (readOnly || !videoId || minimized) return;
    const interval = setInterval(() => {
      if (playerReadyRef.current && playerRef.current?.getCurrentTime) {
        const t = playerRef.current.getCurrentTime();
        lastSeekRef.current = t;
        onTimeUpdate?.(t);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [readOnly, videoId, minimized, onTimeUpdate]);

  // Sync play/pause state from owner (for readOnly users)
  useEffect(() => {
    if (!playerReadyRef.current || !playerRef.current) return;
    try {
      const state = playerRef.current.getPlayerState?.();
      if (isPlaying && state === window.YT.PlayerState.PAUSED) {
        playerRef.current.playVideo();
      } else if (!isPlaying && state === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
      }
    } catch {}
  }, [isPlaying]);

  // Poll to enforce play/pause for readOnly (YT API ready timing)
  useEffect(() => {
    if (!readOnly || !videoId || minimized) return;
    const interval = setInterval(() => {
      if (!playerReadyRef.current || !playerRef.current) return;
      try {
        const state = playerRef.current.getPlayerState?.();
        if (state == null) return;
        if (isPlaying && state === window.YT.PlayerState.PAUSED) {
          playerRef.current.playVideo();
        } else if (!isPlaying && state === window.YT.PlayerState.PLAYING) {
          playerRef.current.pauseVideo();
        }
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, [readOnly, isPlaying, videoId, minimized]);

  // Handle seekTo from owner - uses seekId to allow re-triggering same time value
  useEffect(() => {
    if (seekTo == null || seekId == null) return;
    if (seekId === lastAppliedSeekIdRef.current) return;
    lastAppliedSeekIdRef.current = seekId;

    if (playerReadyRef.current && playerRef.current?.seekTo) {
      ignoreSeekRef.current = true;
      playerRef.current.seekTo(seekTo, true);
      lastSeekRef.current = seekTo;
      setTimeout(() => { ignoreSeekRef.current = false; }, 2000);
    } else {
      // Player not ready yet, store as pending
      pendingSeekRef.current = seekTo;
    }
  }, [seekTo, seekId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(linkInput.trim());
    if (id) {
      onSubmitLink(id);
      setLinkInput("");
    }
  };

  if (!videoId) {
    if (readOnly) return null;
    return (
      <div className="border-b border-border bg-surface px-3 py-2">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-primary shrink-0" />
          <form onSubmit={handleSubmit} className="flex gap-2 flex-1 min-w-0">
            <Input
              placeholder="Cole link do YouTube..."
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              className="h-8 text-xs flex-1"
            />
            <Button type="submit" size="sm" className="h-8" disabled={!linkInput.trim()}>
              <Send className="h-3 w-3" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border relative z-10 shrink-0">
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-border">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">Assistindo juntos</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMinimized(!minimized)}>
            {minimized ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
          {!readOnly && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-3.5 w-3.5 text-destructive" />
            </Button>
          )}
        </div>
      </div>
      {!minimized && (
        <div className="flex justify-center" style={{ backgroundColor: "#000" }}>
          <div className="w-full sm:max-w-[50%] lg:max-w-[40%]">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <div ref={containerRef} className="absolute inset-0 w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />
              {readOnly && (
                <div className="absolute inset-0 z-10" style={{ cursor: "default" }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
