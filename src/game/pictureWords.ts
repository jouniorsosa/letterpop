/**
 * Picture word system — shows an emoji hint and if the child
 * spells that word, they get a big bonus + festive celebration.
 */

export interface PictureWord {
  word: string;
  emoji: string;
  label: string; // friendly label under emoji
}

const PICTURE_WORDS: PictureWord[] = [
  // Animals
  { word: 'CAT', emoji: '🐱', label: 'Cat' },
  { word: 'DOG', emoji: '🐶', label: 'Dog' },
  { word: 'FISH', emoji: '🐟', label: 'Fish' },
  { word: 'BIRD', emoji: '🐦', label: 'Bird' },
  { word: 'FROG', emoji: '🐸', label: 'Frog' },
  { word: 'BEAR', emoji: '🐻', label: 'Bear' },
  { word: 'DUCK', emoji: '🦆', label: 'Duck' },
  { word: 'LION', emoji: '🦁', label: 'Lion' },
  { word: 'COW', emoji: '🐄', label: 'Cow' },
  { word: 'PIG', emoji: '🐷', label: 'Pig' },
  { word: 'OWL', emoji: '🦉', label: 'Owl' },
  { word: 'BEE', emoji: '🐝', label: 'Bee' },
  { word: 'ANT', emoji: '🐜', label: 'Ant' },
  { word: 'FOX', emoji: '🦊', label: 'Fox' },
  { word: 'BAT', emoji: '🦇', label: 'Bat' },
  { word: 'HEN', emoji: '🐔', label: 'Hen' },
  { word: 'RAM', emoji: '🐏', label: 'Ram' },
  { word: 'DEER', emoji: '🦌', label: 'Deer' },
  { word: 'WHALE', emoji: '🐋', label: 'Whale' },
  { word: 'HORSE', emoji: '🐴', label: 'Horse' },
  { word: 'MOUSE', emoji: '🐭', label: 'Mouse' },
  { word: 'BUNNY', emoji: '🐰', label: 'Bunny' },
  { word: 'SNAKE', emoji: '🐍', label: 'Snake' },
  { word: 'SNAIL', emoji: '🐌', label: 'Snail' },
  { word: 'PANDA', emoji: '🐼', label: 'Panda' },
  { word: 'ZEBRA', emoji: '🦓', label: 'Zebra' },
  { word: 'CAMEL', emoji: '🐪', label: 'Camel' },
  { word: 'GOAT', emoji: '🐐', label: 'Goat' },
  { word: 'TIGER', emoji: '🐯', label: 'Tiger' },

  // Food
  { word: 'APPLE', emoji: '🍎', label: 'Apple' },
  { word: 'CAKE', emoji: '🎂', label: 'Cake' },
  { word: 'PIE', emoji: '🥧', label: 'Pie' },
  { word: 'EGG', emoji: '🥚', label: 'Egg' },
  { word: 'CORN', emoji: '🌽', label: 'Corn' },
  { word: 'GRAPE', emoji: '🍇', label: 'Grape' },
  { word: 'PEACH', emoji: '🍑', label: 'Peach' },
  { word: 'LEMON', emoji: '🍋', label: 'Lemon' },
  { word: 'MELON', emoji: '🍈', label: 'Melon' },
  { word: 'PIZZA', emoji: '🍕', label: 'Pizza' },
  { word: 'TACO', emoji: '🌮', label: 'Taco' },
  { word: 'COOKIE', emoji: '🍪', label: 'Cookie' },
  { word: 'CANDY', emoji: '🍬', label: 'Candy' },
  { word: 'HONEY', emoji: '🍯', label: 'Honey' },
  { word: 'BREAD', emoji: '🍞', label: 'Bread' },
  { word: 'MILK', emoji: '🥛', label: 'Milk' },
  { word: 'ICE', emoji: '🧊', label: 'Ice' },

  // Nature
  { word: 'SUN', emoji: '☀️', label: 'Sun' },
  { word: 'MOON', emoji: '🌙', label: 'Moon' },
  { word: 'STAR', emoji: '⭐', label: 'Star' },
  { word: 'TREE', emoji: '🌳', label: 'Tree' },
  { word: 'RAIN', emoji: '🌧️', label: 'Rain' },
  { word: 'FIRE', emoji: '🔥', label: 'Fire' },
  { word: 'FLOWER', emoji: '🌸', label: 'Flower' },
  { word: 'LEAF', emoji: '🍃', label: 'Leaf' },
  { word: 'CLOUD', emoji: '☁️', label: 'Cloud' },
  { word: 'OCEAN', emoji: '🌊', label: 'Ocean' },
  { word: 'SNOW', emoji: '❄️', label: 'Snow' },
  { word: 'ROSE', emoji: '🌹', label: 'Rose' },

  // Objects
  { word: 'BOAT', emoji: '⛵', label: 'Boat' },
  { word: 'CAR', emoji: '🚗', label: 'Car' },
  { word: 'BELL', emoji: '🔔', label: 'Bell' },
  { word: 'DRUM', emoji: '🥁', label: 'Drum' },
  { word: 'LAMP', emoji: '💡', label: 'Lamp' },
  { word: 'RING', emoji: '💍', label: 'Ring' },
  { word: 'KEY', emoji: '🔑', label: 'Key' },
  { word: 'BOOK', emoji: '📖', label: 'Book' },
  { word: 'BALL', emoji: '⚽', label: 'Ball' },
  { word: 'KITE', emoji: '🪁', label: 'Kite' },
  { word: 'GIFT', emoji: '🎁', label: 'Gift' },
  { word: 'HOUSE', emoji: '🏠', label: 'House' },
  { word: 'TRAIN', emoji: '🚂', label: 'Train' },
  { word: 'CROWN', emoji: '👑', label: 'Crown' },
  { word: 'HEART', emoji: '❤️', label: 'Heart' },
  { word: 'ROCKET', emoji: '🚀', label: 'Rocket' },
  { word: 'PIANO', emoji: '🎹', label: 'Piano' },

  // People & Body
  { word: 'BABY', emoji: '👶', label: 'Baby' },
  { word: 'KING', emoji: '🤴', label: 'King' },
  { word: 'QUEEN', emoji: '👸', label: 'Queen' },
  { word: 'EYE', emoji: '👁️', label: 'Eye' },
  { word: 'HAND', emoji: '✋', label: 'Hand' },
  { word: 'FOOT', emoji: '🦶', label: 'Foot' },
];

let recentWords: string[] = [];

/** Pick a new random picture word, avoiding recent repeats. */
export function getRandomPictureWord(): PictureWord {
  const available = PICTURE_WORDS.filter(pw => !recentWords.includes(pw.word));
  const pool = available.length > 0 ? available : PICTURE_WORDS;
  const pick = pool[Math.floor(Math.random() * pool.length)];

  recentWords.push(pick.word);
  if (recentWords.length > 10) recentWords.shift();

  return pick;
}

/** Check if a submitted word matches a picture word */
export function isPictureWord(word: string, current: PictureWord): boolean {
  return word.toUpperCase() === current.word.toUpperCase();
}
