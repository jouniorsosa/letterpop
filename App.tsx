import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Platform } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import AlphabetScreen from './src/screens/AlphabetScreen';
import WordScreen from './src/screens/WordScreen';
import { Difficulty } from './src/constants';

type Screen = 'home' | 'alphabet' | 'word';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  const handleSelectMode = (mode: 'alphabet' | 'word', diff: Difficulty) => {
    setDifficulty(diff);
    setScreen(mode);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {screen === 'home' && (
        <HomeScreen onSelectMode={handleSelectMode} />
      )}
      {screen === 'alphabet' && (
        <AlphabetScreen difficulty={difficulty} onBack={() => setScreen('home')} />
      )}
      {screen === 'word' && (
        <WordScreen difficulty={difficulty} onBack={() => setScreen('home')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
