export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: "sparkles" | "ghost" | "brain" | "shield" | "crown" | "trophy" | "heart";
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-spirit",
    title: "First Spirit",
    description: "Play your first game in the arcade.",
    icon: "sparkles",
  },
  {
    id: "ghost-hunter",
    title: "Ghost Hunter",
    description: "Catch 50 ghosts across all games.",
    icon: "ghost",
  },
  {
    id: "puzzle-master",
    title: "Puzzle Master",
    description: "Complete 5 puzzle games.",
    icon: "brain",
  },
  {
    id: "survivor",
    title: "Survivor",
    description: "Survive 60 seconds in a single run.",
    icon: "shield",
  },
  {
    id: "arcade-legend",
    title: "Arcade Legend",
    description: "Play all 20 games at least once.",
    icon: "crown",
  },
  {
    id: "high-roller",
    title: "High Roller",
    description: "Set a best score of 1,000 or more.",
    icon: "trophy",
  },
  {
    id: "collector",
    title: "Soul Collector",
    description: "Favorite 5 games.",
    icon: "heart",
  },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
) as Record<string, Achievement>;

export interface AchievementInput {
  gamesPlayed: number;
  playedGames: string[];
  ghostsCaught: number;
  puzzlesCompleted: number;
  longestSurvival: number;
  bestScores: Record<string, number>;
  favorites: string[];
  unlocked: string[];
}

/** Returns the IDs of every achievement that should be unlocked, in order. */
export function evaluateAchievements(input: AchievementInput): string[] {
  const earned: string[] = [];
  const has = (id: string) => input.unlocked.includes(id) || earned.includes(id);

  if (input.gamesPlayed >= 1 && !has("first-spirit")) earned.push("first-spirit");
  if (input.ghostsCaught >= 50 && !has("ghost-hunter")) earned.push("ghost-hunter");
  if (input.puzzlesCompleted >= 5 && !has("puzzle-master"))
    earned.push("puzzle-master");
  if (input.longestSurvival >= 60 && !has("survivor")) earned.push("survivor");
  if (input.playedGames.length >= 20 && !has("arcade-legend"))
    earned.push("arcade-legend");
  if (
    Object.values(input.bestScores).some((score) => score >= 1000) &&
    !has("high-roller")
  )
    earned.push("high-roller");
  if (input.favorites.length >= 5 && !has("collector")) earned.push("collector");

  return earned;
}
