"use client"

/**
 * useAppStore — global client state, persisted to localStorage via Zustand.
 *
 * `skipHydration: true` ensures the server and initial client renders both
 * use the default ("exxat-one"), preventing any SSR/CSR hydration mismatch.
 * The store is manually rehydrated in ProductProvider after mount.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Product = "exxat-one" | "exxat-prism"

interface AppState {
  /** Currently active product — drives theme class and sidebar logo */
  product: Product
  setProduct: (product: Product) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      product: "exxat-one",
      setProduct: (product) => set({ product }),
    }),
    {
      name: "exxat-app",
      skipHydration: true,
    }
  )
)
