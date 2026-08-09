import React, { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { DropdownPicker, EmptyState, IconButton, Input, SectionTitle } from '../components/ui';
import { useScopedData } from '../hooks';
import { scopeChatMessages, ROLE_PERMISSIONS } from '../utils/scope';
import { ChatMessage } from '../types';

export default function ChatCommandCenterScreen() {
  const { role, currentSppg, chatMessages, sendChatMessage } = useApp();
  const { sppgInScope } = useScopedData();
  const { colors, spacing, fontSize, radius } = useTheme();
  const [text, setText] = useState('');

  const isSupervisor = !!role && ROLE_PERMISSIONS[role].isViewOnly;
  const [selectedSppgId, setSelectedSppgId] = useState<string>(currentSppg?.id ?? sppgInScope[0]?.id ?? '');
  const activeSppgId = isSupervisor ? selectedSppgId : currentSppg?.id ?? '';

  const thread = useMemo(
    () => scopeChatMessages(sppgInScope, chatMessages).filter((m) => m.sppgId === activeSppgId),
    [sppgInScope, chatMessages, activeSppgId],
  );

  const send = () => {
    if (!text.trim() || !activeSppgId || isSupervisor) return;
    sendChatMessage(activeSppgId, text.trim());
    setText('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={{ padding: 16, gap: 10 }}>
          <View style={[styles.disclaimer, { backgroundColor: colors.primaryLight, borderRadius: radius.md }]}>
            <Feather name="message-square" size={16} color={colors.primary} strokeWidth={1.75} />
            <Text style={{ color: colors.text, fontSize: fontSize.xs, flex: 1 }}>
              Saluran Komunikasi Langsung Command Center — Terhubung langsung dengan pengawas operasional SPPG.
            </Text>
          </View>

          {isSupervisor && (
            <DropdownPicker
              label="SPPG"
              icon="home"
              value={selectedSppgId}
              options={sppgInScope.map((s) => ({ label: s.nama, value: s.id }))}
              onSelect={setSelectedSppgId}
            />
          )}
          <SectionTitle style={{ marginBottom: 0 }}>Chat Command Center</SectionTitle>
        </View>

        {thread.length === 0 ? (
          <EmptyState icon="message-circle" title="Belum Ada Percakapan" body="Belum ada pesan pada thread ini." />
        ) : (
          <FlatList
            data={thread}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item }) => <ChatBubble message={item} />}
          />
        )}

        {!isSupervisor && (
          <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <Input
              value={text}
              onChangeText={setText}
              placeholder="Tulis pesan..."
              containerStyle={{ flex: 1 }}
            />
            <IconButton icon="send" tone="primary" onPress={send} disabled={!text.trim()} />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const { colors, fontSize, radius } = useTheme();
  const isSppg = message.sender === 'sppg';

  return (
    <View style={[styles.bubbleRow, { justifyContent: isSppg ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isSppg ? colors.primary : colors.surface,
            borderColor: colors.border,
            borderWidth: isSppg ? 0 : 1,
            borderRadius: radius.md,
          },
        ]}
      >
        <Text style={{ color: isSppg ? colors.textInverse : colors.textMuted, fontSize: 10, fontWeight: '700', marginBottom: 2 }}>
          {message.senderName}
        </Text>
        <Text style={{ color: isSppg ? colors.textInverse : colors.text, fontSize: fontSize.sm }}>{message.text}</Text>
        <Text style={{ color: isSppg ? colors.textInverse : colors.textMuted, fontSize: 10, marginTop: 4, opacity: 0.8 }}>
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '80%', padding: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1 },
});
