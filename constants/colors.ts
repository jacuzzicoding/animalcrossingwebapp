// Animal Crossing GCN – warm, earthy, cozy palette

export const Colors = {
  // Core brand
  green:       '#5C9E4A',
  greenLight:  '#7BBF68',
  greenDark:   '#3D7033',

  // Backgrounds
  background:  '#F5EDD5',
  surface:     '#FFFEF5',
  card:        '#FFFFFF',

  // Browns / earth
  brown:       '#8B6914',
  brownDark:   '#2C1810',
  brownMid:    '#6B5B45',
  brownLight:  '#C4A96A',
  cream:       '#E8D5A0',

  // Accent
  blue:        '#4A7EA5',
  blueLight:   '#D6E8F5',
  purple:      '#9E4A7A',
  purpleLight: '#F5D6E8',
  orange:      '#C4945A',
  orangeLight: '#F5E0C8',
  bugGreen:    '#7A9E4A',
  bugLight:    '#E0EDD6',

  // Status
  donated:     '#4CAF50',
  donatedBg:   '#E8F5E9',
  undone:      '#BDBDBD',
  undoneBg:    '#F5F5F5',
  error:       '#E53935',
  errorBg:     '#FFEBEE',

  // Text
  textPrimary:   '#2C1810',
  textSecondary: '#6B5B45',
  textMuted:     '#9E8E7A',
  textOnGreen:   '#FFFFFF',

  // UI
  border:      '#D5C9A8',
  borderLight: '#EDE5C8',
  shadow:      'rgba(44, 24, 16, 0.08)',
  overlay:     'rgba(44, 24, 16, 0.4)',
  tabBar:      '#FFFEF5',
  tabBarBorder:'#D5C9A8',
} as const;

// Category accent colours
export const CategoryColors: Record<string, { bg: string; text: string; light: string }> = {
  fish:    { bg: Colors.blue,    text: '#FFFFFF', light: Colors.blueLight },
  bugs:    { bg: Colors.bugGreen,text: '#FFFFFF', light: Colors.bugLight  },
  fossils: { bg: Colors.orange,  text: '#FFFFFF', light: Colors.orangeLight },
  art:     { bg: Colors.purple,  text: '#FFFFFF', light: Colors.purpleLight },
};
