"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Brain, Check, RotateCcw, Sparkles, Trophy, X } from "lucide-react";
import { useGameApi } from "@/components/GameShell";
import { sfx } from "@/lib/audio";

interface Question {
  q: string;
  options: string[];
  answer: number;
  explain: string;
  topic: string;
}

const BANK: Question[] = [
  {
    q: "Which creature is traditionally repelled by garlic?",
    options: ["A vampire", "A werewolf", "A banshee", "A ghoul"],
    answer: 0,
    explain: "Garlic, crosses and sunlight are the classic defences against vampires.",
    topic: "Creatures",
  },
  {
    q: "Which legendary ghost ship is doomed never to make port?",
    options: ["The Mary Celeste", "The Flying Dutchman", "The Black Pearl", "The Demeter"],
    answer: 1,
    explain: "The Flying Dutchman is a Dutch ghost ship said to sail the seas forever.",
    topic: "Legends",
  },
  {
    q: "What is a banshee said to foretell?",
    options: ["A wedding", "A death", "A storm", "A treasure"],
    answer: 1,
    explain: "In Irish folklore a banshee's wail is an omen that someone will soon die.",
    topic: "Folklore",
  },
  {
    q: "Which animal is most often linked to witches?",
    options: ["A raven", "A black cat", "An owl", "A toad"],
    answer: 1,
    explain: "Black cats became witch familiars in European folklore.",
    topic: "Folklore",
  },
  {
    q: "In Greek myth, who ferries souls across the river Styx?",
    options: ["Hades", "Charon", "Hermes", "Cerberus"],
    answer: 1,
    explain: "Charon the ferryman carries the dead across the Styx for a coin.",
    topic: "Mythology",
  },
  {
    q: "What is a poltergeist best known for?",
    options: ["Singing softly", "Moving objects noisily", "Guarding graves", "Stealing shadows"],
    answer: 1,
    explain: "Poltergeist means 'noisy ghost' in German — they throw and move objects.",
    topic: "Hauntings",
  },
  {
    q: "Where did the jack-o'-lantern tradition begin?",
    options: ["Ireland", "Mexico", "Transylvania", "Salem"],
    answer: 0,
    explain: "The tradition of carving turnips (later pumpkins) comes from Ireland.",
    topic: "Halloween",
  },
  {
    q: "Which metal is said to repel fairies and spirits in folklore?",
    options: ["Silver", "Iron", "Gold", "Copper"],
    answer: 1,
    explain: "Cold iron is a classic ward against fairies and supernatural creatures.",
    topic: "Folklore",
  },
  {
    q: "What traditional time is called the witching hour?",
    options: ["Midnight", "3:00 AM", "6:00 PM", "4:44 AM"],
    answer: 1,
    explain: "3 AM is commonly called the witching hour — the opposite of Christ's crucifixion at 3 PM.",
    topic: "Superstition",
  },
  {
    q: "Which flower is most associated with graves and mourning?",
    options: ["Rose", "Chrysanthemum", "Sunflower", "Daisy"],
    answer: 1,
    explain: "Chrysanthemums are widely placed on graves, especially on All Souls' Day.",
    topic: "Halloween",
  },
  {
    q: "A werewolf traditionally transforms under what?",
    options: ["A full moon", "A solar eclipse", "Heavy fog", "Running water"],
    answer: 0,
    explain: "The full moon trigger comes from medieval and modern werewolf legends.",
    topic: "Creatures",
  },
  {
    q: "What does the word 'phantom' mean?",
    options: ["A ghostly apparition", "A deep grave", "A cursed object", "A moonless night"],
    answer: 0,
    explain: "Phantom comes from the Greek phantasma, meaning apparition or ghost.",
    topic: "Language",
  },
  {
    q: "Which creature is a reanimated corpse, often hungry for brains?",
    options: ["A wraith", "A zombie", "A ghoul", "A revenant"],
    answer: 1,
    explain: "Zombies originated in Haitian folklore as reanimated dead.",
    topic: "Creatures",
  },
  {
    q: "What is a 'haunted' place said to contain?",
    options: ["A hidden treasure", "A lingering spirit", "A portal to space", "A sleeping dragon"],
    answer: 1,
    explain: "A haunting usually means a spirit or presence still attached to a place.",
    topic: "Hauntings",
  },
  {
    q: "In Salem, what were the 1692 trials famously about?",
    options: ["Witchcraft accusations", "Ghost sightings", "Treasure hunting", "Vampire attacks"],
    answer: 0,
    explain: "The Salem witch trials convicted people of witchcraft based on accusations.",
    topic: "History",
  },
  {
    q: "What is a 'revenant'?",
    options: ["A returning ghost or reanimated corpse", "A type of bat", "A cemetery gate", "A mourning song"],
    answer: 0,
    explain: "Revenant means 'one who returns' — a being that comes back from the dead.",
    topic: "Language",
  },
];

function pickQuestions(): Question[] {
  return [...BANK].sort(() => Math.random() - 0.5).slice(0, 10);
}

export default function MemoryQuiz() {
  const api = useGameApi();
  const active = api.status === "playing";
  const { setScore, endGame } = api;
  const [questions] = useState<Question[]>(pickQuestions);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [score, setScoreLocal] = useState(0);
  const [finished, setFinished] = useState(false);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const questionStart = useRef(Date.now());
  const advanceTimer = useRef<number | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    questionStart.current = Date.now();
  }, [index]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  const answer = useCallback(
    (choice: number) => {
      if (!active || selected !== null || finished) return;
      const question = questions[index];
      const isCorrect = choice === question.answer;
      setSelected(choice);
      if (isCorrect) {
        const elapsed = (Date.now() - questionStart.current) / 1000;
        const bonus = Math.max(20, 80 - Math.floor(elapsed * 9));
        const gained = 100 + bonus;
        scoreRef.current += gained;
        correctRef.current += 1;
        setCorrect(correctRef.current);
        setScoreLocal(scoreRef.current);
        setScore(scoreRef.current);
        sfx.match();
      } else {
        sfx.wrong();
      }

      advanceTimer.current = window.setTimeout(() => {
        if (index >= questions.length - 1) {
          finishedRef.current = true;
          setFinished(true);
        } else {
          setIndex((i) => i + 1);
          setSelected(null);
        }
      }, 950);
    },
    [active, selected, finished, questions, index, setScore],
  );

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
      if (key in map) answer(map[key]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, answer]);

  const claim = () => {
    if (finishedRef.current && active) {
      endGame({ score: scoreRef.current, win: correctRef.current >= 6 });
    }
  };

  if (finished) {
    const accuracy = Math.round((correctRef.current / questions.length) * 100);
    return (
      <div className="game-stage flex h-full w-full items-center justify-center overflow-y-auto bg-[#07070f] px-4 py-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgba(167,139,250,0.12),transparent_70%)]" />
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b18]/90 p-6 text-center">
          <Trophy size={34} className="mx-auto text-amber-300" />
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.28em] text-violet-300/80">
            Seance complete
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-bold text-white">Haunted mind report</h2>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-500">Accuracy</p>
              <p className="font-score mt-1 text-2xl text-cyan-200">{accuracy}%</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-500">Correct</p>
              <p className="font-score mt-1 text-2xl text-amber-200">{correctRef.current}/10</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">Score</span>
            <span className="font-score text-lg text-white">{scoreRef.current.toLocaleString()}</span>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
            {accuracy >= 80
              ? "The spirits are impressed. You have clearly haunted before."
              : accuracy >= 50
                ? "Respectable. The ghosts will remember your name."
                : "The other side remains a mystery. Try again in the dark."}
          </p>
          <button type="button" onClick={claim} className="btn btn-primary mt-5 w-full py-3 text-[12px]">
            <Sparkles size={14} /> Claim results
          </button>
        </div>
      </div>
    );
  }

  const question = questions[index];
  const letters = ["A", "B", "C", "D"];

  return (
    <div className="game-stage flex h-full w-full items-center justify-center overflow-y-auto bg-[#07070f] px-4 py-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_50%_0%,rgba(167,139,250,0.1),transparent_70%)]" />
      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-4 rounded-full transition-colors ${
                  i < index
                    ? "bg-violet-400/60"
                    : i === index
                      ? "bg-cyan-300"
                      : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
            <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
              {question.topic}
            </span>
            <span>{index + 1}/10</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b0b18]/85 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-violet-300" />
            <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-slate-500">
              Question {index + 1}
            </span>
            <span className="ml-auto font-score text-sm text-amber-200">
              {correct} correct
            </span>
          </div>
          <h2 className="mt-3 font-display text-lg leading-snug text-white sm:text-xl">
            {question.q}
          </h2>

          <div className="mt-5 grid gap-2">
            {question.options.map((option, i) => {
              const isSelected = selected === i;
              const isAnswer = question.answer === i;
              const showRight = selected !== null && isAnswer;
              const showWrong = selected !== null && isSelected && !isAnswer;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => answer(i)}
                  disabled={selected !== null}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                    showRight
                      ? "border-emerald-300/45 bg-emerald-400/10"
                      : showWrong
                        ? "border-rose-300/45 bg-rose-400/10"
                        : selected !== null
                          ? "border-white/[0.06] bg-white/[0.015] opacity-60"
                          : "border-white/10 bg-white/[0.025] hover:border-violet-400/35 hover:bg-violet-500/[0.06]"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border font-mono text-[11px] ${
                      showRight
                        ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-200"
                        : showWrong
                          ? "border-rose-300/40 bg-rose-400/15 text-rose-200"
                          : "border-white/10 bg-white/[0.03] text-slate-500"
                    }`}
                  >
                    {showRight ? <Check size={13} /> : showWrong ? <X size={13} /> : letters[i]}
                  </span>
                  <span className={`text-[12.5px] ${showRight ? "text-emerald-100" : showWrong ? "text-rose-100" : "text-slate-300"}`}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className="mt-4 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5">
              <p className="text-[11px] leading-relaxed text-slate-400">
                <span className={selected === question.answer ? "text-emerald-300" : "text-rose-300"}>
                  {selected === question.answer ? "Correct. " : "Not quite. "}
                </span>
                {question.explain}
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-center gap-3 font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">
          <span>Score {score}</span>
          <span className="h-2.5 w-px bg-white/10" />
          <span>Keys A–D</span>
          <RotateCcw size={10} />
          <span>Answer fast for bonus</span>
        </div>
      </div>
    </div>
  );
}
