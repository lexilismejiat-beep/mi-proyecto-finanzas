"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Error de autenticación
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
              Hubo un problema al iniciar sesión. Por favor, intenta de nuevo.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Link href="/auth/login">Volver a intentar</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
