import type { Metadata } from 'next'
import { Inter, Roboto, Open_Sans, Lato, Montserrat, Poppins, Raleway, Nunito, Playfair_Display, Merriweather, Source_Sans_3, Ubuntu, Quicksand, Josefin_Sans, Comfortaa } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' })
const roboto = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700"], variable: '--font-roboto' })
const openSans = Open_Sans({ subsets: ["latin"], variable: '--font-open-sans' })
const lato = Lato({ subsets: ["latin"], weight: ["300", "400", "700"], variable: '--font-lato' })
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' })
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: '--font-poppins' })
const raleway = Raleway({ subsets: ["latin"], variable: '--font-raleway' })
const nunito = Nunito({ subsets: ["latin"], variable: '--font-nunito' })
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair' })
const merriweather = Merriweather({ subsets: ["latin"], weight: ["300", "400", "700"], variable: '--font-merriweather' })
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: '--font-source-sans' })
const ubuntu = Ubuntu({ subsets: ["latin"], weight: ["300", "400", "500", "700"], variable: '--font-ubuntu' })
const quicksand = Quicksand({ subsets: ["latin"], variable: '--font-quicksand' })
const josefinSans = Josefin_Sans({ subsets: ["latin"], variable: '--font-josefin' })
const comfortaa = Comfortaa({ subsets: ["latin"], variable: '--font-comfortaa' })

export const metadata: Metadata = {
  title: 'Mis Finanzas - Dashboard',
  description: 'Gestiona tus finanzas personales de manera inteligente',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`
        ${inter.variable} 
        ${roboto.variable} 
        ${openSans.variable} 
        ${lato.variable} 
        ${montserrat.variable} 
        ${poppins.variable} 
        ${raleway.variable} 
        ${nunito.variable} 
        ${playfairDisplay.variable} 
        ${merriweather.variable} 
        ${sourceSans.variable} 
        ${ubuntu.variable} 
        ${quicksand.variable} 
        ${josefinSans.variable} 
        ${comfortaa.variable} 
        font-sans antialiased
      `}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
