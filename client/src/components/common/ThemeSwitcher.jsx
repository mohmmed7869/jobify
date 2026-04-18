import React, { useEffect, useState } from 'react';
import { THEME_MODES, THEME_DETAILS, applyTheme, getAppliedTheme } from '../../utils/themeConfig';
import { FiPalette, FiCheck } from 'react-icons/fi';

const ThemeSwitcher = () => {
  const [currentTheme, setCurrentTheme] = useState(getAppliedTheme());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = getAppliedTheme();
    setCurrentTheme(savedTheme);
  }, []);

  const handleThemeChange = (theme) => {
    applyTheme(theme);
    setCurrentTheme(theme);
    setIsOpen(false);
  };

  const themes = Object.values(THEME_DETAILS);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-formal-secondary flex items-center gap-2 group"
        title="تغيير المظهر"
      >
        <FiPalette className="group-hover:rotate-45 transition-transform duration-500" />
        <span className="hidden md:inline">المظهر</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-3 w-80 glass-premium rounded-[2.5rem] shadow-premium-xl z-50 p-5 animate-slide-up border-primary-200/30 overflow-hidden">
            <div className="mb-4 px-2 flex items-center justify-between">
              <span className="text-xs font-black text-primary-600 uppercase tracking-[0.2em]">تخصيص المظهر</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.class}
                  onClick={() => handleThemeChange(theme.class)}
                  className={`
                    w-full text-right p-3 rounded-2xl transition-all duration-500 flex items-center justify-between group relative overflow-hidden border-2
                    ${
                      currentTheme === theme.class
                        ? 'border-primary-500 bg-primary-500/10 shadow-glow-sm scale-[1.02]'
                        : 'border-transparent bg-themed-bg-ter/40 hover:bg-primary-500/5 hover:border-primary-500/20'
                    }
                  `}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {theme.colors.map((color, idx) => (
                        <div 
                          key={idx}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110"
                          style={{ backgroundColor: color, zIndex: 10 - idx }}
                        />
                      ))}
                    </div>
                    <span className={`font-black text-sm transition-colors ${currentTheme === theme.class ? 'text-primary-600' : 'themed-text-sec'}`}>
                      {theme.name}
                      {theme.class === 'light' && (
                        <span className="mr-2 px-2 py-0.5 bg-primary-600 text-white text-[8px] rounded-full uppercase tracking-tighter">
                          المقترح
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="relative z-10">
                    {currentTheme === theme.class && (
                      <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-glow">
                        <FiCheck size={14} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-primary-100/10 text-[10px] text-center themed-text-ter font-bold uppercase tracking-widest">
              نظام التصميم الفائق v3.0
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
