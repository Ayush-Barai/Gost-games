"use client";

import { GAMES } from "@/lib/games";
import { GameCard } from "./GameCard";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { ArrowRight, Star } from "lucide-react";

const featured = GAMES.filter((g) => g.featured);

export function FeaturedGames() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-5 pt-20 sm:px-8 sm:pt-24">
      <Reveal>
        <SectionHeading
          eyebrow="Featured hauntings"
          title={
            <>
              Tonight&apos;s <span className="gradient-text">headliners</span>
            </>
          }
          description="Four rooms the spirits refuse to close. Start here if you like your pulse elevated."
          action={
            <a
              href="#games"
              className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300 transition-colors hover:text-white"
            >
              <Star size={11} fill="currentColor" />
              View all 20
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </a>
          }
        />
      </Reveal>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {featured.map((game, i) => (
          <Reveal key={game.id} delay={i * 0.07}>
            <GameCard game={game} index={GAMES.findIndex((g) => g.id === game.id)} featured />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
