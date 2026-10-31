import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { FeaturedGames } from "@/components/FeaturedGames";
import { GameGrid } from "@/components/GameGrid";
import { HowToPlay } from "@/components/HowToPlay";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <FeaturedGames />
      <GameGrid />
      <HowToPlay />
    </>
  );
}
