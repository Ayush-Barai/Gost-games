export type Category = "Arcade" | "Puzzle" | "Adventure" | "Survival";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface GameMeta {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  /** Seconds. When set, the shared shell runs the countdown. */
  duration?: number;
  featured?: boolean;
  accent: [string, string];
  glyph:
    | "ghost"
    | "cards"
    | "maze"
    | "jump"
    | "pumpkin"
    | "flappy"
    | "letters"
    | "grid"
    | "hammer"
    | "souls"
    | "runner"
    | "numbers"
    | "magnifier"
    | "bolt"
    | "pong"
    | "blaster"
    | "quiz"
    | "tower"
    | "chest"
    | "crown";
  howTo: string[];
  controls: string;
}

export const CATEGORIES: ("All Games" | Category | "Favorites")[] = [
  "All Games",
  "Arcade",
  "Puzzle",
  "Adventure",
  "Survival",
];

export const GAMES: GameMeta[] = [
  {
    id: "ghost-catcher",
    title: "Ghost Catcher",
    tagline: "Catch them before they vanish.",
    description:
      "Wandering spirits pop out of the dark. Catch the blue ones, grab the golden ones, and never touch a bomb.",
    category: "Arcade",
    difficulty: "Easy",
    duration: 30,
    featured: true,
    accent: ["#8B5CF6", "#22D3EE"],
    glyph: "ghost",
    howTo: [
      "Click or tap ghosts to catch them.",
      "Blue ghosts are worth 10 points, golden ghosts 30.",
      "Bomb ghosts cost you 15 points.",
      "The hunt lasts 30 seconds.",
    ],
    controls: "Mouse / touch",
  },
  {
    id: "memory-match",
    title: "Ghost Memory Match",
    tagline: "Some memories refuse to die.",
    description:
      "Flip the haunted cards and pair up ghosts, pumpkins, skulls and cursed relics. Fewer moves, higher score.",
    category: "Puzzle",
    difficulty: "Easy",
    accent: ["#F472B6", "#8B5CF6"],
    glyph: "cards",
    howTo: [
      "Flip two cards at a time.",
      "A matching pair scores 100 points, plus a speed bonus.",
      "Each mismatched flip costs 10 points.",
      "Clear the board with as few moves as possible.",
    ],
    controls: "Mouse / touch",
  },
  {
    id: "haunted-maze",
    title: "Haunted Maze Escape",
    tagline: "The walls are breathing.",
    description:
      "Navigate a torchlit labyrinth, collect all three keys, dodge roaming spirits and find the door out.",
    category: "Adventure",
    difficulty: "Medium",
    featured: true,
    accent: ["#22D3EE", "#8B5CF6"],
    glyph: "maze",
    howTo: [
      "Collect all 3 keys hidden in the maze.",
      "Reach the glowing exit to escape.",
      "Ghosts patrol the corridors - contact costs a life.",
      "Three lives. The maze is generated fresh each run.",
    ],
    controls: "Arrow keys / WASD",
  },
  {
    id: "ghost-jump",
    title: "Ghost Jump",
    tagline: "Gravity is just a suggestion.",
    description:
      "An endless moonlit sprint. Leap over gravestones, snatch lost souls and keep moving as the night accelerates.",
    category: "Arcade",
    difficulty: "Easy",
    accent: ["#8B5CF6", "#F472B6"],
    glyph: "jump",
    howTo: [
      "Jump over tombstones to stay alive.",
      "Each tombstone cleared is worth 10 points.",
      "Souls floating in the air are worth 25 points.",
      "The run gets faster the longer you survive.",
    ],
    controls: "Space / Arrow Up / tap",
  },
  {
    id: "pumpkin-dodge",
    title: "Pumpkin Dodge",
    tagline: "The harvest is hungry.",
    description:
      "Stay light, stay moving. Cursed pumpkins rain from a blood moon sky and the shower only gets heavier.",
    category: "Survival",
    difficulty: "Medium",
    accent: ["#F97316", "#F472B6"],
    glyph: "pumpkin",
    howTo: [
      "Move left and right along the graveyard path.",
      "Avoid the falling pumpkins - one hit ends the run.",
      "Survive as long as you can; time is your score.",
      "The pumpkin storm grows faster every few seconds.",
    ],
    controls: "Arrow keys / A D / drag",
  },
  {
    id: "ghost-flappy",
    title: "Ghost Flappy",
    tagline: "Flight school for the deceased.",
    description:
      "Flap through gaps in the haunted gateways. One wrong move and you join the other side - permanently.",
    category: "Arcade",
    difficulty: "Medium",
    featured: true,
    accent: ["#22D3EE", "#A78BFA"],
    glyph: "flappy",
    howTo: [
      "Tap or press space to flap upward.",
      "Pass through each gap for 10 points.",
      "Grazing a gate or the ground ends the run.",
      "The gateways scroll faster over time.",
    ],
    controls: "Space / click / tap",
  },
  {
    id: "word-scramble",
    title: "Haunted Word Scramble",
    tagline: "Spell or be spelled upon.",
    description:
      "A cursed lexicon scrambles itself before your eyes. Untangle spooky words against the clock.",
    category: "Puzzle",
    difficulty: "Medium",
    accent: ["#A78BFA", "#22D3EE"],
    glyph: "letters",
    howTo: [
      "Unscramble the letters to form a spooky word.",
      "Type your answer and press Enter.",
      "Each correct word adds points and time.",
      "Use the hint if the letters turn traitorous.",
    ],
    controls: "Keyboard",
  },
  {
    id: "tic-tac-toe",
    title: "Ghost Tic-Tac-Toe",
    tagline: "Three in a row. No rest for the wicked.",
    description:
      "Ghosts versus pumpkins in a duel of wits against a restless spirit. Can you out-think the dead?",
    category: "Puzzle",
    difficulty: "Easy",
    accent: ["#8B5CF6", "#F97316"],
    glyph: "grid",
    howTo: [
      "You play the ghosts, the AI plays the pumpkins.",
      "Place three of your marks in a row to win.",
      "The AI has three difficulty spirits: whisper, wail, shriek.",
      "A win is worth 300 points, a draw 100.",
    ],
    controls: "Mouse / touch",
  },
  {
    id: "whack-a-ghost",
    title: "Haunted Whack-a-Ghost",
    tagline: "Six holes. Too many spirits.",
    description:
      "They rise from the graveyard soil. Bop the ghosts, spare the bombs, and never look away for long.",
    category: "Arcade",
    difficulty: "Easy",
    duration: 45,
    accent: ["#34D399", "#8B5CF6"],
    glyph: "hammer",
    howTo: [
      "Click ghosts as they appear from the holes.",
      "A hit scores 10 points; consecutive hits build a combo.",
      "Bombs cost 20 points and reset your combo.",
      "Survive 45 seconds of escalating chaos.",
    ],
    controls: "Mouse / touch",
  },
  {
    id: "soul-collector",
    title: "Soul Collector",
    tagline: "Every light has a price.",
    description:
      "Drift through a dark arena gathering lost souls while hungry phantoms hunt you down.",
    category: "Arcade",
    difficulty: "Medium",
    accent: ["#22D3EE", "#F472B6"],
    glyph: "souls",
    howTo: [
      "Move with WASD or arrow keys.",
      "Touch glowing souls to collect them for points.",
      "Red phantoms chase you and cost a life on contact.",
      "Collect souls to unlock extra lives every 10 pickups.",
    ],
    controls: "Arrow keys / WASD",
  },
  {
    id: "ghost-runner",
    title: "Ghost Runner",
    tagline: "Run. Slide. Haunt later.",
    description:
      "A moonlit rooftop run through a graveyard skyline. Jump tombstones, slide under gates, collect coins.",
    category: "Arcade",
    difficulty: "Hard",
    accent: ["#F472B6", "#22D3EE"],
    glyph: "runner",
    howTo: [
      "Jump over tombstones with Space or Arrow Up.",
      "Slide under high gates with Arrow Down.",
      "Coins are worth 15 points, obstacles cleared 20.",
      "Speed climbs constantly. Three hits and the run ends.",
    ],
    controls: "Space jump / Down slide / tap zones",
  },
  {
    id: "number-puzzle",
    title: "Haunted Number Puzzle",
    tagline: "Order from chaos. Eventually.",
    description:
      "Sliding tiles carved from a cursed ouija board. Put the numbers back in order before the clock runs out.",
    category: "Puzzle",
    difficulty: "Medium",
    accent: ["#8B5CF6", "#FBBF24"],
    glyph: "numbers",
    howTo: [
      "Click a tile beside the empty space to slide it.",
      "Arrange numbers 1 to 8 in order, with the gap at the end.",
      "Fewer moves and a faster time mean a higher score.",
      "Shuffle at any time, but the clock keeps running.",
    ],
    controls: "Mouse / touch",
  },
  {
    id: "ghost-detective",
    title: "Ghost Detective",
    tagline: "The victim has been dead for a century.",
    description:
      "Investigate a haunted parlour, collect four pieces of evidence and name the spirit that stole the locket.",
    category: "Adventure",
    difficulty: "Easy",
    accent: ["#FBBF24", "#22D3EE"],
    glyph: "magnifier",
    howTo: [
      "Click suspicious objects in the room to inspect them.",
      "Collect all four clues before making an accusation.",
      "Read the case notes carefully - one suspect is lying.",
      "Name the culprit to solve the mystery.",
    ],
    controls: "Mouse / touch",
  },
  {
    id: "reaction-test",
    title: "Ghost Reaction Test",
    tagline: "How fast can you banish a ghost?",
    description:
      "Five rounds of jump scares. Wait for the ghost, then click before it disappears. Milliseconds matter.",
    category: "Arcade",
    difficulty: "Easy",
    accent: ["#22D3EE", "#F472B6"],
    glyph: "bolt",
    howTo: [
      "Wait for the screen to turn dark and still.",
      "The instant the ghost appears, click as fast as you can.",
      "Clicking early costs you a round.",
      "Five rounds. Lower average reaction time is better.",
    ],
    controls: "Mouse / touch",
  },
  {
    id: "haunted-pong",
    title: "Haunted Pong",
    tagline: "The ball remembers every rally.",
    description:
      "A spectral duel against a haunted paddle. The ball accelerates with every hit. First to 5 wins.",
    category: "Arcade",
    difficulty: "Medium",
    accent: ["#8B5CF6", "#22D3EE"],
    glyph: "pong",
    howTo: [
      "Move your paddle to return the ball.",
      "Score 5 points before the phantom paddle does.",
      "Every rally makes the ball faster.",
      "The AI paddle gets sharper as you score.",
    ],
    controls: "W / S / Arrow keys / drag",
  },
  {
    id: "ghost-shooter",
    title: "Ghost Shooter",
    tagline: "Banish them. All of them.",
    description:
      "A top-down siege. Drift through the graveyard, fire ectoplasm bolts and survive escalating waves of enemies.",
    category: "Survival",
    difficulty: "Hard",
    accent: ["#F472B6", "#8B5CF6"],
    glyph: "blaster",
    howTo: [
      "Move with WASD or arrow keys.",
      "Press Space to fire at the nearest enemy.",
      "Each defeated enemy scores 20 points.",
      "Survive as many waves as you can - one hit is fatal.",
    ],
    controls: "WASD move / Space shoot",
  },
  {
    id: "memory-quiz",
    title: "Haunted Memory Quiz",
    tagline: "Ten questions. One haunted mind.",
    description:
      "Folklore, monsters and haunted history. Answer ten eerie questions and see how much you really know.",
    category: "Puzzle",
    difficulty: "Easy",
    accent: ["#A78BFA", "#34D399"],
    glyph: "quiz",
    howTo: [
      "Answer 10 multiple-choice questions.",
      "A correct answer is worth 100 points plus a speed bonus.",
      "Wrong answers cost nothing but your pride.",
      "Your accuracy is shown at the end.",
    ],
    controls: "Mouse / touch / A-D keys",
  },
  {
    id: "ghost-tower",
    title: "Ghost Tower",
    tagline: "Build high. Regret later.",
    description:
      "A tower of haunted bricks swaying in the void. Drop each block as precisely as your nerves allow.",
    category: "Arcade",
    difficulty: "Medium",
    accent: ["#22D3EE", "#A78BFA"],
    glyph: "tower",
    howTo: [
      "Click or press Space to drop the moving block.",
      "Overlap the block below to keep the tower stable.",
      "Perfect drops score double and rebuild width.",
      "The tower collapses if you miss entirely.",
    ],
    controls: "Space / click / tap",
  },
  {
    id: "treasure-hunt",
    title: "Haunted Treasure Hunt",
    tagline: "X marks the cursed spot.",
    description:
      "Explore a foggy graveyard grid, dig up treasure, dodge traps and escape with the crypt key.",
    category: "Adventure",
    difficulty: "Medium",
    accent: ["#FBBF24", "#F472B6"],
    glyph: "chest",
    howTo: [
      "Move one tile at a time with the arrow keys or WASD.",
      "Reveal tiles to find treasure, keys and the exit.",
      "Traps cost a life - you have three.",
      "Collect the keys, then step on the exit to escape.",
    ],
    controls: "Arrow keys / WASD",
  },
  {
    id: "last-ghost",
    title: "The Last Ghost",
    tagline: "The arena remembers the living.",
    description:
      "You are the final spirit in a hostile void. Endless hunters, fading energy, and a clock that never stops.",
    category: "Survival",
    difficulty: "Hard",
    featured: true,
    accent: ["#F472B6", "#22D3EE"],
    glyph: "crown",
    howTo: [
      "Move with WASD or arrow keys to evade hunters.",
      "Collect energy orbs to restore your shield.",
      "Each hunter that touches you drains shield; at zero you fade.",
      "Survive as long as possible. Time is your score.",
    ],
    controls: "Arrow keys / WASD / drag",
  },
];

export const GAME_MAP = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<
  string,
  GameMeta
>;

export const FEATURED_GAMES = GAMES.filter((g) => g.featured);
export const TOTAL_GAMES = GAMES.length;
export const TOTAL_ACHIEVEMENTS = 7;
