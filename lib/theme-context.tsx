"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

export interface ThemeSettings {
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
  sidebar_color: string
  card_color: string
  font_family: string
  font_size: string
  background_image_url: string | null
  background_opacity: number
}

export const defaultTheme: ThemeSettings = {
  primary_color: "#10b981",
  secondary_color: "#0d9488",
  accent_color: "#f59e0b",
  background_color: "#f3f4f6",
  text_color: "#1f2937",
  sidebar_color: "#1f2937",
  card_color: "#ffffff",
  font_family: "Inter",
  font_size: "16",
  background_image_url: null,
  background_opacity: 100,
}

interface ThemeContextType {
  theme: ThemeSettings
  setTheme: (theme: ThemeSettings) => void
  updateTheme: (updates: Partial<ThemeSettings>) => Promise<void>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadTheme()
  }, [])

  useEffect(() => {
    applyThemeToDOM(theme)
  }, [theme])

  const loadTheme = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profile) {
        setTheme({
          primary_color: profile.primary_color || defaultTheme.primary_color,
          secondary_color: profile.secondary_color || defaultTheme.secondary_color,
          accent_color: profile.accent_color || defaultTheme.accent_color,
          background_color: profile.background_color || defaultTheme.background_color,
          text_color: profile.text_color || defaultTheme.text_color,
          sidebar_color: profile.sidebar_color || defaultTheme.sidebar_color,
          card_color: profile.card_color || defaultTheme.card_color,
          font_family: profile.font_family || defaultTheme.font_family,
          font_size: profile.font_size || defaultTheme.font_size,
          background_image_url: profile.background_image_url,
          background_opacity: profile.background_opacity ?? defaultTheme.background_opacity,
        })
      }
    } catch (error) {
      console.error("Error loading theme:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateTheme = async (updates: Partial<ThemeSettings>) => {
    const newTheme = { ...theme, ...updates }
    setTheme(newTheme)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from("user_profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
    } catch (error) {
      console.error("Error saving theme:", error)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, updateTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeSettings() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useThemeSettings must be used within a ThemeSettingsProvider")
  }
  return context
}

function applyThemeToDOM(theme: ThemeSettings) {
  const root = document.documentElement

  // Apply CSS custom properties
  root.style.setProperty("--theme-primary", theme.primary_color)
  root.style.setProperty("--theme-secondary", theme.secondary_color)
  root.style.setProperty("--theme-accent", theme.accent_color)
  root.style.setProperty("--theme-background", theme.background_color)
  root.style.setProperty("--theme-text", theme.text_color)
  root.style.setProperty("--theme-sidebar", theme.sidebar_color)
  root.style.setProperty("--theme-card", theme.card_color)
  root.style.setProperty("--theme-font", theme.font_family)
  root.style.setProperty("--theme-font-size", `${theme.font_size}px`)
  root.style.setProperty("--theme-bg-opacity", `${theme.background_opacity / 100}`)

  // Apply font family to body
  document.body.style.fontFamily = `"${theme.font_family}", system-ui, sans-serif`
  document.body.style.fontSize = `${theme.font_size}px`
}
