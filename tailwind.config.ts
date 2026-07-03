import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nada Utama (Liturgi & Kehangatan Komunitas)
        primary: '#941a00',              // Merah Bata Pekat (Aksen utama, teks judul)
        'primary-container': '#c02400',    // Merah Oranye Terang (Tombol utama, highlight)
        secondary: '#835400',            // Emas Kecokelatan Liturgi
        'secondary-container': '#fdb242',  // Oranye Hangat (Background kartu, aksen cerah)
        tertiary: '#7e3426',             // Maroon gelap pembantu
        
        // Permukaan & Latar Belakang (Nuansa Kertas Lilin Hangat / Bone White)
        background: '#fdf9f3',
        surface: '#fdf9f3',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f7f3ed',
        'surface-container': '#f1ede7',
        'surface-container-high': '#ebe8e2',
        'surface-container-highest': '#e6e2dc',
        
        // Teks & Kontras
        'on-background': '#1c1c18',
        'on-surface': '#1c1c18',
        'on-surface-variant': '#5c403a',
        
        // Garis Batas & Pembagi
        outline: '#907068',
        'outline-variant': '#e5beb5',
        
        // Status khusus
        'error-container': '#ffdad6',
        error: '#ba1a1a',
      },
    },
  },
  plugins: [],
};
export default config;
