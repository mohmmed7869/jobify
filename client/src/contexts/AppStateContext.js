/**
 * Enhanced App State Management Context
 * نظام إدارة الحالة المتقدم للتطبيق
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

// Action Types
const ActionTypes = {
  // Loading states
  SET_LOADING: 'SET_LOADING',
  SET_GLOBAL_LOADING: 'SET_GLOBAL_LOADING',
  
  // User data
  SET_USER_DATA: 'SET_USER_DATA',
  UPDATE_USER_PROFILE: 'UPDATE_USER_PROFILE',
  SET_USER_PREFERENCES: 'SET_USER_PREFERENCES',
  
  // Jobs
  SET_JOBS: 'SET_JOBS',
  ADD_JOB: 'ADD_JOB',
  UPDATE_JOB: 'UPDATE_JOB',
  REMOVE_JOB: 'REMOVE_JOB',
  SET_JOB_FILTERS: 'SET_JOB_FILTERS',
  SET_FEATURED_JOBS: 'SET_FEATURED_JOBS',
  
  // Applications
  SET_APPLICATIONS: 'SET_APPLICATIONS',
  ADD_APPLICATION: 'ADD_APPLICATION',
  UPDATE_APPLICATION: 'UPDATE_APPLICATION',
  REMOVE_APPLICATION: 'REMOVE_APPLICATION',
  
  // Notifications
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  CLEAR_ALL_NOTIFICATIONS: 'CLEAR_ALL_NOTIFICATIONS',
  
  // Real-time data
  UPDATE_ONLINE_USERS: 'UPDATE_ONLINE_USERS',
  UPDATE_CHAT_MESSAGES: 'UPDATE_CHAT_MESSAGES',
  
  // Cache
  SET_CACHE_DATA: 'SET_CACHE_DATA',
  CLEAR_CACHE: 'CLEAR_CACHE',
  
  // Theme and UI
  SET_THEME: 'SET_THEME',
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_UI_CONFIG: 'SET_UI_CONFIG',
  
  // Analytics
  TRACK_EVENT: 'TRACK_EVENT',
  UPDATE_ANALYTICS: 'UPDATE_ANALYTICS',
  
  // Errors
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Performance
  UPDATE_PERFORMANCE_METRICS: 'UPDATE_PERFORMANCE_METRICS'
};

// Initial State
const initialState = {
  // Loading states
  loading: {
    global: false,
    components: {}
  },
  
  // User data
  user: {
    data: null,
    profile: null,
    preferences: {
      theme: 'light',
      language: 'ar',
      notifications: {
        email: true,
        push: true,
        inApp: true
      },
      jobAlerts: true,
      profileVisibility: 'public'
    }
  },
  
  // Jobs data
  jobs: {
    items: [],
    featured: [],
    filters: {
      category: '',
      location: '',
      salaryRange: [0, 100000],
      experienceLevel: '',
      jobType: '',
      remote: false,
      keywords: ''
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    },
    sortBy: 'date',
    sortOrder: 'desc'
  },
  
  // Applications data
  applications: {
    items: [],
    stats: {
      total: 0,
      pending: 0,
      interview: 0,
      accepted: 0,
      rejected: 0
    }
  },
  
  // Notifications
  notifications: {
    items: [],
    unreadCount: 0
  },
  
  // Real-time data
  realTime: {
    onlineUsers: [],
    chatMessages: {},
    connectionStatus: 'disconnected'
  },
  
  // Cache
  cache: {
    data: {},
    timestamps: {}
  },
  
  // UI State
  ui: {
    theme: 'light',
    language: 'ar',
    sidebarOpen: false,
    mobileMenuOpen: false,
    modalStack: [],
    toasts: []
  },
  
  // Analytics
  analytics: {
    events: [],
    pageViews: [],
    userJourney: [],
    performance: {
      loadTime: 0,
      renderTime: 0,
      apiCalls: []
    }
  },
  
  // Errors
  errors: {
    global: null,
    components: {}
  }
};

// Reducer
function appStateReducer(state, action) {
  switch (action.type) {
    // Loading states
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          components: {
            ...state.loading.components,
            [action.payload.component]: action.payload.isLoading
          }
        }
      };
    
    case ActionTypes.SET_GLOBAL_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          global: action.payload
        }
      };
    
    // User data
    case ActionTypes.SET_USER_DATA:
      return {
        ...state,
        user: {
          ...state.user,
          data: action.payload
        }
      };
    
    case ActionTypes.UPDATE_USER_PROFILE:
      return {
        ...state,
        user: {
          ...state.user,
          profile: {
            ...state.user.profile,
            ...action.payload
          }
        }
      };
    
    case ActionTypes.SET_USER_PREFERENCES:
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            ...action.payload
          }
        }
      };
    
    // Jobs
    case ActionTypes.SET_JOBS:
      return {
        ...state,
        jobs: {
          ...state.jobs,
          items: action.payload.jobs,
          pagination: {
            ...state.jobs.pagination,
            ...action.payload.pagination
          }
        }
      };
    
    case ActionTypes.ADD_JOB:
      return {
        ...state,
        jobs: {
          ...state.jobs,
          items: [action.payload, ...state.jobs.items]
        }
      };
    
    case ActionTypes.UPDATE_JOB:
      return {
        ...state,
        jobs: {
          ...state.jobs,
          items: state.jobs.items.map(job =>
            job.id === action.payload.id ? { ...job, ...action.payload } : job
          )
        }
      };
    
    case ActionTypes.REMOVE_JOB:
      return {
        ...state,
        jobs: {
          ...state.jobs,
          items: state.jobs.items.filter(job => job.id !== action.payload)
        }
      };
    
    case ActionTypes.SET_JOB_FILTERS:
      return {
        ...state,
        jobs: {
          ...state.jobs,
          filters: {
            ...state.jobs.filters,
            ...action.payload
          }
        }
      };
    
    case ActionTypes.SET_FEATURED_JOBS:
      return {
        ...state,
        jobs: {
          ...state.jobs,
          featured: action.payload
        }
      };
    
    // Applications
    case ActionTypes.SET_APPLICATIONS:
      return {
        ...state,
        applications: {
          ...state.applications,
          items: action.payload.applications,
          stats: action.payload.stats
        }
      };
    
    case ActionTypes.ADD_APPLICATION:
      return {
        ...state,
        applications: {
          ...state.applications,
          items: [action.payload, ...state.applications.items],
          stats: {
            ...state.applications.stats,
            total: state.applications.stats.total + 1,
            pending: state.applications.stats.pending + 1
          }
        }
      };
    
    case ActionTypes.UPDATE_APPLICATION:
      return {
        ...state,
        applications: {
          ...state.applications,
          items: state.applications.items.map(app =>
            app.id === action.payload.id ? { ...app, ...action.payload } : app
          )
        }
      };
    
    // Notifications
    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: {
          items: [action.payload, ...state.notifications.items],
          unreadCount: state.notifications.unreadCount + (action.payload.read ? 0 : 1)
        }
      };
    
    case ActionTypes.REMOVE_NOTIFICATION:
      const removedNotification = state.notifications.items.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: {
          items: state.notifications.items.filter(n => n.id !== action.payload),
          unreadCount: state.notifications.unreadCount - (removedNotification?.read ? 0 : 1)
        }
      };
    
    case ActionTypes.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: {
          items: state.notifications.items.map(n =>
            n.id === action.payload ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.notifications.unreadCount - 1)
        }
      };
    
    case ActionTypes.CLEAR_ALL_NOTIFICATIONS:
      return {
        ...state,
        notifications: {
          items: [],
          unreadCount: 0
        }
      };
    
    // Real-time data
    case ActionTypes.UPDATE_ONLINE_USERS:
      return {
        ...state,
        realTime: {
          ...state.realTime,
          onlineUsers: action.payload
        }
      };
    
    case ActionTypes.UPDATE_CHAT_MESSAGES:
      return {
        ...state,
        realTime: {
          ...state.realTime,
          chatMessages: {
            ...state.realTime.chatMessages,
            [action.payload.roomId]: action.payload.messages
          }
        }
      };
    
    // Cache
    case ActionTypes.SET_CACHE_DATA:
      return {
        ...state,
        cache: {
          data: {
            ...state.cache.data,
            [action.payload.key]: action.payload.data
          },
          timestamps: {
            ...state.cache.timestamps,
            [action.payload.key]: Date.now()
          }
        }
      };
    
    case ActionTypes.CLEAR_CACHE:
      if (action.payload) {
        const newData = { ...state.cache.data };
        const newTimestamps = { ...state.cache.timestamps };
        delete newData[action.payload];
        delete newTimestamps[action.payload];
        return {
          ...state,
          cache: {
            data: newData,
            timestamps: newTimestamps
          }
        };
      }
      return {
        ...state,
        cache: {
          data: {},
          timestamps: {}
        }
      };
    
    // Theme and UI
    case ActionTypes.SET_THEME:
      return {
        ...state,
        ui: {
          ...state.ui,
          theme: action.payload
        },
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            theme: action.payload
          }
        }
      };
    
    case ActionTypes.SET_LANGUAGE:
      return {
        ...state,
        ui: {
          ...state.ui,
          language: action.payload
        },
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            language: action.payload
          }
        }
      };
    
    case ActionTypes.SET_UI_CONFIG:
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload
        }
      };
    
    // Analytics
    case ActionTypes.TRACK_EVENT:
      return {
        ...state,
        analytics: {
          ...state.analytics,
          events: [
            ...state.analytics.events,
            {
              ...action.payload,
              timestamp: Date.now()
            }
          ].slice(-1000) // Keep only last 1000 events
        }
      };
    
    case ActionTypes.UPDATE_ANALYTICS:
      return {
        ...state,
        analytics: {
          ...state.analytics,
          ...action.payload
        }
      };
    
    // Performance
    case ActionTypes.UPDATE_PERFORMANCE_METRICS:
      return {
        ...state,
        analytics: {
          ...state.analytics,
          performance: {
            ...state.analytics.performance,
            ...action.payload
          }
        }
      };
    
    // Errors
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error
        }
      };
    
    case ActionTypes.CLEAR_ERROR:
      const newErrors = { ...state.errors };
      delete newErrors[action.payload];
      return {
        ...state,
        errors: newErrors
      };
    
    default:
      return state;
  }
}

// Context
const AppStateContext = createContext();

// Provider Component
export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('appState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.user.preferences) {
          dispatch({ type: ActionTypes.SET_USER_PREFERENCES, payload: parsed.user.preferences });
        }
        if (parsed.ui.theme) {
          dispatch({ type: ActionTypes.SET_THEME, payload: parsed.ui.theme });
        }
        if (parsed.ui.language) {
          dispatch({ type: ActionTypes.SET_LANGUAGE, payload: parsed.ui.language });
        }
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  // Save state changes to localStorage
  useEffect(() => {
    const stateToSave = {
      user: {
        preferences: state.user.preferences
      },
      ui: {
        theme: state.ui.theme,
        language: state.ui.language
      }
    };
    
    localStorage.setItem('appState', JSON.stringify(stateToSave));
  }, [state.user.preferences, state.ui.theme, state.ui.language]);

  // Memoized actions
  const actions = useMemo(() => ({
    // Loading actions
    setLoading: (component, isLoading) => {
      dispatch({
        type: ActionTypes.SET_LOADING,
        payload: { component, isLoading }
      });
    },
    
    setGlobalLoading: (isLoading) => {
      dispatch({
        type: ActionTypes.SET_GLOBAL_LOADING,
        payload: isLoading
      });
    },
    
    // User actions
    setUserData: (userData) => {
      dispatch({ type: ActionTypes.SET_USER_DATA, payload: userData });
    },
    
    updateUserProfile: (profileData) => {
      dispatch({ type: ActionTypes.UPDATE_USER_PROFILE, payload: profileData });
    },
    
    setUserPreferences: (preferences) => {
      dispatch({ type: ActionTypes.SET_USER_PREFERENCES, payload: preferences });
    },
    
    // Job actions
    setJobs: (jobs, pagination) => {
      dispatch({
        type: ActionTypes.SET_JOBS,
        payload: { jobs, pagination }
      });
    },
    
    addJob: (job) => {
      dispatch({ type: ActionTypes.ADD_JOB, payload: job });
    },
    
    updateJob: (job) => {
      dispatch({ type: ActionTypes.UPDATE_JOB, payload: job });
    },
    
    removeJob: (jobId) => {
      dispatch({ type: ActionTypes.REMOVE_JOB, payload: jobId });
    },
    
    setJobFilters: (filters) => {
      dispatch({ type: ActionTypes.SET_JOB_FILTERS, payload: filters });
    },
    
    setFeaturedJobs: (jobs) => {
      dispatch({ type: ActionTypes.SET_FEATURED_JOBS, payload: jobs });
    },
    
    // Application actions
    setApplications: (applications, stats) => {
      dispatch({
        type: ActionTypes.SET_APPLICATIONS,
        payload: { applications, stats }
      });
    },
    
    addApplication: (application) => {
      dispatch({ type: ActionTypes.ADD_APPLICATION, payload: application });
      toast.success('تم تقديم الطلب بنجاح!');
    },
    
    updateApplication: (application) => {
      dispatch({ type: ActionTypes.UPDATE_APPLICATION, payload: application });
    },
    
    // Notification actions
    addNotification: (notification) => {
      const notificationWithId = {
        ...notification,
        id: Date.now() + Math.random(),
        timestamp: new Date(),
        read: false
      };
      dispatch({ type: ActionTypes.ADD_NOTIFICATION, payload: notificationWithId });
      
      // Show toast for important notifications
      if (notification.type === 'important') {
        toast.success(notification.title);
      }
    },
    
    removeNotification: (notificationId) => {
      dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, payload: notificationId });
    },
    
    markNotificationRead: (notificationId) => {
      dispatch({ type: ActionTypes.MARK_NOTIFICATION_READ, payload: notificationId });
    },
    
    clearAllNotifications: () => {
      dispatch({ type: ActionTypes.CLEAR_ALL_NOTIFICATIONS });
    },
    
    // Real-time actions
    updateOnlineUsers: (users) => {
      dispatch({ type: ActionTypes.UPDATE_ONLINE_USERS, payload: users });
    },
    
    updateChatMessages: (roomId, messages) => {
      dispatch({
        type: ActionTypes.UPDATE_CHAT_MESSAGES,
        payload: { roomId, messages }
      });
    },
    
    // Cache actions
    setCacheData: (key, data, ttl = 300000) => { // Default 5 minutes TTL
      dispatch({
        type: ActionTypes.SET_CACHE_DATA,
        payload: { key, data, ttl }
      });
    },
    
    getCacheData: (key) => {
      const cached = state.cache.data[key];
      const timestamp = state.cache.timestamps[key];
      
      if (!cached || !timestamp) return null;
      
      // Check if cache has expired
      const ttl = 300000; // 5 minutes default
      if (Date.now() - timestamp > ttl) {
        actions.clearCache(key);
        return null;
      }
      
      return cached;
    },
    
    clearCache: (key) => {
      dispatch({ type: ActionTypes.CLEAR_CACHE, payload: key });
    },
    
    // Theme actions
    setTheme: (theme) => {
      dispatch({ type: ActionTypes.SET_THEME, payload: theme });
      // Apply theme to document
      document.documentElement.classList.toggle('dark', theme === 'dark');
    },
    
    setLanguage: (language) => {
      dispatch({ type: ActionTypes.SET_LANGUAGE, payload: language });
      // Apply language direction to document
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    },
    
    setUIConfig: (config) => {
      dispatch({ type: ActionTypes.SET_UI_CONFIG, payload: config });
    },
    
    // Analytics actions
    trackEvent: (eventName, properties = {}) => {
      dispatch({
        type: ActionTypes.TRACK_EVENT,
        payload: { eventName, properties }
      });
      
      // Send to analytics service (implement as needed)
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, properties);
      }
    },
    
    updatePerformanceMetrics: (metrics) => {
      dispatch({ type: ActionTypes.UPDATE_PERFORMANCE_METRICS, payload: metrics });
    },
    
    // Error actions
    setError: (key, error) => {
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: { key, error }
      });
      
      // Show error toast
      if (error.message) {
        toast.error(error.message);
      }
    },
    
    clearError: (key) => {
      dispatch({ type: ActionTypes.CLEAR_ERROR, payload: key });
    }
  }), [state.cache]);

  // Memoized selectors
  const selectors = useMemo(() => ({
    // Loading selectors
    isLoading: (component) => state.loading.components[component] || false,
    isGlobalLoading: () => state.loading.global,
    
    // User selectors
    getCurrentUser: () => state.user.data,
    getUserProfile: () => state.user.profile,
    getUserPreferences: () => state.user.preferences,
    
    // Job selectors
    getJobs: () => state.jobs.items,
    getFeaturedJobs: () => state.jobs.featured,
    getJobFilters: () => state.jobs.filters,
    getJobById: (id) => state.jobs.items.find(job => job.id === id),
    
    // Application selectors
    getApplications: () => state.applications.items,
    getApplicationStats: () => state.applications.stats,
    getApplicationById: (id) => state.applications.items.find(app => app.id === id),
    
    // Notification selectors
    getNotifications: () => state.notifications.items,
    getUnreadNotificationCount: () => state.notifications.unreadCount,
    
    // Real-time selectors
    getOnlineUsers: () => state.realTime.onlineUsers,
    getChatMessages: (roomId) => state.realTime.chatMessages[roomId] || [],
    
    // UI selectors
    getCurrentTheme: () => state.ui.theme,
    getCurrentLanguage: () => state.ui.language,
    getUIConfig: () => state.ui,
    
    // Analytics selectors
    getAnalytics: () => state.analytics,
    getPerformanceMetrics: () => state.analytics.performance,
    
    // Error selectors
    getError: (key) => state.errors[key],
    hasErrors: () => Object.keys(state.errors).length > 0
  }), [state]);

  const value = {
    state,
    actions,
    selectors
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// Custom hook to use the app state
export const useAppState = () => {
  const context = useContext(AppStateContext);
  
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  
  return context;
};

// Custom hooks for specific features
export const useJobs = () => {
  const { state, actions, selectors } = useAppState();
  
  return {
    jobs: selectors.getJobs(),
    featuredJobs: selectors.getFeaturedJobs(),
    filters: selectors.getJobFilters(),
    pagination: state.jobs.pagination,
    setJobs: actions.setJobs,
    addJob: actions.addJob,
    updateJob: actions.updateJob,
    removeJob: actions.removeJob,
    setFilters: actions.setJobFilters,
    getJobById: selectors.getJobById
  };
};

export const useNotifications = () => {
  const { actions, selectors } = useAppState();
  
  return {
    notifications: selectors.getNotifications(),
    unreadCount: selectors.getUnreadNotificationCount(),
    addNotification: actions.addNotification,
    removeNotification: actions.removeNotification,
    markAsRead: actions.markNotificationRead,
    clearAll: actions.clearAllNotifications
  };
};

export const useTheme = () => {
  const { actions, selectors } = useAppState();
  
  return {
    theme: selectors.getCurrentTheme(),
    setTheme: actions.setTheme,
    isDark: selectors.getCurrentTheme() === 'dark'
  };
};

export const useAnalytics = () => {
  const { actions, selectors } = useAppState();
  
  return {
    trackEvent: actions.trackEvent,
    analytics: selectors.getAnalytics(),
    performanceMetrics: selectors.getPerformanceMetrics(),
    updatePerformanceMetrics: actions.updatePerformanceMetrics
  };
};

export default AppStateContext;