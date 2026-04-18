export const THEME_MODES = {
  VIBRANT_BLUE: 'light',
  SMART_PLATINUM: 'theme-smart-platinum',
  DIGITAL_LUXURY: 'theme-digital-luxury',
  CYBER_EMERALD: 'theme-cyber-emerald',
  CARBON_STEEL: 'theme-carbon-steel',
  FRESH_FOREST: 'theme-fresh-forest',
};

export const THEME_DETAILS = {
  light: {
    name: 'الأزرق الحيوي (الأساسي)',
    colors: ['#3b82f6', '#00d1ff'],
    class: 'light'
  },
  'theme-smart-platinum': {
    name: 'البلاتين الذكي',
    colors: ['#0ea5e9', '#2563eb'],
    class: 'theme-smart-platinum'
  },
  'theme-digital-luxury': {
    name: 'الفخامة الرقمية الهادئة',
    colors: ['#818cf8', '#c084fc'],
    class: 'theme-digital-luxury'
  },
  'theme-cyber-emerald': {
    name: 'الزمرد السيبراني',
    colors: ['#10b981', '#3b82f6'],
    class: 'theme-cyber-emerald'
  },
  'theme-carbon-steel': {
    name: 'الفولاذ الكربوني',
    colors: ['#6366f1', '#00f2fe'],
    class: 'theme-carbon-steel'
  },
  'theme-fresh-forest': {
    name: 'الغابة النضرة',
    colors: ['#10b981', '#a3e635'],
    class: 'theme-fresh-forest'
  },
};

export const applyTheme = (themeName) => {
  const body = document.body;
  Object.values(THEME_MODES).forEach((mode) => {
    body.classList.remove(mode);
  });
  if (themeName !== THEME_MODES.VIBRANT_BLUE) {
    body.classList.add(themeName);
  }
  localStorage.setItem('selectedTheme', themeName);
};

export const getAppliedTheme = () => {
  return localStorage.getItem('selectedTheme') || THEME_MODES.VIBRANT_BLUE;
};

export const initializeTheme = () => {
  const savedTheme = getAppliedTheme();
  applyTheme(savedTheme);
};

export const CSS_CLASSES = {
  BUTTONS: {
    PRIMARY: 'btn-formal-primary',
    SECONDARY: 'btn-formal-secondary',
    OUTLINE: 'btn-formal-outline',
    DANGER: 'btn-formal-danger',
    SUCCESS: 'btn-formal-success',
  },
  CARDS: {
    FORMAL: 'formal-card',
    FORMAL_ALT: 'formal-card-alt',
    TECH: 'tech-card',
  },
  INPUTS: {
    INPUT: 'formal-input',
    SELECT: 'formal-select',
    TEXTAREA: 'formal-textarea',
    LABEL: 'formal-label',
  },
  BADGES: {
    PRIMARY: 'badge-primary',
    SECONDARY: 'badge-secondary',
    SUCCESS: 'badge-success',
    WARNING: 'badge-warning',
    ERROR: 'badge-error',
  },
  ALERTS: {
    SUCCESS: 'alert-success',
    WARNING: 'alert-warning',
    ERROR: 'alert-error',
    INFO: 'alert-info',
  },
  LAYOUTS: {
    CONTAINER: 'formal-container',
    GRID_2: 'formal-grid-2',
    GRID_3: 'formal-grid-3',
  },
  ANIMATIONS: {
    FADE_IN: 'animate-fade-in',
    SLIDE_UP: 'animate-slide-up',
  },
};
