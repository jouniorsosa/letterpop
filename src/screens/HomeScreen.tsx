import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { Difficulty, SCREEN_WIDTH, SCREEN_HEIGHT, BUBBLE_COLORS, FONT_SCALE, SCALE } from '../constants';
import { startHomeMusic, stopAllMusic, resumeAudio, isMuted, toggleMute, playPop } from '../game/sounds';

interface Props {
  onSelectMode: (mode: 'alphabet' | 'word', difficulty: Difficulty) => void;
}

const useNative = Platform.OS !== 'web';

function FloatingBubble({ delay, size, color, startX }: {
  delay: number; size: number; color: string; startX: number;
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT + size)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(SCREEN_HEIGHT + size);
      Animated.timing(translateY, {
        toValue: -size * 2,
        duration: 8000 + Math.random() * 4000,
        useNativeDriver: useNative,
      }).start(() => animate());
    };
    const timeout = setTimeout(animate, delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute', left: startX,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color, opacity: 0.3,
        transform: [{ translateY }],
      }}
    />
  );
}

type PickerState = null | 'alphabet' | 'word';

export default function HomeScreen({ onSelectMode }: Props) {
  const [picking, setPicking] = useState<PickerState>(null);
  const [muted, setMutedState] = useState(isMuted());
  const titleScale = useRef(new Animated.Value(0.5)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(50)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    resumeAudio();
    if (!isMuted()) startHomeMusic();
    return () => stopAllMusic();
  }, []);

  const handleToggleMute = () => {
    const nowMuted = toggleMute();
    setMutedState(nowMuted);
    if (!nowMuted) startHomeMusic();
  };

  useEffect(() => {
    Animated.parallel([
      Animated.spring(titleScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: useNative }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: useNative }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(buttonsTranslateY, { toValue: 0, friction: 5, tension: 40, useNativeDriver: useNative }),
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 400, useNativeDriver: useNative }),
      ]).start();
    }, 500);
  }, []);

  const bgBubbles = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      delay: i * 600,
      size: 30 + Math.random() * 40,
      color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
      startX: Math.random() * SCREEN_WIDTH,
    }))
  ).current;

  const handleDifficultySelect = (diff: Difficulty) => {
    if (picking) {
      playPop();
      stopAllMusic();
      onSelectMode(picking, diff);
      setPicking(null);
    }
  };

  // Difficulty picker overlay
  if (picking) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        {bgBubbles.map((b, i) => <FloatingBubble key={i} {...b} />)}

        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>
            {picking === 'alphabet' ? '🔤 ABC Mode' : '📝 Word Mode'}
          </Text>
          <Text style={styles.pickerSubtitle}>Choose Difficulty</Text>

          <TouchableOpacity
            style={[styles.diffButton, styles.easyButton]}
            onPress={() => handleDifficultySelect('easy')}
            activeOpacity={0.8}
          >
            <Text style={styles.diffEmoji}>🐢</Text>
            <View style={styles.diffTextContainer}>
              <Text style={styles.diffTitle}>Easy</Text>
              <Text style={styles.diffDesc}>
                {picking === 'alphabet'
                  ? 'Slow bubbles, lots of time to find letters'
                  : 'Slow bubbles, more letter hints, 35 bubble limit'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.diffButton, styles.mediumButton]}
            onPress={() => handleDifficultySelect('medium')}
            activeOpacity={0.8}
          >
            <Text style={styles.diffEmoji}>🐇</Text>
            <View style={styles.diffTextContainer}>
              <Text style={styles.diffTitle}>Medium</Text>
              <Text style={styles.diffDesc}>
                {picking === 'alphabet'
                  ? 'Normal speed, a good challenge'
                  : 'Moderate speed, some hints, 28 bubble limit'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.diffButton, styles.hardButton]}
            onPress={() => handleDifficultySelect('hard')}
            activeOpacity={0.8}
          >
            <Text style={styles.diffEmoji}>🚀</Text>
            <View style={styles.diffTextContainer}>
              <Text style={styles.diffTitle}>Hard</Text>
              <Text style={styles.diffDesc}>
                {picking === 'alphabet'
                  ? 'Fast bubbles, quick reflexes needed!'
                  : 'Fast bubbles, fewer hints, 24 bubble limit'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setPicking(null)}
          >
            <Text style={styles.cancelText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {bgBubbles.map((b, i) => <FloatingBubble key={i} {...b} />)}

      {/* Mute toggle */}
      <TouchableOpacity style={styles.muteButton} onPress={handleToggleMute}>
        <Text style={styles.muteText}>{muted ? '🔇' : '🔊'}</Text>
      </TouchableOpacity>

      <Animated.View
        style={[styles.titleContainer, {
          transform: [{ scale: titleScale }], opacity: titleOpacity,
        }]}
      >
        <Text style={styles.titleEmoji}>🫧</Text>
        <Text style={styles.title}>Letter Pop</Text>
        <Text style={styles.subtitle}>Pop, Learn & Spell!</Text>
      </Animated.View>

      <Animated.View
        style={[styles.buttonsContainer, {
          transform: [{ translateY: buttonsTranslateY }], opacity: buttonsOpacity,
        }]}
      >
        <TouchableOpacity
          style={[styles.modeButton, styles.alphabetButton]}
          onPress={() => setPicking('alphabet')}
          activeOpacity={0.8}
        >
          <Text style={styles.modeEmoji}>🔤</Text>
          <Text style={styles.modeTitle}>ABC Mode</Text>
          <Text style={styles.modeDesc}>
            Pop the alphabet in order!{'\n'}A → B → C → ... → Z
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, styles.wordButton]}
          onPress={() => setPicking('word')}
          activeOpacity={0.8}
        >
          <Text style={styles.modeEmoji}>📝</Text>
          <Text style={styles.modeTitle}>Word Mode</Text>
          <Text style={styles.modeDesc}>
            Spell words before{'\n'}bubbles fill the screen!
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  muteButton: {
    position: 'absolute', top: 12, right: 20, zIndex: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  muteText: { fontSize: 22 },
  container: {
    flex: 1, backgroundColor: '#1a1a2e',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  titleContainer: { alignItems: 'center', marginBottom: Math.round(50 * SCALE), zIndex: 10 },
  titleEmoji: { fontSize: Math.round(60 * FONT_SCALE), marginBottom: 10 },
  title: {
    fontSize: Math.round(52 * FONT_SCALE), fontWeight: '900', color: '#FFFFFF',
    textShadowColor: '#4ECDC4', textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20, letterSpacing: 2,
  },
  subtitle: { fontSize: Math.round(18 * FONT_SCALE), color: '#B0B0D0', marginTop: 8, fontWeight: '500', letterSpacing: 1 },
  buttonsContainer: { width: SCREEN_WIDTH > 768 ? 500 : SCREEN_WIDTH > 500 ? 420 : SCREEN_WIDTH * 0.85, zIndex: 10 },
  modeButton: {
    borderRadius: 20, padding: Math.round(24 * SCALE), alignItems: 'center', marginBottom: 20,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
  alphabetButton: { backgroundColor: '#4ECDC4' },
  wordButton: { backgroundColor: '#FF6B6B' },
  modeEmoji: { fontSize: Math.round(36 * FONT_SCALE), marginBottom: 8 },
  modeTitle: { fontSize: Math.round(26 * FONT_SCALE), fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  modeDesc: { fontSize: Math.round(14 * FONT_SCALE), color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: Math.round(20 * FONT_SCALE) },

  // Difficulty picker
  pickerContainer: {
    width: SCREEN_WIDTH > 768 ? 500 : SCREEN_WIDTH > 500 ? 420 : SCREEN_WIDTH * 0.9,
    alignItems: 'center', zIndex: 10,
  },
  pickerTitle: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', marginBottom: 4 },
  pickerSubtitle: { fontSize: 16, color: '#B0B0D0', marginBottom: 24, fontWeight: '500' },
  diffButton: {
    width: '100%', borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', marginBottom: 14,
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6,
  },
  easyButton: { backgroundColor: '#27ae60' },
  mediumButton: { backgroundColor: '#f39c12' },
  hardButton: { backgroundColor: '#e74c3c' },
  diffEmoji: { fontSize: 32, marginRight: 14 },
  diffTextContainer: { flex: 1 },
  diffTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  diffDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 16 },
  cancelButton: { marginTop: 10, padding: 12 },
  cancelText: { color: '#B0B0D0', fontSize: 16, fontWeight: '600' },
});
