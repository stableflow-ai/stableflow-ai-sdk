import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface HistoryItem {
  id: string; // res.data.deposit_id
  quote: unknown; // quoteRes
  createdAt: number;
}

interface HistoryState {
  items: HistoryItem[];
  add: (id: string, quote: unknown) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      add: (id, quote) =>
        set((state) => ({
          items: [
            { id, quote, createdAt: Date.now() },
            ...state.items.filter((item) => item.id !== id),
          ],
        })),
      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "hyperliquid-deposit-history",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
