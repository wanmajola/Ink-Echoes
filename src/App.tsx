/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RouterProvider, useRouter } from './components/RouterContext';
import { ThemeProvider } from './components/ThemeContext';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { PoemsList } from './components/PoemsList';
import { PoemDetail } from './components/PoemDetail';
import { SeriesList } from './components/SeriesList';
import { About } from './components/About';
import { Contact } from './components/Contact';
import { AdminPanel } from './components/AdminPanel';

function AppContent() {
  const { current } = useRouter();

  // Route router selector
  const renderCurrentPage = () => {
    switch (current.route) {
      case 'home':
        return <Home />;
      case 'poems':
        return <PoemsList />;
      case 'poem':
        return <PoemDetail />;
      case 'series':
        return <SeriesList />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Home />;
    }
  };

  return <Layout>{renderCurrentPage()}</Layout>;
}

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </ThemeProvider>
  );
}
