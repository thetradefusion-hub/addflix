import { useEffect, useRef, useState } from "react";
import { parsePlayableUrl } from "@/lib/videoUrl";

function loadScript(src, ready) {
  if (ready()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    const script = existing || document.createElement("script");
    const done = () => (ready() ? resolve() : reject(new Error("Player failed to load.")));
    script.addEventListener("load", done, { once: true });
    script.addEventListener("error", () => reject(new Error("Player failed to load.")), { once: true });
    if (!existing) {
      script.src = src;
      document.body.appendChild(script);
    } else if (ready()) resolve();
  });
}

export default function TaskVideo({ url, onSample }) {
  const source = parsePlayableUrl(url);
  const sampleRef = useRef(onSample);
  sampleRef.current = onSample;
  const hostRef = useRef(null);
  const videoRef = useRef(null);
  const apiRef = useRef(null);
  const lastGoodRef = useRef(0);
  const clockRef = useRef(0);
  const [playing, setPlaying] = useState(false);

  const hold = (position, active, ended) => {
    const now = performance.now();
    if (!clockRef.current) {
      clockRef.current = now;
      lastGoodRef.current = Math.max(0, position);
      return null;
    }
    const elapsed = Math.max(0, (now - clockRef.current) / 1000);
    clockRef.current = now;
    const prev = lastGoodRef.current;
    if (ended) {
      lastGoodRef.current = Math.max(prev, position);
      return null;
    }
    const maxAdvance = active ? Math.max(elapsed, 0.25) * 2 + 5 : 1.5;
    if (position > prev + maxAdvance) return prev;
    if (position + 1 < prev) {
      lastGoodRef.current = position;
      return null;
    }
    lastGoodRef.current = Math.max(prev, position);
    return null;
  };

  useEffect(() => {
    if (source?.kind !== "youtube") return undefined;
    const parent = hostRef.current;
    if (!parent) return undefined;
    let dead = false;
    let player;
    let timer;
    lastGoodRef.current = 0;
    clockRef.current = 0;
    const mount = document.createElement("div");
    mount.className = "h-full w-full";
    parent.appendChild(mount);
    const start = () => {
      if (dead || !window.YT?.Player) return;
      player = new window.YT.Player(mount, {
        videoId: source.id,
        playerVars: { rel: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, origin: window.location.origin },
        events: {
          onReady: () => {
            apiRef.current = {
              toggle: () => {
                const state = player.getPlayerState?.();
                if (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.BUFFERING) player.pauseVideo();
                else player.playVideo();
              },
            };
          },
        },
      });
      timer = setInterval(() => {
        const YT = window.YT?.PlayerState;
        const state = player?.getPlayerState?.();
        if (state == null || !player.getCurrentTime || !YT) return;
        if (document.visibilityState === "hidden" && (state === YT.PLAYING || state === YT.BUFFERING)) player.pauseVideo?.();
        if (player.getPlaybackRate?.() > 1) player.setPlaybackRate?.(1);
        const ended = state === YT.ENDED;
        const active = (state === YT.PLAYING || state === YT.BUFFERING) && document.visibilityState === "visible";
        let position = Number(player.getCurrentTime()) || 0;
        const back = hold(position, active, ended);
        if (back != null) {
          player.seekTo(back, true);
          position = back;
        }
        setPlaying(active);
        sampleRef.current?.({ position, duration: Number(player.getDuration()) || 0, playing: active, ended });
      }, 250);
    };
    if (window.YT?.Player) start();
    else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        start();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }
    }
    return () => {
      dead = true;
      clearInterval(timer);
      player?.destroy?.();
      mount.remove();
    };
  }, [source?.kind, source?.id]);

  useEffect(() => {
    if (source?.kind !== "vimeo") return undefined;
    const frame = hostRef.current;
    if (!frame) return undefined;
    let dead = false;
    let player;
    lastGoodRef.current = 0;
    clockRef.current = 0;
    loadScript("https://player.vimeo.com/api/player.js", () => Boolean(window.Vimeo?.Player))
      .then(() => {
        if (dead) return;
        player = new window.Vimeo.Player(frame);
        apiRef.current = {
          toggle: () => player.getPaused().then((paused) => (paused ? player.play() : player.pause())).catch(() => {}),
        };
        const publish = (isPlaying, ended, data) => {
          let position = Number(data?.seconds) || 0;
          const active = isPlaying && document.visibilityState === "visible";
          const back = hold(position, active, ended);
          if (back != null) {
            player.setCurrentTime(back).catch(() => {});
            position = back;
          }
          player.getPlaybackRate?.().then((rate) => { if (rate > 1) player.setPlaybackRate(1).catch(() => {}); }).catch(() => {});
          setPlaying(active);
          sampleRef.current?.({
            position,
            duration: Number(data?.duration) || 0,
            playing: active,
            ended,
          });
        };
        player.on("timeupdate", (data) => player.getPaused().then((paused) => publish(!paused, false, data)).catch(() => {}));
        player.on("seeked", (data) => publish(false, false, data));
        player.on("pause", (data) => publish(false, false, data));
        player.on("ended", (data) => publish(false, true, data));
      })
      .catch(() => sampleRef.current?.({ position: 0, duration: 0, playing: false, ended: false, error: "Vimeo player could not load." }));
    const onHide = () => {
      if (document.visibilityState === "hidden") player?.pause?.().catch(() => {});
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      dead = true;
      document.removeEventListener("visibilitychange", onHide);
      player?.unload?.().catch(() => {});
    };
  }, [source?.kind, source?.id]);

  useEffect(() => {
    if (source?.kind !== "file") return undefined;
    lastGoodRef.current = 0;
    clockRef.current = 0;
    const onHide = () => {
      if (document.visibilityState === "hidden") videoRef.current?.pause();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [source?.kind]);

  if (!source) return null;

  const playerClass = "pointer-events-none absolute inset-0 h-full w-full";
  const toggle = () => apiRef.current?.toggle();

  if (source.kind === "file") {
    return (
      <>
        <video
          ref={videoRef}
          src={source.src}
          playsInline
          className={`${playerClass} bg-black`}
          onLoadedMetadata={(event) => {
            apiRef.current = { toggle: () => (event.currentTarget.paused ? event.currentTarget.play() : event.currentTarget.pause()) };
            sampleRef.current?.({ position: 0, duration: event.currentTarget.duration, playing: false, ended: false });
          }}
          onSeeking={(event) => {
            const video = event.currentTarget;
            const active = !video.paused && document.visibilityState === "visible";
            const back = hold(video.currentTime, active, video.ended);
            if (back != null) video.currentTime = back;
          }}
          onRateChange={(event) => { if (event.currentTarget.playbackRate !== 1) event.currentTarget.playbackRate = 1; }}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            const ended = video.ended;
            const active = !video.paused && !ended && document.visibilityState === "visible";
            const back = hold(video.currentTime, active, ended);
            if (back != null) video.currentTime = back;
            setPlaying(active);
            sampleRef.current?.({ position: back ?? video.currentTime, duration: video.duration, playing: active, ended });
          }}
          onPause={() => setPlaying(false)}
          onPlay={(event) => {
            if (document.visibilityState === "hidden") event.currentTarget.pause();
            else setPlaying(true);
          }}
          onEnded={(event) => {
            const video = event.currentTarget;
            setPlaying(false);
            sampleRef.current?.({ position: video.duration || video.currentTime, duration: video.duration, playing: false, ended: true });
          }}
        />
        <PlayButton playing={playing} onClick={toggle} />
      </>
    );
  }

  if (source.kind === "vimeo") {
    return (
      <>
        <iframe ref={hostRef} title="Daily task video" src={`https://player.vimeo.com/video/${source.id}?title=0&byline=0&portrait=0`} className={playerClass} allow="autoplay; fullscreen; picture-in-picture" />
        <PlayButton playing={playing} onClick={toggle} />
      </>
    );
  }

  return (
    <>
      <div ref={hostRef} className={playerClass} />
      <PlayButton playing={playing} onClick={toggle} />
    </>
  );
}

function PlayButton({ playing, onClick }) {
  return (
    <button type="button" onClick={onClick} className="theme-fixed absolute bottom-3 left-3 z-20 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#111827] shadow">
      {playing ? "Pause" : "Play"}
    </button>
  );
}
