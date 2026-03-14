"use client"

import { useThemeSettings, defaultTheme } from "@/lib/theme-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, Type, ImageIcon, RotateCcw, Upload } from "lucide-react"
import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
  { value: "Raleway", label: "Raleway" },
  { value: "Nunito", label: "Nunito" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Source Sans Pro", label: "Source Sans Pro" },
  { value: "Ubuntu", label: "Ubuntu" },
  { value: "Quicksand", label: "Quicksand" },
  { value: "Josefin Sans", label: "Josefin Sans" },
  { value: "Comfortaa", label: "Comfortaa" },
]

const PRESET_THEMES = [
  {
    name: "Esmeralda (Default)",
    colors: {
      primary_color: "#10b981",
      secondary_color: "#0d9488",
      accent_color: "#f59e0b",
      background_color: "#f3f4f6",
      text_color: "#1f2937",
      sidebar_color: "#1f2937",
      card_color: "#ffffff",
    }
  },
  {
    name: "Océano Azul",
    colors: {
      primary_color: "#3b82f6",
      secondary_color: "#1d4ed8",
      accent_color: "#06b6d4",
      background_color: "#f0f9ff",
      text_color: "#1e3a5f",
      sidebar_color: "#1e3a5f",
      card_color: "#ffffff",
    }
  },
  {
    name: "Atardecer",
    colors: {
      primary_color: "#f97316",
      secondary_color: "#ea580c",
      accent_color: "#fbbf24",
      background_color: "#fffbeb",
      text_color: "#78350f",
      sidebar_color: "#451a03",
      card_color: "#ffffff",
    }
  },
  {
    name: "Rosa Moderno",
    colors: {
      primary_color: "#ec4899",
      secondary_color: "#db2777",
      accent_color: "#a855f7",
      background_color: "#fdf4ff",
      text_color: "#701a75",
      sidebar_color: "#4a044e",
      card_color: "#ffffff",
    }
  },
  {
    name: "Bosque",
    colors: {
      primary_color: "#22c55e",
      secondary_color: "#16a34a",
      accent_color: "#84cc16",
      background_color: "#f0fdf4",
      text_color: "#14532d",
      sidebar_color: "#14532d",
      card_color: "#ffffff",
    }
  },
  {
    name: "Noche Oscura",
    colors: {
      primary_color: "#8b5cf6",
      secondary_color: "#7c3aed",
      accent_color: "#06b6d4",
      background_color: "#1f2937",
      text_color: "#f3f4f6",
      sidebar_color: "#111827",
      card_color: "#374151",
    }
  },
]

export function ThemeCustomizer() {
  const { theme, updateTheme } = useThemeSettings()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleColorChange = (key: string, value: string) => {
    updateTheme({ [key]: value })
  }

  const handleFontChange = (value: string) => {
    // Load Google Font dynamically
    const link = document.createElement("link")
    link.href = `https://fonts.googleapis.com/css2?family=${value.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`
    link.rel = "stylesheet"
    document.head.appendChild(link)
    
    updateTheme({ font_family: value })
  }

  const handleFontSizeChange = (value: number[]) => {
    updateTheme({ font_size: value[0].toString() })
  }

  const handleBackgroundOpacityChange = (value: number[]) => {
    updateTheme({ background_opacity: value[0] })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-bg-${Date.now()}.${fileExt}`
      const filePath = `backgrounds/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("user-assets")
        .upload(filePath, file)

      if (uploadError) {
        // If bucket doesn't exist, use a data URL instead
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          updateTheme({ background_image_url: dataUrl })
        }
        reader.readAsDataURL(file)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from("user-assets")
        .getPublicUrl(filePath)

      updateTheme({ background_image_url: publicUrl })
    } catch (error) {
      console.error("Error uploading image:", error)
      // Fallback to data URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        updateTheme({ background_image_url: dataUrl })
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveBackground = () => {
    updateTheme({ background_image_url: null })
  }

  const handleResetTheme = () => {
    updateTheme(defaultTheme)
  }

  const applyPreset = (preset: typeof PRESET_THEMES[0]) => {
    updateTheme(preset.colors)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg">
          <Palette className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Personalizar apariencia</SheetTitle>
          <SheetDescription>
            Personaliza los colores, fuentes e imagen de fondo de tu página
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="colors" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Colores</span>
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span className="hidden sm:inline">Fuentes</span>
            </TabsTrigger>
            <TabsTrigger value="background" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Fondo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6 mt-6">
            {/* Preset Themes */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Temas prediseñados</Label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_THEMES.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-start gap-2"
                    onClick={() => applyPreset(preset)}
                  >
                    <span className="text-xs font-medium">{preset.name}</span>
                    <div className="flex gap-1">
                      {Object.values(preset.colors).slice(0, 4).map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Colores personalizados</Label>
              
              <div className="grid gap-4">
                <ColorPicker
                  label="Color primario"
                  value={theme.primary_color}
                  onChange={(v) => handleColorChange("primary_color", v)}
                />
                <ColorPicker
                  label="Color secundario"
                  value={theme.secondary_color}
                  onChange={(v) => handleColorChange("secondary_color", v)}
                />
                <ColorPicker
                  label="Color de acento"
                  value={theme.accent_color}
                  onChange={(v) => handleColorChange("accent_color", v)}
                />
                <ColorPicker
                  label="Color de fondo"
                  value={theme.background_color}
                  onChange={(v) => handleColorChange("background_color", v)}
                />
                <ColorPicker
                  label="Color de texto"
                  value={theme.text_color}
                  onChange={(v) => handleColorChange("text_color", v)}
                />
                <ColorPicker
                  label="Color del sidebar"
                  value={theme.sidebar_color}
                  onChange={(v) => handleColorChange("sidebar_color", v)}
                />
                <ColorPicker
                  label="Color de tarjetas"
                  value={theme.card_color}
                  onChange={(v) => handleColorChange("card_color", v)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Familia de fuente</Label>
                <Select value={theme.font_family} onValueChange={handleFontChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-sm font-medium">Tamaño de fuente</Label>
                  <span className="text-sm text-muted-foreground">{theme.font_size}px</span>
                </div>
                <Slider
                  value={[parseInt(theme.font_size)]}
                  onValueChange={handleFontSizeChange}
                  min={12}
                  max={24}
                  step={1}
                />
              </div>

              <div className="p-4 rounded-lg border bg-muted/50">
                <p className="text-sm" style={{ fontFamily: theme.font_family, fontSize: `${theme.font_size}px` }}>
                  Vista previa del texto con la fuente y tamaño seleccionados. 
                  Así se verá el contenido en tu aplicación.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="background" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Imagen de fondo</Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Subiendo..." : "Subir imagen"}
                  </Button>
                  {theme.background_image_url && (
                    <Button variant="destructive" onClick={handleRemoveBackground}>
                      Quitar
                    </Button>
                  )}
                </div>
              </div>

              {theme.background_image_url && (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-sm font-medium">Opacidad del fondo</Label>
                      <span className="text-sm text-muted-foreground">{theme.background_opacity}%</span>
                    </div>
                    <Slider
                      value={[theme.background_opacity]}
                      onValueChange={handleBackgroundOpacityChange}
                      min={10}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div className="relative h-32 rounded-lg overflow-hidden border">
                    <img
                      src={theme.background_image_url}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                      style={{ opacity: theme.background_opacity / 100 }}
                    />
                  </div>
                </>
              )}

              <div className="p-4 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
                <p>Sube una imagen para usarla como fondo de tu aplicación. Puedes ajustar la opacidad para que el contenido sea más legible.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-6 border-t">
          <Button variant="outline" className="w-full" onClick={handleResetTheme}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restablecer valores por defecto
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 p-1 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 uppercase"
          maxLength={7}
        />
      </div>
    </div>
  )
}
