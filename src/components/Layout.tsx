/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter, RouteType } from './RouterContext';
import { useTheme } from './ThemeContext';
import { db } from '../lib/db';
import { Feather, Sun, Moon, Menu, X, BookOpen, Compass, Inbox, User, LogOut, Check } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { current, navigate } = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [templomeLink, setTemplomeLink] = useState('');

  // Check login state periodically or on change
  useEffect(() => {
    const checkLogin = async () => {
      const u = await db.auth.getCurrentUser();
      setIsAdminLoggedIn(!!u);
    };
    checkLogin();
    
    // Listen for custom events or check on interval since in local/mock state
    const int = setInterval(checkLogin, 2000);
    return () => clearInterval(int);
  }, []);

  // Fetch Templome link
  useEffect(() => {
    const fetchLink = async () => {
      const link = await db.settings.getTemplomeLink();
      setTemplomeLink(link);
    };
    fetchLink();

    window.addEventListener('ink-echoes-db-change', fetchLink);
    return () => {
      window.removeEventListener('ink-echoes-db-change', fetchLink);
    };
  }, []);

  const handleLogout = async () => {
    await db.auth.logout();
    setIsAdminLoggedIn(false);
    navigate('home');
    setIsMobileMenuOpen(false);
  };

  const navItems: { label: string; route: RouteType; icon: React.ReactNode }[] = [
    { label: 'Home', route: 'home', icon: <Feather className="w-4 h-4" /> },
    { label: 'Poems', route: 'poems', icon: <Compass className="w-4 h-4" /> },
    { label: 'Series', route: 'series', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'About', route: 'about', icon: <User className="w-4 h-4" /> },
    { label: 'Contact', route: 'contact', icon: <Inbox className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-sand text-charcoal dark:bg-earth-dark dark:text-sand font-sans selection:bg-linen/60 dark:selection:bg-earth-accent/40 transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-sand/85 dark:bg-earth-dark/85 backdrop-blur-md border-b border-charcoal/10 dark:border-sand/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <button 
              onClick={() => navigate('home')} 
              className="group flex items-center space-x-3 text-left focus:outline-none focus:ring-2 focus:ring-sage rounded"
              id="logo-btn"
            >
              <div className="p-2.5 bg-sage text-sand dark:bg-[#D9D1C5] dark:text-[#1A1A1A] rounded-lg group-hover:scale-105 transition-all duration-300 shadow-sm">
                <Feather className="w-5 h-5 rotate-3" />
              </div>
              <div>
                <span className="font-display text-xl sm:text-2xl font-semibold tracking-tight block text-ink dark:text-sand">
                  Ink &amp; Echoes
                </span>
                <span className="text-[10px] font-mono tracking-widest text-[#5A5A40] dark:text-[#D9D1C5] uppercase block -mt-1 font-medium">
                  Literary Journal
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = current.route === item.route;
                return (
                  <button
                    key={item.route}
                    onClick={() => navigate(item.route)}
                    id={`nav-${item.route}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 focus:outline-none ${
                      isActive 
                        ? 'bg-sage text-sand dark:bg-[#D9D1C5]/15 dark:text-linen' 
                        : 'text-charcoal/70 dark:text-sand/75 hover:text-sage dark:hover:text-linen hover:bg-sage/5 dark:hover:bg-[#D9D1C5]/5'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="h-4 w-px bg-charcoal/10 dark:bg-sand/10 mx-2" />

              {/* Admin Panel button */}
              <button
                onClick={() => navigate('admin')}
                id="nav-admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 focus:outline-none ${
                  current.route === 'admin' 
                    ? 'bg-sage text-sand dark:bg-[#D9D1C5]/15 dark:text-linen' 
                    : 'text-charcoal/70 dark:text-sand/75 hover:text-sage dark:hover:text-linen hover:bg-sage/5 dark:hover:bg-[#D9D1C5]/5'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isAdminLoggedIn ? 'bg-sage animate-pulse' : 'bg-transparent border border-sage/50 dark:border-linen/50'}`} />
                <span>Curator</span>
              </button>

              {isAdminLoggedIn && (
                <button
                  onClick={handleLogout}
                  id="nav-logout"
                  title="Log Out Curator"
                  className="p-2 text-charcoal/50 hover:text-red-500 dark:text-sand/50 dark:hover:text-red-400 rounded-lg transition-colors focus:outline-none"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                id="theme-toggle-desktop"
                aria-label="Toggle theme"
                className="p-2.5 ml-2 rounded-lg bg-white/40 hover:bg-white/70 dark:bg-earth-card/50 dark:hover:bg-earth-card/85 text-charcoal dark:text-sand hover:text-sage dark:hover:text-linen transition-all duration-200 focus:outline-none border border-charcoal/5 dark:border-sand/5"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </nav>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center space-x-3">
              <button
                onClick={toggleTheme}
                id="theme-toggle-mobile"
                aria-label="Toggle theme"
                className="p-2 rounded-lg bg-white/40 dark:bg-earth-card/50 text-charcoal dark:text-sand focus:outline-none border border-charcoal/5 dark:border-sand/5"
              >
                {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                id="menu-toggle-mobile"
                aria-label="Open menu"
                className="p-2 rounded-lg bg-white/40 dark:bg-earth-card/50 text-charcoal dark:text-sand focus:outline-none border border-charcoal/5 dark:border-sand/5"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile menu panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-charcoal/10 dark:border-sand/10 bg-sand/95 dark:bg-earth-dark/95 backdrop-blur-md px-4 pt-2 pb-6 space-y-1.5 shadow-xl page-enter">
            {navItems.map((item) => {
              const isActive = current.route === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => {
                    navigate(item.route);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-all flex items-center space-x-3 ${
                    isActive 
                      ? 'bg-sage text-sand dark:bg-[#D9D1C5]/15 dark:text-linen' 
                      : 'text-charcoal/70 dark:text-sand/75 hover:bg-sage/5 dark:hover:bg-linen/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}

            <button
              onClick={() => {
                navigate('admin');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-all flex items-center space-x-3 ${
                current.route === 'admin' 
                  ? 'bg-sage text-sand dark:bg-[#D9D1C5]/15 dark:text-linen' 
                  : 'text-charcoal/70 dark:text-sand/75 hover:bg-sage/5 dark:hover:bg-linen/5'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isAdminLoggedIn ? 'bg-sage' : 'bg-transparent border border-sage/50 dark:border-[#D9D1C5]/50'}`} />
              <span>Curator (Admin Panel)</span>
            </button>

            {isAdminLoggedIn && (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-red-500 rounded-lg text-base font-medium transition-all flex items-center space-x-3"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out Curator</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="page-enter">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-linen/20 text-charcoal/80 dark:bg-earth-card/40 dark:text-sand/65 border-t border-charcoal/10 dark:border-sand/10 py-16 transition-colors font-sans select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* Mission & Brand */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center space-x-2 text-charcoal dark:text-sand">
                <Feather className="w-5 h-5 text-sage" />
                <span className="font-display text-lg font-semibold tracking-tight text-ink dark:text-sand">Ink &amp; Echoes</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm font-serif italic text-charcoal/80 dark:text-sand/80">
                "We write of shadows on water, and notes cast to the wind. In our ink lies the record of human sentiment; in our echoes, the persistence of song."
              </p>
              <p className="text-xs text-charcoal/65 dark:text-sand/60">
                Established 2026. Dedicated to contemporary lyrical works, verse series, and philosophical translations.
              </p>
            </div>

            {/* Quick Navigation Links */}
            <div>
              <h4 className="text-xs tracking-widest uppercase font-semibold text-charcoal dark:text-sand/80 font-mono mb-4">
                Pages
              </h4>
              <ul className="space-y-2.5 text-sm">
                {navItems.map((item) => (
                  <li key={item.route}>
                    <button 
                      onClick={() => navigate(item.route)}
                      className="hover:text-sage dark:hover:text-linen text-charcoal/70 dark:text-sand/70 transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
                <li>
                  <button 
                    onClick={() => navigate('admin')}
                    className="hover:text-sage dark:hover:text-linen text-charcoal/70 dark:text-sand/70 transition-colors"
                  >
                    Curator Dashboard
                  </button>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-charcoal/10 dark:border-sand/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-charcoal/50 dark:text-sand/55 font-sans">
            <p>&copy; 2026 Ink &amp; Echoes. All rights reserved. Created for fine literary reading.</p>
            <div className="mt-4 sm:mt-0 font-medium text-charcoal/70 dark:text-sand/75">
              Developed by <a href={templomeLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-charcoal dark:text-sand hover:underline transition-all">Templome</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
