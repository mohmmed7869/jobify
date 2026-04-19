import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      // توحيد المعرفات (ضمان وجود id و _id)
      const user = action.payload;
      if (user && !user.id && user._id) user.id = user._id;
      if (user && !user._id && user.id) user._id = user.id;
      return { ...state, user: user, loading: false, error: null };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, token: null, loading: false, error: null };
    default:
      return state;
  }
};

// إزالة baseURL الصريح والاعتماد على proxy الموجود في package.json
// axios.defaults.baseURL = 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // إعداد axios interceptor
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (state.token) {
          config.headers['Authorization'] = `Bearer ${state.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          dispatch({ type: 'LOGOUT' });
        }
        return Promise.reject(error);
      }
    );

    if (state.token) {
      localStorage.setItem('token', state.token);
    } else {
      localStorage.removeItem('token');
    }

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [state.token]);

  // تحميل المستخدم عند بدء التطبيق
  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          const response = await axios.get('/api/auth/me');
          dispatch({ type: 'SET_USER', payload: response.data.data });
        } catch (error) {
          console.error('خطأ في تحميل المستخدم:', error);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadUser();
  }, [state.token]);

  const login = async (email, password) => {
    try {
      console.log(`Attempting login for ${email} at ${axios.defaults.baseURL || ''}/api/auth/login`);
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.post('/api/auth/login', { email, password });
      
      console.log('Login response:', response.data);
      dispatch({ type: 'SET_TOKEN', payload: response.data.token });
      dispatch({ type: 'SET_USER', payload: response.data.data });
      
      return { success: true };
    } catch (error) {
      console.error('Detailed login error:', error);
      if (error.response?.data?.requiresOtp) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, requiresOtp: true, email: error.response.data.email, message: error.response.data.message };
      }
      const message = error.response?.data?.message || 'خطأ في تسجيل الدخول';
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.post('/api/auth/register', userData);
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
      if (response.data.requiresOtp) {
        return { success: true, requiresOtp: true, email: response.data.email, message: response.data.message };
      }

      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'خطأ في التسجيل';
      dispatch({ type: 'SET_ERROR', payload: message });
      return { success: false, message };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await axios.post('/api/auth/verify-otp', { email, otp });
      
      dispatch({ type: 'SET_TOKEN', payload: response.data.token });
      dispatch({ type: 'SET_USER', payload: response.data.data });
      
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      const message = error.response?.data?.message || 'رمز التحقق غير صحيح';
      return { success: false, message };
    }
  };

  const resendOtp = async (email) => {
    try {
      const response = await axios.post('/api/auth/resend-otp', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'فشل إعادة الإرسال';
      return { success: false, message };
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const setToken = (token) => {
    dispatch({ type: 'SET_TOKEN', payload: token });
  };

  const setUser = (user) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    verifyOtp,
    resendOtp,
    logout,
    clearError,
    setToken,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};