import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { statusBg, statusColors, statusLabel } from '../theme';
import { AlertTingkat } from '../types';

// ==========================================
// SCREEN
// ==========================================
export interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  safe?: boolean;
  backgroundColor?: string;
  statusBarStyle?: 'auto' | 'light' | 'dark';
}

export function Screen({
  children,
  style,
  safe = true,
  backgroundColor,
  statusBarStyle,
}: ScreenProps) {
  const { colors, isDark } = useTheme();
  const bg = backgroundColor || colors.background;
  const barStyle = statusBarStyle || (isDark ? 'light' : 'dark');

  const Container = safe ? SafeAreaView : View;

  return (
    <Container style={[styles.screenContainer, { backgroundColor: bg }, style]}>
      <StatusBar style={barStyle} backgroundColor={bg} animated />
      {children}
    </Container>
  );
}

// ==========================================
// CARD
// ==========================================
export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outlined' | 'elevated' | 'glass' | 'accent';
  activeOpacity?: number;
}

export function Card({
  children,
  style,
  onPress,
  disabled = false,
  variant = 'default',
  activeOpacity = 0.88,
}: CardProps) {
  const { colors, isDark, radius, shadow } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderStrong,
        };
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)',
          ...shadow.md,
        };
      case 'glass':
        return {
          backgroundColor: colors.glassBackground,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        };
      case 'accent':
        return {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(224, 230, 237, 0.95)',
          borderLeftWidth: 4.5,
          borderLeftColor: colors.gold || colors.primary,
          ...shadow.card,
        };
      case 'default':
      default:
        return {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderWidth: 1,
          borderColor: isDark ? colors.border : 'rgba(226, 232, 240, 0.9)',
          ...shadow.card,
        };
    }
  };

  const cardStyle: ViewStyle = {
    borderRadius: radius.lg,
    padding: 16,
    ...getVariantStyles(),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          cardStyle,
          pressed && !disabled && { opacity: activeOpacity, transform: [{ scale: 0.985 }] },
          disabled && { opacity: 0.6 },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

// ==========================================
// SECTION TITLE
// ==========================================
export interface SectionTitleProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  action?: React.ReactNode;
}

export function SectionTitle({ children, style, action }: SectionTitleProps) {
  const { colors, fontSize, spacing } = useTheme();

  return (
    <View style={[styles.sectionHeader, { marginBottom: spacing.sm + 2 }]}>
      <View style={styles.sectionTitleWrap}>
        <View style={[styles.sectionAccentBar, { backgroundColor: colors.gold || colors.primary }]} />
        <Text style={[styles.sectionTitleText, { color: colors.text, fontSize: fontSize.lg, flexShrink: 1 }, style]}>
          {children}
        </Text>
      </View>
      {action && <View style={{ marginLeft: spacing.xs }}>{action}</View>}
    </View>
  );
}

// ==========================================
// STATUS BADGE (dot + label for normal | perhatian | emergency)
// ==========================================
export interface StatusBadgeProps {
  status: AlertTingkat;
  style?: StyleProp<ViewStyle>;
}

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const { colors, fontSize, radius, spacing, statusBg: dynamicStatusBg, statusColors: dynamicStatusColors } = useTheme();

  const bg = dynamicStatusBg[status] || colors.border;
  const dotColor = dynamicStatusColors[status] || colors.textMuted;
  const labelText = statusLabel[status] || status;

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 1 }, style]}>
      <View style={[styles.dotContainer, { backgroundColor: `${dotColor}25` }]}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      </View>
      <Text style={[styles.badgeText, { color: colors.text, fontSize: fontSize.xs }]}>
        {labelText}
      </Text>
    </View>
  );
}

// Alias kept for call-site clarity where only the dot+label semantic matters (e.g. table rows).
export const StatusDot = StatusBadge;

export interface PillProps {
  label: string;
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'primary';
  icon?: keyof typeof Feather.glyphMap;
  dot?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Pill({ label, tone = 'info', icon, dot, onPress, style }: PillProps) {
  const { colors, fontSize, iconStrokeWidth, radius, spacing } = useTheme();

  const toneMap = {
    info: { bg: colors.infoBg, fg: colors.info, dot: colors.info },
    success: { bg: colors.successBg, fg: colors.success, dot: colors.success },
    warning: { bg: colors.warningBg, fg: colors.text, dot: colors.warning },
    danger: { bg: colors.dangerBg, fg: colors.danger, dot: colors.danger },
    neutral: { bg: colors.border, fg: colors.text, dot: colors.textMuted },
    primary: { bg: colors.primaryLight, fg: colors.primary, dot: colors.primary },
  } as const;

  const t = toneMap[tone] || toneMap.info;

  const content = (
    <View style={[styles.badge, { backgroundColor: t.bg, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: t.dot }]} />}
      {icon && <Feather name={icon} size={13} color={t.fg} strokeWidth={iconStrokeWidth} />}
      <Text style={[styles.badgeText, { color: t.fg, fontSize: fontSize.xs, flexShrink: 1 }]}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.75 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

// ==========================================
// PRIMARY BUTTON
// ==========================================
export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: keyof typeof Feather.glyphMap;
  iconRight?: keyof typeof Feather.glyphMap;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  icon,
  iconRight,
  fullWidth = true,
  style,
  textStyle,
}: PrimaryButtonProps) {
  const { colors, fontSize, iconSize, iconStrokeWidth, radius } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: colors.primaryLight,
          text: colors.primary,
          border: 'transparent',
          spinner: colors.primary,
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: colors.text,
          border: colors.borderStrong,
          spinner: colors.text,
        };
      case 'danger':
        return {
          bg: colors.danger,
          text: '#FFFFFF',
          border: 'transparent',
          spinner: '#FFFFFF',
        };
      case 'primary':
      default:
        return {
          bg: colors.primary,
          text: colors.textInverse,
          border: 'transparent',
          spinner: colors.textInverse,
        };
    }
  };

  const v = getVariantStyle();
  const isInteractionDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInteractionDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderRadius: radius.md,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        isInteractionDisabled && styles.buttonDisabled,
        pressed && !isInteractionDisabled && { opacity: 0.88, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <Feather name={icon} size={iconSize.md} color={v.text} strokeWidth={iconStrokeWidth} />
          )}
          <Text style={[styles.buttonText, { color: v.text, fontSize: fontSize.md }, textStyle]}>
            {label}
          </Text>
          {iconRight && (
            <Feather name={iconRight} size={iconSize.md} color={v.text} strokeWidth={iconStrokeWidth} />
          )}
        </View>
      )}
    </Pressable>
  );
}

// ==========================================
// SECONDARY BUTTON (thin convenience wrapper over PrimaryButton's secondary variant)
// ==========================================
export function SecondaryButton(props: Omit<PrimaryButtonProps, 'variant'>) {
  return <PrimaryButton {...props} variant="secondary" />;
}

// ==========================================
// ICON BUTTON
// ==========================================
export interface IconButtonProps {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  tone?: 'neutral' | 'primary' | 'danger' | 'ghost' | 'surface' | 'success';
  size?: number;
  shape?: 'circle' | 'squircle';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  tone = 'neutral',
  size = 20,
  shape = 'squircle',
  disabled = false,
  style,
}: IconButtonProps) {
  const { colors, iconStrokeWidth, radius } = useTheme();

  const getToneStyle = () => {
    switch (tone) {
      case 'primary':
        return { bg: colors.primaryLight, fg: colors.primary, border: 'transparent' };
      case 'danger':
        return { bg: colors.dangerBg, fg: colors.danger, border: 'transparent' };
      case 'success':
        return { bg: colors.successBg, fg: colors.success, border: 'transparent' };
      case 'surface':
        return { bg: colors.surface, fg: colors.text, border: colors.border };
      case 'ghost':
        return { bg: 'transparent', fg: colors.text, border: 'transparent' };
      case 'neutral':
      default:
        return { bg: colors.background, fg: colors.text, border: colors.border };
    }
  };

  const t = getToneStyle();
  const borderRadius = shape === 'circle' ? 22 : radius.md;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: t.bg,
          borderColor: t.border,
          borderWidth: t.border !== 'transparent' ? 1 : 0,
          borderRadius,
        },
        disabled && { opacity: 0.45 },
        pressed && !disabled && { opacity: 0.75, transform: [{ scale: 0.94 }] },
        style,
      ]}
    >
      <Feather name={icon} size={size} color={t.fg} strokeWidth={iconStrokeWidth} />
    </Pressable>
  );
}

// ==========================================
// INPUT
// ==========================================
export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: keyof typeof Feather.glyphMap;
  /** Teks tetap di depan nilai, mis. "Rp" untuk kolom nominal rupiah. */
  prefix?: string;
  onClear?: () => void;
  clearable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  style?: StyleProp<TextStyle>;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  prefix,
  onClear,
  clearable = false,
  containerStyle,
  inputStyle,
  style,
  value,
  onChangeText,
  secureTextEntry,
  placeholder,
  editable = true,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const { colors, fontSize, iconSize, iconStrokeWidth, radius, spacing } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showPasswordToggle = secureTextEntry !== undefined;
  const isSecure = secureTextEntry && !isPasswordVisible;

  const getBorderColor = () => {
    if (error) return colors.danger;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label && (
        <Text style={[styles.inputLabel, { color: error ? colors.danger : colors.textMuted, fontSize: fontSize.xs }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: getBorderColor(),
            borderWidth: isFocused || error ? 1.5 : 1,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
          },
          !editable && { opacity: 0.6, backgroundColor: colors.background },
        ]}
      >
        {icon && (
          <Feather
            name={icon}
            size={iconSize.sm}
            color={error ? colors.danger : isFocused ? colors.primary : colors.textMuted}
            strokeWidth={iconStrokeWidth}
            style={styles.inputPrefixIcon}
          />
        )}

        {!!prefix && (
          <Text
            style={{
              color: error ? colors.danger : isFocused ? colors.primary : colors.textMuted,
              fontSize: fontSize.sm,
              fontWeight: '800',
              marginRight: 6,
            }}
          >
            {prefix}
          </Text>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isSecure}
          editable={editable}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.inputField,
            { color: colors.text, fontSize: fontSize.sm },
            inputStyle,
            style,
          ]}
          {...rest}
        />

        {clearable && !!value && editable && (
          <Pressable
            onPress={() => {
              onChangeText?.('');
              onClear?.();
            }}
            hitSlop={8}
            style={styles.inputActionIcon}
          >
            <Feather name="x-circle" size={16} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
          </Pressable>
        )}

        {showPasswordToggle && editable && (
          <Pressable
            onPress={() => setIsPasswordVisible((v) => !v)}
            hitSlop={8}
            style={styles.inputActionIcon}
          >
            <Feather
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={iconSize.sm}
              color={colors.textMuted}
              strokeWidth={iconStrokeWidth}
            />
          </Pressable>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={14} color={colors.danger} strokeWidth={iconStrokeWidth} />
          <Text style={[styles.errorText, { color: colors.danger, fontSize: fontSize.xs }]}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: colors.textMuted, fontSize: fontSize.xs }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

// ==========================================
// MODAL
// ==========================================
export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'bottomSheet' | 'floating';
  height?: number | string;
}

export function Modal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  variant = 'bottomSheet',
}: ModalProps) {
  const { colors, fontSize, radius, spacing } = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={variant === 'bottomSheet' ? 'slide' : 'fade'}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            variant === 'bottomSheet' ? styles.bottomSheetContainer : styles.floatingModalContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: variant === 'bottomSheet' ? 24 : radius.lg,
            },
          ]}
        >
          {variant === 'bottomSheet' && (
            <View style={styles.handleContainer}>
              <View style={[styles.handleBar, { backgroundColor: colors.borderStrong }]} />
            </View>
          )}

          {(title || subtitle) && (
            <View style={[styles.modalHeader, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
              <View style={{ flex: 1 }}>
                {title && (
                  <Text style={[styles.modalTitle, { color: colors.text, fontSize: fontSize.lg }]}>
                    {title}
                  </Text>
                )}
                {subtitle && (
                  <Text style={[styles.modalSubtitle, { color: colors.textMuted, fontSize: fontSize.xs }]}>
                    {subtitle}
                  </Text>
                )}
              </View>
              <IconButton icon="x" onPress={onClose} tone="neutral" size={18} shape="circle" />
            </View>
          )}

          <View style={[styles.modalBody, { padding: spacing.lg }]}>{children}</View>
        </View>
      </View>
    </RNModal>
  );
}

// ==========================================
// KPI CARD
// ==========================================
export interface KpiCardProps {
  label: string;
  value: string | number;
  tone?: string;
  icon?: keyof typeof Feather.glyphMap;
  trend?: { value: string; isPositive?: boolean };
  badge?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function KpiCard({
  label,
  value,
  tone,
  icon,
  trend,
  badge,
  style,
  onPress,
}: KpiCardProps) {
  const { colors, fontSize, iconStrokeWidth, spacing } = useTheme();

  const isLongValue = typeof value === 'string' && value.length > 7;

  return (
    <Card onPress={onPress} style={[styles.kpiCard, style]}>
      <View style={styles.kpiHeaderRow}>
        <Text style={[styles.kpiLabel, { color: colors.textMuted, fontSize: fontSize.xs }]} numberOfLines={1}>
          {label}
        </Text>

        {badge && (
          <Pill label={badge} tone="primary" />
        )}

        {icon && !badge && (
          <View style={[styles.kpiIconWrap, { backgroundColor: colors.primaryLight }]}>
            <Feather name={icon} size={13} color={colors.primary} strokeWidth={iconStrokeWidth} />
          </View>
        )}
      </View>

      <Text
        style={[
          styles.kpiValue,
          {
            color: tone || colors.text,
            fontSize: isLongValue ? 17 : 24,
            letterSpacing: -0.5,
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>

      {trend && (
        <View style={styles.trendRow}>
          <Feather
            name={trend.isPositive !== false ? 'trending-up' : 'trending-down'}
            size={12}
            color={trend.isPositive !== false ? colors.success : colors.danger}
            strokeWidth={iconStrokeWidth}
          />
          <Text
            style={[
              styles.trendText,
              {
                color: trend.isPositive !== false ? colors.success : colors.danger,
                fontSize: fontSize.xs,
              },
            ]}
          >
            {trend.value}
          </Text>
        </View>
      )}
    </Card>
  );
}

// ==========================================
// EMPTY STATE
// ==========================================
export interface EmptyStateProps {
  title: string;
  body: string;
  icon?: keyof typeof Feather.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  body,
  icon = 'inbox',
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { colors, fontSize, iconStrokeWidth, spacing } = useTheme();

  return (
    <View style={[styles.emptyState, style]}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryLight }]}>
        <Feather name={icon} size={24} color={colors.primary} strokeWidth={iconStrokeWidth} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text, fontSize: fontSize.md }]}>
        {title}
      </Text>
      <Text style={[styles.emptyBody, { color: colors.textMuted, fontSize: fontSize.sm }]}>
        {body}
      </Text>
      {actionLabel && onAction && (
        <View style={{ marginTop: spacing.sm }}>
          <PrimaryButton
            label={actionLabel}
            onPress={onAction}
            variant="secondary"
            fullWidth={false}
          />
        </View>
      )}
    </View>
  );
}

// ==========================================
// SKELETON
// ==========================================
export interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  height = 16,
  width = '100%',
  borderRadius,
  style,
}: SkeletonProps) {
  const { colors, radius } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          height: height as any,
          width: width as any,
          borderRadius: borderRadius ?? radius.sm,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ==========================================
// STEPPER (numeric +/- control — preferred over free typing per product spec)
// ==========================================
export interface StepperProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Stepper({ label, value, onChange, step = 1, min = 0, max, unit, disabled, style }: StepperProps) {
  const { colors, fontSize, radius, spacing } = useTheme();
  const [inputText, setInputText] = useState<string>(value.toString());

  React.useEffect(() => {
    setInputText(value.toString());
  }, [value]);

  const clamp = (v: number) => {
    let next = v;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return next;
  };

  const handleTextChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setInputText(cleaned);
    if (cleaned !== '') {
      const num = parseInt(cleaned, 10);
      if (!isNaN(num)) {
        onChange(clamp(num));
      }
    } else {
      onChange(min ?? 0);
    }
  };

  return (
    <View style={[{ gap: spacing.xs }, style]}>
      {label && <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>{label}</Text>}
      <View style={[styles.stepperRow, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface }]}>
        <IconButton
          icon="minus"
          onPress={() => onChange(clamp(value - step))}
          disabled={disabled || (min !== undefined && value <= min)}
          tone="neutral"
        />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <TextInput
            value={inputText}
            onChangeText={handleTextChange}
            keyboardType="number-pad"
            editable={!disabled}
            selectTextOnFocus
            style={[styles.stepperValue, { color: colors.text, fontSize: fontSize.lg, minWidth: 60, textAlign: 'center', paddingVertical: 4 }]}
          />
          {unit ? <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>{unit}</Text> : null}
        </View>
        <IconButton
          icon="plus"
          onPress={() => onChange(clamp(value + step))}
          disabled={disabled || (max !== undefined && value >= max)}
          tone="neutral"
        />
      </View>
    </View>
  );
}

// ==========================================
// SYNC STATUS BADGE — pending offline-queue indicator ("Tersimpan lokal —
// menunggu sinkron" vs "Terkirim") shown on Dashboard and Lainnya (MoreMenu).
// ==========================================
export interface SyncStatusBadgeProps {
  pendingCount: number;
  onSyncPress?: () => void;
  syncing?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SyncStatusBadge({ pendingCount, onSyncPress, syncing, style }: SyncStatusBadgeProps) {
  const { colors, fontSize, iconStrokeWidth, radius, spacing } = useTheme();
  const isPending = pendingCount > 0;

  // Kondisi normal (tidak ada antrean) bukan kabar penting — ditampilkan
  // sebagai baris status kecil, bukan banner hijau setinggi kartu. Banner penuh
  // disimpan untuk keadaan yang memang butuh tindakan: ada data tertunda.
  if (!isPending) {
    return (
      <View style={[styles.syncInline, style]}>
        <Feather name="check-circle" size={12} color={colors.success} strokeWidth={iconStrokeWidth} />
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>
          Semua data tersinkron dengan server
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.syncBanner,
        {
          backgroundColor: colors.warningBg,
          borderRadius: radius.md,
          padding: spacing.md,
        },
        style,
      ]}
    >
      <Feather name="upload-cloud" size={18} color={colors.warning} strokeWidth={iconStrokeWidth} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.syncBannerTitle, { color: colors.text, fontSize: fontSize.sm }]}>
          {pendingCount} data menunggu sinkron
        </Text>
        <Text style={[styles.syncBannerSub, { color: colors.textMuted, fontSize: fontSize.xs }]}>
          Tersimpan lokal di perangkat ini
        </Text>
      </View>
      {onSyncPress && (
        <PrimaryButton
          label={syncing ? 'Menyinkron...' : 'Sinkron'}
          onPress={onSyncPress}
          disabled={syncing}
          fullWidth={false}
          variant="secondary"
        />
      )}
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  sectionAccentBar: {
    width: 3.5,
    height: 16,
    borderRadius: 2,
  },
  sectionTitleText: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  dotContainer: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontWeight: '700',
  },
  button: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontWeight: '700',
  },
  iconButton: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    gap: 6,
    width: '100%',
  },
  inputLabel: {
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  inputPrefixIcon: {
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    paddingVertical: 12,
  },
  inputActionIcon: {
    marginLeft: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  errorText: {
    fontWeight: '500',
  },
  helperText: {
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '85%',
  },
  floatingModalContainer: {
    width: '90%',
    alignSelf: 'center',
    marginVertical: 'auto',
    maxHeight: '80%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: {
    fontWeight: '800',
  },
  modalSubtitle: {
    marginTop: 2,
  },
  modalBody: {
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    gap: 6,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontWeight: '600',
  },
  kpiValue: {
    fontWeight: '800',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontWeight: '700',
  },
  emptyBody: {
    textAlign: 'center',
  },
  skeleton: {
    overflow: 'hidden',
  },
  dropdownTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  dropdownModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownScrim: { flex: 1 },
  dropdownModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
    maxHeight: '75%',
  },
  dropdownHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
  },
  dropdownOptionText: {
    fontSize: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    padding: 6,
  },
  stepperValue: {
    fontWeight: '800',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  syncBannerTitle: {
    fontWeight: '700',
  },
  syncBannerSub: {
    marginTop: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Modern Bento & Gauge Styles
  bentoCardContainer: {
    overflow: 'hidden',
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoIconBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    width: '100%',
    marginTop: 4,
  },
  sparklineCol: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  sparklineBar: {
    width: '100%',
    borderRadius: 3,
  },
  gaugeContainer: {
    borderWidth: 1.5,
    gap: 12,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeShieldIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ringContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringFill: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
  },
  ringCenterText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeSubGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  gaugeSubItem: {
    alignItems: 'center',
    gap: 2,
  },
  timelineContainer: {
    gap: 0,
  },
  timelineStepRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 8,
  },
  timelineNodeCol: {
    alignItems: 'center',
    width: 32,
  },
  timelineNode: {
    width: 28,
    height: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  timelineCard: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    gap: 2,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetScrim: {
    flex: 1,
  },
  sheetContainer: {
    width: '100%',
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  carouselCard: {
    width: 280,
    padding: 14,
    gap: 8,
    marginRight: 10,
  },
  carouselInfoRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  carouselInfoCol: {
    flex: 1,
    gap: 1,
  },
});

// ==========================================
// DROPDOWN PICKER
// ==========================================
export interface DropdownPickerProps {
  label?: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onSelect: (val: string) => void;
  icon?: keyof typeof Feather.glyphMap;
  placeholder?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function DropdownPicker({
  label,
  value,
  options,
  onSelect,
  icon = 'map-pin',
  placeholder = 'Pilih...',
  disabled = false,
  style,
}: DropdownPickerProps) {
  const { colors, radius, spacing, fontSize, iconStrokeWidth } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={[{ gap: 4 }, style]}>
      {label ? (
        <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.text }}>
          {label}
        </Text>
      ) : null}

      <Pressable
        disabled={disabled}
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          styles.dropdownTriggerBtn,
          {
            backgroundColor: disabled ? colors.background : colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
          },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Feather name={icon} size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
        <Text
          style={{
            flex: 1,
            fontSize: fontSize.xs,
            fontWeight: '700',
            color: selectedOption ? colors.text : colors.textMuted,
          }}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
      </Pressable>

      <RNModal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.dropdownModalOverlay}>
          <Pressable style={styles.dropdownScrim} onPress={() => setModalVisible(false)} />
          <View style={[styles.dropdownModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={[styles.dropdownModalTitle, { color: colors.text }]}>Pilih {label || 'Opsi'}</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.textMuted} strokeWidth={iconStrokeWidth} />
              </Pressable>
            </View>

            {options.length > 6 && (
              <Input
                placeholder="Cari..."
                icon="search"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={() => setSearchQuery('')}
                containerStyle={{ marginBottom: spacing.xs }}
              />
            )}

            <ScrollView style={{ maxHeight: 340 }} keyboardShouldPersistTaps="handled">
              {filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      onSelect(opt.value);
                      setModalVisible(false);
                      setSearchQuery('');
                    }}
                    style={({ pressed }) => [
                      styles.dropdownOptionRow,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: colors.primaryLight },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '800' : '500' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Feather name="check" size={16} color={colors.primary} strokeWidth={iconStrokeWidth} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </RNModal>
    </View>
  );
}

// ==========================================
// 1. BENTO CARD (Modern Modular Bento Container)
// ==========================================
export interface BentoCardProps {
  title?: string;
  badge?: string;
  badgeTone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  icon?: keyof typeof Feather.glyphMap;
  iconColor?: string;
  value?: string | number;
  subtitle?: string;
  trend?: string;
  trendPositive?: boolean;
  sparklineData?: number[];
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'accent' | 'glass' | 'highlight';
}

export function BentoCard({
  title,
  badge,
  badgeTone = 'primary',
  icon,
  iconColor,
  value,
  subtitle,
  trend,
  trendPositive,
  sparklineData,
  children,
  style,
  onPress,
  variant = 'default',
}: BentoCardProps) {
  const { colors, isDark, radius, spacing, fontSize, iconStrokeWidth, shadow } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'accent':
        return {
          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FFFBEB',
          borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
        };
      case 'glass':
        return {
          backgroundColor: isDark ? 'rgba(11, 30, 56, 0.75)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)',
        };
      case 'highlight':
        return {
          backgroundColor: isDark ? 'rgba(13, 148, 136, 0.08)' : '#F0FDF4',
          borderColor: isDark ? 'rgba(13, 148, 136, 0.3)' : '#BBF7D0',
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        };
    }
  };

  const Content = (
    <View
      style={[
        styles.bentoCardContainer,
        {
          borderRadius: radius.xl,
          borderWidth: 1.2,
          padding: spacing.md,
          gap: spacing.sm,
          ...shadow.card,
        },
        getVariantStyles(),
        style,
      ]}
    >
      {(icon || badge) && (
        <View style={styles.bentoHeaderRow}>
          {icon ? (
            <View
              style={[
                styles.bentoIconBadge,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.primaryLight,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Feather
                name={icon}
                size={15}
                color={iconColor || (isDark ? colors.gold : colors.primary)}
                strokeWidth={iconStrokeWidth}
              />
            </View>
          ) : (
            <View />
          )}
          {badge && (
            <Pill
              label={badge}
              tone={badgeTone}
              style={{ paddingHorizontal: 7, paddingVertical: 2 }}
            />
          )}
        </View>
      )}

      {title && (
        <Text
          style={{
            fontSize: 10.5,
            fontWeight: '800',
            color: colors.textMuted,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
            marginTop: 1,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}

      {(value !== undefined || subtitle || trend) && (
        <View style={{ gap: 2 }}>
          {value !== undefined && (
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>
              {value}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {subtitle && (
              <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500' }}>
                {subtitle}
              </Text>
            )}
            {trend && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Feather
                  name={trendPositive ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={trendPositive ? colors.success : colors.danger}
                />
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: '800',
                    color: trendPositive ? colors.success : colors.danger,
                  }}
                >
                  {trend}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {sparklineData && sparklineData.length > 0 && (
        <Sparkline data={sparklineData} color={trendPositive === false ? colors.danger : colors.primary} />
      )}

      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] }]}>
        {Content}
      </Pressable>
    );
  }

  return Content;
}

// ==========================================
// 2. SPARKLINE (Compact 7-Bar Trend Visualization)
// ==========================================
export interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color, height = 24 }: SparklineProps) {
  const { colors } = useTheme();
  const barColor = color || colors.primary;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  return (
    <View style={[styles.sparklineContainer, { height }]}>
      {data.map((val, idx) => {
        const heightPct = Math.max(15, Math.round(((val - min) / range) * 100));
        return (
          <View key={idx} style={styles.sparklineCol}>
            <View
              style={[
                styles.sparklineBar,
                {
                  height: `${heightPct}%`,
                  backgroundColor: barColor,
                  opacity: idx === data.length - 1 ? 1 : 0.45 + (idx / data.length) * 0.45,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

// ==========================================
// 3. CIRCULAR PROGRESS GAUGE (Bento Multi-Metric)
// ==========================================
export interface CircularProgressGaugeProps {
  score: number;
  maxScore?: number;
  grade?: string;
  label?: string;
  subScores?: Array<{ label: string; score: number; max?: number; icon?: keyof typeof Feather.glyphMap }>;
  onPress?: () => void;
}

export function CircularProgressGauge({
  score,
  maxScore = 100,
  grade = 'Grade A+',
  label = 'Kesiapan & Kepatuhan Dapur',
  subScores = [],
  onPress,
}: CircularProgressGaugeProps) {
  const { colors, isDark, radius, spacing, fontSize } = useTheme();
  const pct = Math.min(100, Math.round((score / maxScore) * 100));

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.gaugeContainer,
        {
          backgroundColor: isDark ? 'rgba(11, 30, 56, 0.85)' : '#FFFFFF',
          borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
          borderRadius: radius.xl,
          padding: spacing.md,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.gaugeHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.gaugeShieldIcon, { backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7' }]}>
            <Feather name="shield" size={14} color="#D97706" />
          </View>
          <Text style={{ fontSize: 11, fontWeight: '900', color: colors.text, letterSpacing: 0.6 }}>
            SPPG KITCHEN READINESS INDEX
          </Text>
        </View>
        <Pill label={grade} tone="success" />
      </View>

      <View style={styles.gaugeCenterRow}>
        {/* Visual Progress Arc Ring Simulation */}
        <View style={[styles.ringContainer, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}>
          <View
            style={[
              styles.ringFill,
              {
                borderColor: pct >= 85 ? colors.success : pct >= 70 ? colors.warning : colors.danger,
                borderTopColor: 'transparent',
                borderLeftColor: 'transparent',
                transform: [{ rotate: `${(pct / 100) * 360}deg` }],
              },
            ]}
          />
          <View style={styles.ringCenterText}>
            <Text style={{ fontSize: 26, fontWeight: '900', color: colors.text }}>{score}</Text>
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: colors.textMuted }}>/ {maxScore}</Text>
          </View>
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>{label}</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, lineHeight: 16 }}>
            Terverifikasi IoT suhu, SOP masak 5 tahap, dan inspeksi HACCP aktif.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Feather name="check-circle" size={12} color={colors.success} />
            <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.success }}>
              {pct}% Target Kesiapan Optimal
            </Text>
          </View>
        </View>
      </View>

      {subScores.length > 0 && (
        <View style={[styles.gaugeSubGrid, { borderTopColor: colors.border }]}>
          {subScores.map((sub, idx) => (
            <View key={idx} style={styles.gaugeSubItem}>
              <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }} numberOfLines={1}>
                {sub.label}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '900',
                  color: sub.score >= 85 ? colors.success : colors.text,
                }}
              >
                {sub.score}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

// ==========================================
// 4. TACTICAL TIMELINE (5-Stage Visual Stepper)
// ==========================================
export interface TacticalTimelineStep {
  id: string;
  title: string;
  subtitle?: string;
  status: 'selesai' | 'proses' | 'menunggu';
  time?: string;
  icon: keyof typeof Feather.glyphMap;
}

export interface TacticalTimelineProps {
  steps: TacticalTimelineStep[];
  onStepPress?: (step: TacticalTimelineStep) => void;
}

export function TacticalTimeline({ steps, onStepPress }: TacticalTimelineProps) {
  const { colors, radius, spacing, fontSize, iconStrokeWidth, isDark } = useTheme();

  return (
    <View style={styles.timelineContainer}>
      {steps.map((step, idx) => {
        const isCompleted = step.status === 'selesai';
        const isCurrent = step.status === 'proses';
        const isLast = idx === steps.length - 1;

        return (
          <Pressable
            key={step.id}
            disabled={!onStepPress}
            onPress={() => onStepPress && onStepPress(step)}
            style={styles.timelineStepRow}
          >
            {/* Left Node & Line */}
            <View style={styles.timelineNodeCol}>
              <View
                style={[
                  styles.timelineNode,
                  {
                    backgroundColor: isCompleted ? colors.success : isCurrent ? colors.primary : colors.background,
                    borderColor: isCompleted ? colors.success : isCurrent ? colors.primary : colors.border,
                    borderRadius: 16,
                  },
                ]}
              >
                <Feather
                  name={isCompleted ? 'check' : step.icon}
                  size={13}
                  color={isCompleted || isCurrent ? '#FFFFFF' : colors.textMuted}
                  strokeWidth={iconStrokeWidth}
                />
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.timelineLine,
                    {
                      backgroundColor: isCompleted ? colors.success : colors.border,
                    },
                  ]}
                />
              )}
            </View>

            {/* Right Details Card */}
            <View
              style={[
                styles.timelineCard,
                {
                  backgroundColor: isCurrent
                    ? isDark
                      ? 'rgba(11, 34, 64, 0.6)'
                      : colors.primaryLight
                    : colors.surface,
                  borderColor: isCurrent ? colors.primary : colors.border,
                  borderRadius: radius.md,
                },
              ]}
            >
              <View style={styles.rowBetween}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text, flex: 1 }}>
                  {step.title}
                </Text>
                {step.time && (
                  <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '700' }}>
                    {step.time}
                  </Text>
                )}
              </View>
              {step.subtitle && (
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                  {step.subtitle}
                </Text>
              )}
              <View style={{ marginTop: 4 }}>
                <Pill
                  label={isCompleted ? 'Selesai' : isCurrent ? 'Sedang Berlangsung' : 'Menunggu Jadwal'}
                  tone={isCompleted ? 'success' : isCurrent ? 'primary' : 'info'}
                />
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ==========================================
// 5. BOTTOM SHEET MODAL (Modern Tactical Sheet)
// ==========================================
export interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: number;
}

export function BottomSheetModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 560,
}: BottomSheetModalProps) {
  const { colors, radius, spacing, fontSize, iconStrokeWidth } = useTheme();

  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={styles.sheetScrim} onPress={onClose} />
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              maxHeight,
            },
          ]}
        >
          <View style={styles.sheetHandleWrap}>
            <View style={[styles.sheetHandleBar, { backgroundColor: colors.border }]} />
          </View>

          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '900', color: colors.text }}>
                {title}
              </Text>
              {subtitle && (
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{subtitle}</Text>
              )}
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.sheetCloseBtn}>
              <Feather name="x" size={20} color={colors.text} strokeWidth={iconStrokeWidth} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
}

// ==========================================
// 6. SCHOOL CAROUSEL CARD (Horizontal Map Slider)
// ==========================================
export interface SchoolCarouselCardProps {
  nama: string;
  alamat?: string;
  siswaCount: number;
  targetPorsi: number;
  status: 'persiapan' | 'menunggu' | 'dalam_perjalanan' | 'tiba' | 'kendala';
  eta?: string;
  suhuKedatangan?: number;
  onPress?: () => void;
  isSelected?: boolean;
}

export function SchoolCarouselCard({
  nama,
  alamat,
  siswaCount,
  targetPorsi,
  status,
  eta = '10:45 WIB',
  suhuKedatangan = 64.5,
  onPress,
  isSelected,
}: SchoolCarouselCardProps) {
  const { colors, radius, spacing, fontSize, iconStrokeWidth, isDark } = useTheme();

  const getStatusTone = () => {
    switch (status) {
      case 'tiba':
        return 'success';
      case 'dalam_perjalanan':
        return 'primary';
      case 'kendala':
        return 'danger';
      default:
        return 'warning';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'tiba':
        return 'Tiba di Sekolah';
      case 'dalam_perjalanan':
        return 'Armada Menuju Lokasi';
      case 'kendala':
        return 'Kendala Rute';
      case 'menunggu':
      case 'persiapan':
      default:
        return 'Menunggu Jadwal';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.carouselCard,
        {
          backgroundColor: isSelected
            ? isDark
              ? 'rgba(11, 34, 64, 0.95)'
              : '#EFF6FF'
            : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
          borderRadius: radius.xl,
          borderWidth: isSelected ? 2 : 1,
        },
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '900', color: colors.text }} numberOfLines={1}>
            {nama}
          </Text>
          {alamat && (
            <Text style={{ fontSize: 10, color: colors.textMuted }} numberOfLines={1}>
              {alamat}
            </Text>
          )}
        </View>
        <Pill label={getStatusLabel()} tone={getStatusTone() as any} />
      </View>

      <View style={[styles.carouselInfoRow, { backgroundColor: colors.background, borderRadius: radius.md }]}>
        <View style={styles.carouselInfoCol}>
          <Text style={{ fontSize: 9.5, color: colors.textMuted, fontWeight: '600' }}>Alokasi Porsi</Text>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.text }}>
            {targetPorsi} porsi ({siswaCount} anak)
          </Text>
        </View>
        <View style={styles.carouselInfoCol}>
          <Text style={{ fontSize: 9.5, color: colors.textMuted, fontWeight: '600' }}>Estimasi Tiba</Text>
          <Text style={{ fontSize: fontSize.xs, fontWeight: '800', color: colors.primary }}>
            {eta}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Feather name="thermometer" size={12} color={colors.success} strokeWidth={iconStrokeWidth} />
          <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.success }}>
            Suhu Box: {suhuKedatangan}°C
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text style={{ fontSize: 10.5, fontWeight: '800', color: colors.primary }}>Lacak Detail</Text>
          <Feather name="chevron-right" size={12} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

export function RpIcon({
  size = 20,
  color,
  bgColor,
  style,
}: {
  size?: number;
  color?: string;
  bgColor?: string;
  style?: any;
}) {
  const { colors, isDark } = useTheme();
  const textColor = color || (isDark ? colors.gold : colors.primary);
  const background = bgColor || (isDark ? 'rgba(255,255,255,0.08)' : colors.primaryLight);
  const fontSize = Math.max(9, Math.round(size * 0.55));
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{ fontSize, fontWeight: '900', color: textColor, letterSpacing: -0.5 }}>
        Rp
      </Text>
    </View>
  );
}
