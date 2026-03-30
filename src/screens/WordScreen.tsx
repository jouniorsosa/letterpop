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
import { isValidWord } from '../game/dictionary';
import { PictureWord, getRandomPictureWord, isPictureWord } from '../game/pictureWords';
import {
  ALPHABET,
  Difficulty,
  WORD_CONFIG,
  WORD_GROUPS,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} from '../constants';
import { playPop, playWordSuccess, playPictureBonus, playGameOver, startGameMusic, stopAllMusic, isMuted, toggleMute } from '../game/sounds';

const useNative = Platform.OS !== 'web';

interface Props {
  difficulty: Difficulty;
  onBack: () => void;
}

/**
 * Pick a random word from WORD_GROUPS and return its letters.
 * This "clusters" letters so children have a real chance of forming words.
 */
function pickClusterLetters(size: number): string[] {
  const word = WORD_GROUPS[Math.floor(Math.random() * WORD_GROUPS.length)];
  const letters = word.split('');
  // Pad with common vowels / consonants if word is shorter than cluster size
  const extras = 'AEIOUSTRNL';
  while (letters.length < size) {
    letters.push(extras[Math.floor(Math.random() * extras.length)]);
  }
  // Shuffle so they don't arrive in order
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters.slice(0, size);
}

export default function WordScreen({ difficulty, onBack }: Props) {
  const config = WORD_CONFIG[difficulty];
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [score, setScore] = useState(0);
  const [wordsFound, setWordsFound] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState('');
  const [pictureWord, setPictureWord] = useState<PictureWord>(getRandomPictureWord());
  const [pictureMatched, setPictureMatched] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMutedState] = useState(isMuted());

  useEffect(() => {
    if (!isMuted()) startGameMusic();
    return () => stopAllMusic();
  }, []);

  const bubblesRef = useRef(bubbles);
  bubblesRef.current = bubbles;
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const fillAnim = useRef(new Animated.Value(0)).current;
  const messageAnim = useRef(new Animated.Value(0)).current;

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, startTime]);

  // Spawn bubbles — uses cluster logic to group letters into word hints
  useEffect(() => {
    if (gameOver) return;

    // Cluster queue: pre-queued letters to drip-feed one at a time
    let clusterQueue: string[] = [];

    const spawnOne = (): BubbleData => {
      let letter: string;

      if (clusterQueue.length > 0) {
        letter = clusterQueue.shift()!;
      } else if (Math.random() < config.clusterChance) {
        const cluster = pickClusterLetters(config.clusterSize);
        letter = cluster.shift()!;
        clusterQueue = cluster;
      } else {
        const weighted = 'AAABCDDEEEFGHIIIJKLMNNOOOPQRRSSSTTUUVWXYZ';
        letter = weighted[Math.floor(Math.random() * weighted.length)];
      }

      const bubble = createBubble(letter);
      bubble.speed = config.bubbleSpeedMin + Math.random() * (config.bubbleSpeedMax - config.bubbleSpeedMin);
      return bubble;
    };

    const spawn = () => {
      const bubble = spawnOne();
      setBubbles(prev => {
        const next = [...prev, bubble];
        if (next.length >= config.maxBubbles) {
          stopAllMusic();
          setTimeout(() => playGameOver(), 200);
          setGameOver(true);
        }
        return next;
      });
    };

    // Immediate burst: spawn 5-8 letters right away so the board isn't empty
    const initialBurst: BubbleData[] = [];
    const burstCount = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < burstCount; i++) {
      initialBurst.push(spawnOne());
    }
    setBubbles(prev => [...prev, ...initialBurst]);

    spawn();
    const interval = setInterval(spawn, config.spawnInterval);
    return () => clearInterval(interval);
  }, [gameOver, config]);

  // Fill meter animation
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: bubbles.length / config.maxBubbles,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [bubbles.length, config.maxBubbles]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    messageAnim.setValue(1);
    Animated.timing(messageAnim, { toValue: 0, duration: 1500, useNativeDriver: useNative }).start(() => setMessage(''));
  };

  // Build the current word from selectedIds so it's always in sync
  const buildWordFromIds = (ids: string[]): string => {
    return ids
      .map(sid => bubblesRef.current.find(b => b.id === sid))
      .filter(Boolean)
      .map(b => b!.letter)
      .join('');
  };

  const handleBubblePress = useCallback((id: string) => {
    playPop();
    const bubble = bubblesRef.current.find(b => b.id === id);
    if (!bubble) return;

    if (selectedIdsRef.current.includes(id)) {
      // Deselect: remove this specific bubble ID
      const newIds = selectedIdsRef.current.filter(sid => sid !== id);
      setSelectedIds(newIds);
      setCurrentWord(buildWordFromIds(newIds));
      setBubbles(prev => prev.map(b => b.id === id ? { ...b, selected: false } : b));
    } else {
      // Select: append this bubble ID
      const newIds = [...selectedIdsRef.current, id];
      setSelectedIds(newIds);
      setCurrentWord(buildWordFromIds(newIds));
      setBubbles(prev => prev.map(b => b.id === id ? { ...b, selected: true } : b));
    }
  }, []);

  const handleSubmitWord = () => {
    if (currentWord.length < 3) { showMessage('Need 3+ letters!'); return; }
    if (wordsFound.includes(currentWord.toLowerCase())) { showMessage('Already found!'); return; }

    if (isValidWord(currentWord)) {
      const wordLen = currentWord.length;
      const isPicMatch = isPictureWord(currentWord, pictureWord);

      if (isPicMatch) {
        // PICTURE WORD BONUS — festive celebration!
        playPictureBonus();
        const wordScore = wordLen * 25; // 2.5x normal scoring
        setScore(prev => prev + wordScore);
        setPictureMatched(true);

        // Remove LOTS of bubbles as reward — half the board!
        setBubbles(prev => {
          let remaining = prev.filter(b => !selectedIdsRef.current.includes(b.id));
          const bonusClear = Math.floor(remaining.length * 0.5);
          remaining = remaining.slice(bonusClear);
          return remaining;
        });

        showMessage(`🎉 ${pictureWord.emoji} +${wordScore} BONUS! 🎉`);

        // New picture word after a short delay
        setTimeout(() => {
          setPictureWord(getRandomPictureWord());
          setPictureMatched(false);
        }, 2000);
      } else {
        playWordSuccess();
        const wordScore = wordLen * 10 + (wordLen > 4 ? 20 : 0);
        setScore(prev => prev + wordScore);

        // Bonus: longer words remove extra bubbles from the board
        const bonusRemove = wordLen <= 3 ? 0 : wordLen <= 4 ? 1 : wordLen <= 5 ? 3 : 5;

        setBubbles(prev => {
          let remaining = prev.filter(b => !selectedIdsRef.current.includes(b.id));
          if (bonusRemove > 0 && remaining.length > 0) {
            remaining = remaining.slice(Math.min(bonusRemove, remaining.length));
          }
          return remaining;
        });

        const totalRemoved = wordLen + bonusRemove;
        if (bonusRemove > 0) {
          showMessage(`+${wordScore} pts! −${totalRemoved} bubbles!`);
        } else {
          showMessage(`+${wordScore} points!`);
        }
      }

      setWordsFound(prev => [...prev, currentWord.toLowerCase()]);

      setSelectedIds([]);
      setCurrentWord('');
    } else {
      showMessage('Not a word!');
    }
  };

  const handleClear = () => {
    setBubbles(prev => prev.map(b => ({ ...b, selected: false })));
    setSelectedIds([]);
    setCurrentWord('');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const diffColor = difficulty === 'easy' ? '#27ae60' : difficulty === 'medium' ? '#f39c12' : '#e74c3c';

  if (gameOver) {
    return (
      <View style={styles.container}>
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverEmoji}>💥</Text>
          <Text style={styles.gameOverTitle}>Game Over!</Text>
          <Text style={styles.gameOverScore}>Score: {score}</Text>
          <Text style={[styles.gameOverDiff, { color: diffColor }]}>{diffLabel} Mode</Text>
          <Text style={styles.gameOverWords}>Words found: {wordsFound.length}</Text>
          {difficulty !== 'easy' && (
            <Text style={styles.gameOverTime}>Time: {formatTime(elapsed)}</Text>
          )}

          {wordsFound.length > 0 && (
            <View style={styles.wordsList}>
              {wordsFound.map((w, i) => (
                <Text key={i} style={styles.foundWord}>{w.toUpperCase()}</Text>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.playAgainButton} onPress={() => {
            setBubbles([]); setSelectedIds([]); setCurrentWord('');
            setScore(0); setWordsFound([]); setGameOver(false);
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
        <Text style={styles.scoreText}>Score: {score}</Text>
        {difficulty === 'easy' ? (
          <Text style={styles.encouragement}>Keep going! ⭐</Text>
        ) : (
          <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        )}
        <TouchableOpacity onPress={() => { const m = toggleMute(); setMutedState(m); if (!m) startGameMusic(); }}>
          <Text style={styles.muteIcon}>{muted ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>
      </View>

      {/* Fill meter */}
      <View style={styles.fillMeterContainer}>
        <Animated.View style={[styles.fillMeter, {
          width: fillAnim.interpolate({ inputRange: [0, 0.5, 0.75, 1], outputRange: ['0%', '50%', '75%', '100%'] }),
          backgroundColor: fillAnim.interpolate({ inputRange: [0, 0.5, 0.75, 1], outputRange: ['#4ECDC4', '#FFEAA7', '#FF9F43', '#FF6B6B'] }),
        }]} />
        <Text style={styles.fillText}>{bubbles.length}/{config.maxBubbles}</Text>
      </View>

      {/* Picture word hint */}
      <View style={[styles.pictureHint, pictureMatched && styles.pictureMatched]}>
        <Text style={styles.pictureEmoji}>{pictureWord.emoji}</Text>
        <View>
          <Text style={styles.pictureLabel}>Bonus: spell "{pictureWord.label}"!</Text>
          {pictureMatched && <Text style={styles.pictureMatchText}>🎉 Amazing! 🎉</Text>}
        </View>
      </View>

      {/* Word building area */}
      <View style={styles.wordArea}>
        <View style={styles.wordDisplay}>
          <Text style={styles.wordText}>{currentWord || 'Tap letters...'}</Text>
        </View>
        <View style={styles.wordActions}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, currentWord.length < 3 && styles.submitDisabled]}
            onPress={handleSubmitWord}
            disabled={currentWord.length < 3}
          >
            <Text style={styles.submitText}>Submit ✓</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Message */}
      {message ? (
        <Animated.View style={[styles.messageContainer, { opacity: messageAnim }]}>
          <Text style={styles.messageText}>{message}</Text>
        </Animated.View>
      ) : null}

      {/* Game board */}
      <View style={styles.gameBoard}>
        {bubbles.map(bubble => (
          <Bubble key={bubble.id} data={bubble} onPress={handleBubblePress} shouldStop />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Words: {wordsFound.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 10, zIndex: 10,
  },
  backButton: { padding: 8 },
  backText: { color: '#B0B0D0', fontSize: 16, fontWeight: '600' },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  diffBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  scoreText: { color: '#FFD700', fontSize: 16, fontWeight: '800' },
  timer: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  encouragement: { color: '#FFD700', fontSize: 14, fontWeight: '700' },
  muteIcon: { fontSize: 20, padding: 4 },
  pictureHint: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.12)', borderRadius: 14,
    borderWidth: 2, borderColor: 'rgba(255, 215, 0, 0.3)',
    borderStyle: 'dashed', zIndex: 10,
  },
  pictureMatched: {
    backgroundColor: 'rgba(78, 205, 196, 0.25)',
    borderColor: '#4ECDC4', borderStyle: 'solid',
  },
  pictureEmoji: { fontSize: 38, marginRight: 12 },
  pictureLabel: { color: '#FFD700', fontSize: 15, fontWeight: '700' },
  pictureMatchText: { color: '#4ECDC4', fontSize: 14, fontWeight: '800', marginTop: 2 },
  fillMeterContainer: {
    marginHorizontal: 20, height: 12, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6, overflow: 'hidden', zIndex: 10,
  },
  fillMeter: { height: '100%', borderRadius: 6 },
  fillText: { position: 'absolute', right: 8, top: -1, fontSize: 10, color: '#FFFFFF', fontWeight: '700' },
  wordArea: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, zIndex: 10,
  },
  wordDisplay: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, padding: 12, minHeight: 48, justifyContent: 'center',
  },
  wordText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', letterSpacing: 3, textAlign: 'center' },
  wordActions: { flexDirection: 'row', marginLeft: 10 },
  clearButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,107,107,0.3)', justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  clearText: { color: '#FF6B6B', fontSize: 20, fontWeight: '700' },
  submitButton: {
    paddingHorizontal: 16, height: 44, borderRadius: 22,
    backgroundColor: '#4ECDC4', justifyContent: 'center', alignItems: 'center',
  },
  submitDisabled: { backgroundColor: 'rgba(78,205,196,0.3)' },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  messageContainer: {
    position: 'absolute', top: SCREEN_HEIGHT * 0.35,
    left: 0, right: 0, alignItems: 'center', zIndex: 20,
  },
  messageText: {
    backgroundColor: 'rgba(0,0,0,0.8)', color: '#FFD700', fontSize: 24, fontWeight: '800',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, overflow: 'hidden',
  },
  gameBoard: { flex: 1, overflow: 'hidden' },
  footer: { padding: 12, alignItems: 'center', zIndex: 10 },
  footerText: { color: '#B0B0D0', fontSize: 14, fontWeight: '600' },
  gameOverContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  gameOverEmoji: { fontSize: 70, marginBottom: 16 },
  gameOverTitle: { fontSize: 42, fontWeight: '900', color: '#FF6B6B' },
  gameOverScore: { fontSize: 32, fontWeight: '800', color: '#FFD700', marginTop: 12 },
  gameOverDiff: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  gameOverWords: { fontSize: 18, color: '#4ECDC4', fontWeight: '600', marginTop: 6 },
  gameOverTime: { fontSize: 16, color: '#B0B0D0', marginTop: 4, marginBottom: 16 },
  wordsList: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    marginBottom: 24, maxWidth: SCREEN_WIDTH * 0.8,
  },
  foundWord: {
    backgroundColor: 'rgba(78,205,196,0.2)', color: '#4ECDC4', fontSize: 14, fontWeight: '700',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, margin: 4,
  },
  playAgainButton: {
    backgroundColor: '#FF6B6B', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30, marginBottom: 15,
  },
  playAgainText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  homeButton: { paddingHorizontal: 40, paddingVertical: 12 },
  homeButtonText: { fontSize: 16, color: '#B0B0D0', fontWeight: '600' },
});
