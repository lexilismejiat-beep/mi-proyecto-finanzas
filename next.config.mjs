/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // <--- ESTA LÍNEA ES VITAL PARA LA APK
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
