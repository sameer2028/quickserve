import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

const ThemeToggle = () => {
  const [theme, toggleTheme] = useDarkMode();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-300 focus:outline-none cursor-pointer"
      aria-label="Toggle dark mode"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 text-amber-500 transition-all duration-300 transform scale-100" />
        ) : (
          <Moon className="h-5 w-5 text-gray-600 transition-all duration-300 transform scale-100" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
