import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import MainTabs from './MainTabs';

export default function RootNavigator() {
  const { loggedIn } = useApp();
  const { colors } = useTheme();

  return <View style={[styles.container, { backgroundColor: colors.background }]}>{loggedIn ? <MainTabs /> : <LoginScreen />}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
