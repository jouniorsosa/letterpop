import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Bubble, { BubbleData, createBubble } from '../components/Bubble';
import { ALPHABET, Difficulty, ALPHABET_CONFIG, SCREEN_WIDTH } from '../constants';
import { playPop, playWrong, playVictory, startGameMusic, stopAllMusic, isMuted, toggleMute } from '../game/sounds';

const useNative = Platform.OS !== 'web';

interface Props {
  difficulty: Difficulty;
  onBack: () => void;
}

export default function AlphabetScreen({ difficulty, onBack }: Props) {
  const config = ALPHABET_CONFIG[difficulty];
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [wrongTap, setWrongTap] = useState(false);
  const [muted, setMutedState] = useState(isMuted());

  useEffect(() => {
    if (!isMuted()) startGameMusic();
    return () => stopAllMusic();
  }, []);

  const bubblesRef = useRef(bubbles);
  bubblesRef.current = bubbles;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const progressAnim = useRef(new Animated.Value(0)).current;

  // Timer
  useEffect(() => {
    if (gameWon) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameWon, startTime]);

  // Spawn bubbles using difficulty config
  useEffect(() => {
    if (gameWon) return;

    const spawn = () => {
      const idx = currentIndexRef.current;
      const isTarget = Math.random() < config.targetChance;
      const letter = isTarget
        ? ALPHABET[idx]
        : ALPHABET[Math.floor(Math.random() * 26)];

      const bubble = createBubble(letter);
      // Override speed based on difficulty
      bubble.speed = config.bubbleSpeedMin + Math.random() * (config.bubbleSpeedMax - config.bubbleSpeedMin);
      setBubbles(prev => [...prev.slice(-20), bubble]);
    };

    spawn();
    const interval = setInterval(spawn, config.spawnInterval);
    return () => clearInterval(interval);
  }, [gameWon, config]);

  // Clean up old bubbles
  useEffect(() => {
    const cleanup = setInterval(() => {
      setBubbles(prev => prev.length > 15 ? prev.slice(-15) : prev);
    }, 3000);
    return () => clearInterval(cleanup);
  }, []);

  // Progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentIndex / 26,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const handleBubblePress = useCallback((id: string) => {
    const bubble = bubblesRef.current.find(b => b.id === id);
    if (!bubble) return;

    const targetLetter = ALPHABET[currentIndexRef.current];
    if (bubble.letter === targetLetter) {
      playPop();
      setScore(prev => prev + 1);
      setBubbles(prev => prev.filter(b => b.id !== id));
      const nextIndex = currentIndexRef.current + 1;
      if (nextIndex >= 26) {
        stopAllMusic();
        setTimeout(() => playVictory(), 300);
        setGameWon(true);
      } else {
        setCurrentIndex(nextIndex);
      }
    } else {
      playWrong();
      setWrongTap(true);
      setTimeout(() => setWrongTap(false), 300);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const diffColor = difficulty === 'easy' ? '#27ae60' : difficulty === 'medium' ? '#f39c12' : '#e74c3c';

  if (gameWon) {
    return (
      <View style={styles.container}>
        <View style={styles.winContainer}>
          <Text style={styles.winEmoji}>🎉</Text>
          <Text style={styles.winTitle}>Amazing!</Text>
          <Text style={styles.winSubtitle}>You completed the alphabet!</Text>
          <Text style={[styles.winDiff, { color: diffColor }]}>{diffLabel} Mode</Text>
          {difficulty !== 'easy' && (
            <Text style={styles.winTime}>Time: {formatTime(elapsed)}</Text>
          )}
          <TouchableOpacity style={styles.playAgainButton} onPress={() => {
            setCurrentIndex(0); setScore(0); setBubbles([]); setGameWon(false);
          }}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeButton} onPress={onBack}>
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const targetLetter = ALPHABET[currentIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={[styles.diffBadge, { backgroundColor: diffColor }]}>
          <Text style={styles.diffBadgeText}>{diffLabel}</Text>
        </View>
        {difficulty === 'easy' ? (
          <Text style={styles.encouragement}>You got this! ⭐</Text>
        ) : (
          <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        )}
        <TouchableOpacity onPress={() => { const m = toggleMute(); setMutedState(m); if (!m) startGameMusic(); }}>
          <Text style={styles.muteIcon}>{muted ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>
      </View>

      {/* Target letter */}
      <View style={[styles.targetContainer, wrongTap && styles.wrongShake]}>
        <Text style={styles.targetLabel}>Find:</Text>
        <Text style={styles.targetLetter}>{targetLetter}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, {
              width: progressAnim.interpolate({
                inputRange: [0, 1], outputRange: ['0%', '100%'],
              }),
            }]}
          />
        </View>
        <Text style={styles.progressText}>{currentIndex}/26</Text>
      </View>

      {/* Letter strip */}
      <View style={styles.letterStrip}>
        {ALPHABET.map((letter, i) => (
          <Text key={letter} style={[
            styles.stripLetter,
            i < currentIndex && styles.stripLetterDone,
            i === currentIndex && styles.stripLetterCurrent,
          ]}>{letter}</Text>
        ))}
      </View>

      {/* Game board */}
      <View style={styles.gameBoard}>
        {bubbles.map(bubble => (
          <Bubble
            key={bubble.id}
            data={bubble}
            onPress={handleBubblePress}
            highlight={bubble.letter === targetLetter}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10, zIndex: 10,
  },
  backButton: { padding: 8 },
  backText: { color: '#B0B0D0', fontSize: 16, fontWeight: '600' },
  diffBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  diffBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  timer: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  encouragement: { color: '#FFD700', fontSize: 15, fontWeight: '700' },
  muteIcon: { fontSize: 20, padding: 4 },
  targetContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 10, zIndex: 10,
  },
  wrongShake: { backgroundColor: 'rgba(255, 80, 80, 0.2)' },
  targetLabel: { color: '#B0B0D0', fontSize: 20, fontWeight: '600', marginRight: 12 },
  targetLetter: {
    color: '#FFD700', fontSize: 48, fontWeight: '900',
    textShadowColor: '#FFD700', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15,
  },
  progressContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, zIndex: 10,
  },
  progressTrack: {
    flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#4ECDC4', borderRadius: 4 },
  progressText: { color: '#B0B0D0', fontSize: 14, fontWeight: '600', marginLeft: 10, fontVariant: ['tabular-nums'] },
  letterStrip: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    paddingHorizontal: 10, paddingVertical: 8, zIndex: 10,
  },
  stripLetter: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.2)', width: 14, textAlign: 'center' },
  stripLetterDone: { color: '#4ECDC4' },
  stripLetterCurrent: { color: '#FFD700', fontSize: 13 },
  gameBoard: { flex: 1, overflow: 'hidden' },
  winContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  winEmoji: { fontSize: 80, marginBottom: 20 },
  winTitle: {
    fontSize: 42, fontWeight: '900', color: '#FFD700',
    textShadowColor: '#FFD700', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  winSubtitle: { fontSize: 20, color: '#B0B0D0', marginTop: 10 },
  winDiff: { fontSize: 18, fontWeight: '700', marginTop: 6 },
  winTime: { fontSize: 24, color: '#4ECDC4', fontWeight: '700', marginTop: 6, marginBottom: 30 },
  playAgainButton: { backgroundColor: '#4ECDC4', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30, marginBottom: 15 },
  playAgainText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  homeButton: { paddingHorizontal: 40, paddingVertical: 12 },
  homeButtonText: { fontSize: 16, color: '#B0B0D0', fontWeight: '600' },
});
