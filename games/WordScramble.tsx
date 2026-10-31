"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, HelpCircle, RotateCcw, Send, SkipForward, Sparkles } from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { sfx } from "@/lib/audio";

const WORDS: { word: string; hint: string }[] = [
  { word: "ghost", hint: "A translucent visitor from beyond." },
  { word: "pumpkin", hint: "Carved into a lantern in October." },
  { word: "haunted", hint: "A house that refuses to let you leave." },
  { word: "skeleton", hint: "All bones, no skin, still dancing." },
  { word: "vampire", hint: "Allergic to garlic and sunrise." },
  { word: "werewolf", hint: "A moon problem with teeth." },
  { word: "cauldron", hint: "Casting pot for a witch's brew." },
  { word: "cemetery", hint: "A neighbourhood with very quiet neighbours." },
  { word: "lantern", hint: "A small light for a dark path." },
  { word: "whisper", hint: "A voice too quiet to trust." },
  { word: "mansion", hint: "A very large, very empty home." },
  { word: "spirit", hint: "The part that stays after the body leaves." },
  { word: "shadow", hint: "It follows you everywhere." },
  { word: "cobweb", hint: "Spun in corners, never dusted." },
  { word: "zombie", hint: "Slow, hungry, and already dead." },
  { word: "witch", hint: "A broom-flying spellcaster." },
  { word: "phantom", hint: "Another word for a ghostly apparition." },
  { word: "midnight", hint: "The stroke of twelve." },
  { word: "seance", hint: "A gathering to contact the dead." },
  { word: "crypt", hint: "A stone room beneath a church." },
  { word: "bat", hint: "A winged creature of the night." },
  { word: "soul", hint: "What the reaper collects." },
  { word: "grave", hint: "Where a name is carved in stone." },
  { word: "fog", hint: "The grey breath of the graveyard." },
  { word: "spooky", hint: "What this arcade is." },
  { word: "raven", hint: "Quoth the bird, 'nevermore'." },
];

function scramble(word: string) {
  const letters = word.split("");
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  const result = letters.join("");
  if (result === word && word.length > 2) {
    return word.slice(1) + word[0];
  }
  return result;
}

function pickWord(exclude?: string) {
  const options = WORDS.filter((w) => w.word !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}

const START_TIME = 80;

export default function WordScramble() {
  const api = useGameApi();
  const active = api.status === "playing";
  const { setTimeLeft, endGame } = api;
  const [current, setCurrent] = useState(() => pickWord());
  const [scrambled, setScrambled] = useState(() => scramble(current.word));
  const [value, setValue] = useState("");
  const [solved, setSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "good" | "bad">("idle");
  const [remaining, setRemaining] = useState(START_TIME);
  const inputRef = useRef<HTMLInputElement>(null);
  const scoreRef = useRef(0);
  const timeRef = useRef(START_TIME);
  const solvedRef = useRef(0);
  const streakRef = useRef(0);
  const endedRef = useRef(false);
  const feedbackTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    setTimeLeft(START_TIME);
    const interval = window.setInterval(() => {
      if (endedRef.current) return;
      timeRef.current = Math.max(0, timeRef.current - 1);
      setRemaining(timeRef.current);
      setTimeLeft(timeRef.current);
      if (timeRef.current === 0) {
        endedRef.current = true;
        endGame({ score: scoreRef.current });
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [active, setTimeLeft, endGame]);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    };
  }, []);

  const nextWord = useCallback(() => {
    const next = pickWord(current.word);
    setCurrent(next);
    setScrambled(scramble(next.word));
    setValue("");
    setHintShown(false);
    setFeedback("idle");
    inputRef.current?.focus();
  }, [current.word]);

  const submit = () => {
    if (!active || endedRef.current) return;
    const guess = value.trim().toLowerCase();
    if (!guess) return;
    if (guess === current.word.toLowerCase()) {
      const base = hintShown ? 80 : 150;
      const streakBonus = Math.min(100, streakRef.current * 15);
      const gained = base + streakBonus;
      scoreRef.current += gained;
      api.setScore(scoreRef.current);
      solvedRef.current += 1;
      setSolved(solvedRef.current);
      streakRef.current += 1;
      setStreak(streakRef.current);
      setFeedback("good");
      sfx.match();
      timeRef.current = Math.min(START_TIME, timeRef.current + 4);
      setRemaining(timeRef.current);
      setTimeLeft(timeRef.current);
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
      feedbackTimer.current = window.setTimeout(nextWord, 700);
    } else {
      streakRef.current = 0;
      setStreak(0);
      setFeedback("bad");
      sfx.wrong();
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
      feedbackTimer.current = window.setTimeout(() => setFeedback("idle"), 600);
    }
  };

  const skip = () => {
    if (!active) return;
    streakRef.current = 0;
    setStreak(0);
    scoreRef.current = Math.max(0, scoreRef.current - 15);
    api.setScore(scoreRef.current);
    sfx.wrong();
    nextWord();
  };

  return (
    <div className="game-stage flex h-full w-full items-center justify-center overflow-y-auto bg-[#07070f] px-4 py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_0%,rgba(167,139,250,0.12),transparent_70%)]" />
      <div className="relative z-10 w-full max-w-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-400">
              <Sparkles size={11} className="text-violet-300" />
              Solved {solved}
            </span>
            {streak > 1 && (
              <span className="rounded-lg border border-amber-300/25 bg-amber-400/10 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-amber-200">
                {streak}× streak
              </span>
            )}
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">
            {remaining}s left
          </span>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {scrambled.split("").map((letter, i) => (
            <span
              key={`${letter}-${i}`}
              className="flex h-12 w-10 items-center justify-center rounded-lg border border-violet-400/25 bg-gradient-to-b from-[#191634] to-[#0e0d1c] font-display text-xl font-bold text-violet-100 shadow-[0_4px_24px_-8px_rgba(139,92,246,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] sm:h-14 sm:w-12 sm:text-2xl"
              style={{ transform: `rotate(${(i % 3 - 1) * 1.1}deg)` }}
            >
              {letter.toUpperCase()}
            </span>
          ))}
        </div>

        <div className="mt-3 text-center">
          {hintShown ? (
            <p className="mx-auto max-w-md text-[12px] italic text-cyan-200/70">“{current.hint}”</p>
          ) : (
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">
              {current.word.length} letters · unscramble the word
            </p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mx-auto mt-6 flex max-w-md items-center gap-2"
        >
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type the word…"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Your answer"
            className={`min-w-0 flex-1 rounded-xl border bg-[#0b0b18] px-4 py-3 text-center font-display text-lg uppercase tracking-[0.2em] text-white placeholder:font-body placeholder:text-[12px] placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-600 focus:outline-none ${
              feedback === "good"
                ? "border-emerald-400/60 shadow-[0_0_24px_-10px_rgba(52,211,153,0.8)]"
                : feedback === "bad"
                  ? "border-rose-400/60 shadow-[0_0_24px_-10px_rgba(244,63,94,0.8)]"
                  : "border-white/15 focus:border-violet-400/60"
            }`}
          />
          <button
            type="submit"
            className="btn btn-primary h-[46px] px-4"
            aria-label="Submit answer"
          >
            {feedback === "good" ? <Check size={16} /> : <Send size={15} />}
          </button>
        </form>

        <div className="mt-3 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setHintShown(true);
              sfx.flip();
              inputRef.current?.focus();
            }}
            disabled={hintShown}
            className="btn btn-secondary px-3 py-2 text-[11px]"
          >
            <HelpCircle size={12} /> {hintShown ? "Hint revealed" : "Hint (−70 pts)"}
          </button>
          <button type="button" onClick={skip} className="btn btn-ghost px-3 py-2 text-[11px]">
            <SkipForward size={12} /> Skip (−15)
          </button>
          <button
            type="button"
            onClick={() => {
              setScrambled(scramble(current.word));
              sfx.click();
            }}
            className="btn btn-ghost px-3 py-2 text-[11px]"
          >
            <RotateCcw size={12} /> Reshuffle
          </button>
        </div>

        <p className="mt-5 text-center text-[10px] leading-relaxed text-slate-600">
          Correct words add 4 seconds. Hinted answers score less. Press Enter to
          submit.
        </p>
      </div>
    </div>
  );
}
