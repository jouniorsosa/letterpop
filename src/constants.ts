import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
export const BUBBLE_SIZE = 85;

export type Difficulty = 'easy' | 'medium' | 'hard';

// --- ABC Mode difficulty ---
export const ALPHABET_CONFIG: Record<Difficulty, {
  spawnInterval: number;   // ms between bubble spawns
  bubbleSpeedMin: number;  // min rise duration (higher = slower)
  bubbleSpeedMax: number;  // max rise duration
  targetChance: number;    // chance the spawned letter is the target
}> = {
  easy: {
    spawnInterval: 1800,
    bubbleSpeedMin: 16000,
    bubbleSpeedMax: 22000,
    targetChance: 0.55,
  },
  medium: {
    spawnInterval: 1300,
    bubbleSpeedMin: 6000,
    bubbleSpeedMax: 9000,
    targetChance: 0.4,
  },
  hard: {
    spawnInterval: 900,
    bubbleSpeedMin: 3500,
    bubbleSpeedMax: 5500,
    targetChance: 0.3,
  },
};

// --- Word Mode difficulty ---
// "wordGroups" are short common words whose letters spawn together in clusters
export const WORD_GROUPS = [
  'CAT', 'DOG', 'SUN', 'HAT', 'RUN', 'BIG', 'CUP', 'RED', 'BED', 'FUN',
  'HOT', 'PEN', 'MOM', 'DAD', 'HUG', 'BUS', 'FOX', 'BOX', 'MAP', 'PIG',
  'BAT', 'NET', 'JAM', 'HOP', 'JOG', 'MIX', 'ZIP', 'BEE', 'COW', 'OWL',
  'APE', 'ANT', 'FAN', 'PAN', 'TEN', 'HEN', 'DIG', 'LOG', 'MUD', 'NUT',
  'PIE', 'TOY', 'BOY', 'KEY', 'ICE', 'AGE', 'AIR', 'ARM', 'EGG', 'EAR',
  'CAKE', 'FISH', 'BIRD', 'TREE', 'STAR', 'MOON', 'RAIN', 'FIRE', 'BOAT',
  'FROG', 'DUCK', 'BEAR', 'DEER', 'LAMP', 'BELL', 'DRUM', 'LION', 'CORN',
  'MILK', 'RING', 'HOME', 'GAME', 'LOVE', 'HOPE', 'PLAY', 'SING', 'JUMP',
  'APPLE', 'BEACH', 'CHAIR', 'DANCE', 'EAGLE', 'GRAPE', 'HOUSE', 'MUSIC',
];

export const WORD_CONFIG: Record<Difficulty, {
  spawnInterval: number;     // ms between spawns
  bubbleSpeedMin: number;    // slower = easier to read
  bubbleSpeedMax: number;
  maxBubbles: number;        // game over threshold
  clusterChance: number;     // chance to spawn a word-cluster batch
  clusterSize: number;       // how many letters in a cluster batch
}> = {
  easy: {
    spawnInterval: 1400,
    bubbleSpeedMin: 16000,
    bubbleSpeedMax: 22000,
    maxBubbles: 45,
    clusterChance: 0.75,
    clusterSize: 3,
  },
  medium: {
    spawnInterval: 1600,
    bubbleSpeedMin: 7000,
    bubbleSpeedMax: 10000,
    maxBubbles: 28,
    clusterChance: 0.5,
    clusterSize: 4,
  },
  hard: {
    spawnInterval: 1100,
    bubbleSpeedMin: 4500,
    bubbleSpeedMax: 7000,
    maxBubbles: 24,
    clusterChance: 0.35,
    clusterSize: 5,
  },
};

export const BUBBLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F1948A', '#82E0AA',
  '#F8C471', '#AED6F1', '#D7BDE2', '#A3E4D7',
];

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
