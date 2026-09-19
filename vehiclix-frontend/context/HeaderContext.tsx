'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface HeaderConfig {
  title?: string;
  subtitle?: string;
  section?: string;
  icon?: React.ComponentType<{ className?: string }>;
  backHref?: string;
  backText?: string;
  actions?: ReactNode;
  hideDefaultActions?: boolean;
}

interface HeaderContextType {
  headerConfig: HeaderConfig | null;
  setHeaderConfig: (config: HeaderConfig | null) => void;
}

const HeaderContext = createContext<HeaderContextType>({
  headerConfig: null,
  setHeaderConfig: () => {},
});

export const useHeader = () => useContext(HeaderContext);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null);

  return (
    <HeaderContext.Provider value={{ headerConfig, setHeaderConfig }}>
      {children}
    </HeaderContext.Provider>
  );
}
