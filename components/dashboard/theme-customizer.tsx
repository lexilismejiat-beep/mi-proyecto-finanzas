

import { useThemeSettings, defaultTheme } from "@/lib/theme-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, Type, ImageIcon, RotateCcw, Upload, Save, Loader2 } from "lucide-react"
import { useState, useRef, useEffect } from "react" // Se agregó useEffect
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // --- NUEVO: EFECTO PARA CARGAR EL TEMA DESDE SUPABASE AL INICIAR ---
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          updateTheme({
            primary_color: data.primary_color || theme.primary_color,
            secondary_color: data.secondary_color || theme.secondary_color,
            accent_color: data.accent_color || theme.accent_color,
            background_color: data.background_color || theme.background_color,
            text_color: data.text_color || theme.text_color,
            sidebar_color: data.sidebar_color || theme.sidebar_color,
            card_color: data.card_color || theme.card_color,
            font_family: data.font_family || theme.font_family,
            font_size: data.font_size || theme.font_size,
            background_image_url: data.background_image || theme.background_image_url,
            background_opacity: data.background_opacity || theme.background_opacity
          });
        }
      } catch (err) {
        console.error("Error al cargar tema inicial:", err);
      }
    };

    loadSavedTheme();
  }, []);

  // --- FUNCIÓN PARA GUARDAR EN LA BASE DE DATOS ---
  const handleSaveToDatabase = async () => {
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No hay sesión activa")

      const { error } = await supabase
        .from('profiles')
        .update({
          primary_color: theme.primary_color,
          secondary_color: theme.secondary_color,
          accent_color: theme.accent_color,
          background_color: theme.background_color,
          text_color: theme.text_color,
          sidebar_color: theme.sidebar_color,
          card_color: theme.card_color,
          font_family: theme.font_family,
          font_size: theme.font_size,
          background_image: theme.background_image_url, 
          background_opacity: theme.background_opacity
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success("¡Configuración guardada para siempre!")
    } catch (error: any) {
      console.error("Error al guardar:", error)
      toast.error("Error al guardar: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleColorChange = (key: string, value: string) => {
    updateTheme({ [key]: value })
  }

  const handleFontChange = (value: string) => {
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

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("user-assets")
        .getPublicUrl(filePath)

      updateTheme({ background_image_url: publicUrl })
      toast.success("Imagen de fondo subida")
    } catch (error) {
      console.error("Error subiendo imagen:", error)
      toast.error("Error al subir imagen al storage")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveBackground = () => {
    updateTheme({ background_image_url: null })
  }

  const handleResetTheme = () => {
    updateTheme(defaultTheme)
    toast.info("Valores restablecidos (debes guardar para confirmar)")
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
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col">
        <SheetHeader>
          <SheetTitle>Personalizar apariencia</SheetTitle>
          <SheetDescription>
            Personaliza colores, fuentes e imagen de fondo. Recuerda guardar al finalizar.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1">
          <Tabs defaultValue="colors" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span>Colores</span>
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <span>Fuentes</span>
              </TabsTrigger>
              <TabsTrigger value="background" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>Fondo</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-6 mt-6">
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
                          <div key={i} className="w-4 h-4 rounded-full border" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium">Colores personalizados</Label>
                <div className="grid gap-4">
                  <ColorPicker label="Primario" value={theme.primary_color} onChange={(v) => handleColorChange("primary_color", v)} />
                  <ColorPicker label="Secundario" value={theme.secondary_color} onChange={(v) => handleColorChange("secondary_color", v)} />
                  <ColorPicker label="Acento" value={theme.accent_color} onChange={(v) => handleColorChange("accent_color", v)} />
                  <ColorPicker label="Fondo" value={theme.background_color} onChange={(v) => handleColorChange("background_color", v)} />
                  <ColorPicker label="Texto" value={theme.text_color} onChange={(v) => handleColorChange("text_color", v)} />
                  <ColorPicker label="Sidebar" value={theme.sidebar_color} onChange={(v) => handleColorChange("sidebar_color", v)} />
                  <ColorPicker label="Tarjetas" value={theme.card_color} onChange={(v) => handleColorChange("card_color", v)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="typography" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Familia de fuente</Label>
                  <Select value={theme.font_family} onValueChange={handleFontChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Label>Tamaño de fuente</Label>
                    <span className="text-sm text-muted-foreground">{theme.font_size}px</span>
                  </div>
                  <Slider value={[parseInt(theme.font_size)]} onValueChange={handleFontSizeChange} min={12} max={24} step={1} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="background" className="space-y-6 mt-6">
              <div className="space-y-4">
                <Label>Imagen de fondo</Label>
                <div className="flex gap-2">
                  <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Subiendo..." : "Subir imagen"}
                  </Button>
                  {theme.background_image_url && (
                    <Button variant="destructive" onClick={handleRemoveBackground}>Quitar</Button>
                  )}
                </div>

                {theme.background_image_url && (
                  <>
                    <div className="space-y-3">
                      <Label>Opacidad del fondo ({theme.background_opacity}%)</Label>
                      <Slider value={[theme.background_opacity]} onValueChange={handleBackgroundOpacityChange} min={10} max={100} step={5} />
                    </div>
                    <div className="relative h-32 rounded-lg overflow-hidden border">
                      <img src={theme.background_image_url} alt="Preview" className="w-full h-full object-cover" style={{ opacity: theme.background_opacity / 100 }} />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-auto pt-6 border-t space-y-3 pb-4">
          <Button 
            className="w-full gap-2 shadow-md" 
            onClick={handleSaveToDatabase} 
            disabled={isSaving || isUploading}
            style={{ backgroundColor: theme.primary_color, color: theme.text_color }}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Guardando..." : "Guardar cambios permanentes"}
          </Button>

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleResetTheme}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restablecer valores por defecto
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <Input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 p-1 cursor-pointer" />
        <Input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-24 uppercase text-xs" maxLength={7} />
      </div>
    </div>
  )
}
