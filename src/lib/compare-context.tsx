"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface CompareCollege {
  id: number;
  name: string;
  slug: string;
}

interface CompareContextType {
  colleges: CompareCollege[];
  add: (college: CompareCollege) => { success: boolean; error?: string };
  remove: (id: number) => void;
  clear: () => void;
  isSelected: (id: number) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextType | null>(null);

const MAX_COMPARE = 3;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [colleges, setColleges] = useState<CompareCollege[]>([]);

  const add = useCallback(
    (college: CompareCollege) => {
      if (colleges.length >= MAX_COMPARE) {
        return { success: false, error: `Maximum ${MAX_COMPARE} colleges can be compared` };
      }
      if (colleges.some((c) => c.id === college.id)) {
        return { success: true }; // Already added
      }
      setColleges((prev) => [...prev, college]);
      return { success: true };
    },
    [colleges]
  );

  const remove = useCallback((id: number) => {
    setColleges((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clear = useCallback(() => setColleges([]), []);

  const isSelected = useCallback(
    (id: number) => colleges.some((c) => c.id === id),
    [colleges]
  );

  return (
    <CompareContext.Provider
      value={{ colleges, add, remove, clear, isSelected, isFull: colleges.length >= MAX_COMPARE }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
