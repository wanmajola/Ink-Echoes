/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type RouteType = 'home' | 'poems' | 'poem' | 'series' | 'about' | 'contact' | 'admin';

interface RouteState {
  route: RouteType;
  poemSlug?: string;
  seriesSlug?: string;
  categoryId?: string;
  searchQuery?: string;
  page?: number;
}

interface RouterContextProps {
  current: RouteState;
  navigate: (route: RouteType, params?: Partial<Omit<RouteState, 'route'>>) => void;
}

const RouterContext = createContext<RouterContextProps | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [current, setCurrent] = useState<RouteState>({ route: 'home' });

  // Parse path hash into state
  const parseHash = () => {
    const hash = window.location.hash || '#/';
    const path = hash.replace(/^#\//, '');
    
    if (!path) {
      setCurrent({ route: 'home' });
      return;
    }

    const [main, queryStr] = path.split('?');
    const parts = main.split('/');
    const route = parts[0] as RouteType;
    
    // Parse query string (category, search, page)
    const query: Record<string, string> = {};
    if (queryStr) {
      queryStr.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k && v) {
          query[k] = decodeURIComponent(v);
        }
      });
    }

    if (route === 'poem' && parts[1]) {
      setCurrent({ route: 'poem', poemSlug: parts[1] });
    } else if (route === 'series' && parts[1]) {
      setCurrent({ route: 'series', seriesSlug: parts[1] });
    } else {
      setCurrent({
        route: route || 'home',
        categoryId: query.category || undefined,
        searchQuery: query.search || undefined,
        page: query.page ? parseInt(query.page, 10) : 1
      });
    }
  };

  useEffect(() => {
    // Sync initial state
    parseHash();

    // Listen to hash changes (back / forward buttons supported!)
    const handleHashChange = () => {
      parseHash();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Update hash to navigate and let listener handle the state change
  const navigate = (route: RouteType, params?: Partial<Omit<RouteState, 'route'>>) => {
    let newHash = `#/${route}`;
    
    if (route === 'poem' && params?.poemSlug) {
      newHash = `#/${route}/${params.poemSlug}`;
    } else if (route === 'series' && params?.seriesSlug) {
      newHash = `#/${route}/${params.seriesSlug}`;
    } else if (params) {
      const queryParts: string[] = [];
      if (params.categoryId) queryParts.push(`category=${encodeURIComponent(params.categoryId)}`);
      if (params.searchQuery) queryParts.push(`search=${encodeURIComponent(params.searchQuery)}`);
      if (params.page) queryParts.push(`page=${params.page}`);
      
      if (queryParts.length > 0) {
        newHash += `?${queryParts.join('&')}`;
      }
    }

    window.location.hash = newHash;
    
    // Fallback if hashchange listener is slow / not triggered
    setTimeout(() => {
      parseHash();
    }, 10);
  };

  return (
    <RouterContext.Provider value={{ current, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
