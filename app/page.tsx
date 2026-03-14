import { redirect } from "next/navigation"

export default function RootPage() {
  // The middleware handles all auth checks, just redirect to dashboard
  redirect("/dashboard")
}
