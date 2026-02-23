import localFont from 'next/font/local';
import './globals.css';

const mekanikal = localFont({
  src: '../public/fonts/Mekanikal/Mekanikal-Display-Regular.woff2',
  variable: '--font-mekanikal',
  display: 'swap',
});

const hofmann = localFont({
  src: '../public/fonts/Hofmann/NG-Hofmann-TRIAL.otf',
  variable: '--font-hofmann',
  display: 'swap',
});

const dazzed = localFont({
  src: '../public/fonts/Dazzed/Dazzed-TRIAL-Regular.woff2',
  variable: '--font-dazzed',
  display: 'swap',
});

const documan = localFont({
  src: '../public/fonts/Documan/Documan-TRIAL-Regular.woff2',
  variable: '--font-documan',
  display: 'swap',
});

const lazzer = localFont({
  src: '../public/fonts/Lazzer/Lazzer-TRIAL-Regular.woff2',
  variable: '--font-lazzer',
  display: 'swap',
});

const newEdge666 = localFont({
  src: '../public/fonts/NewEdge666/NewEdge666Test-Regular.otf',
  variable: '--font-newedge666',
  display: 'swap',
});

const ofform = localFont({
  src: '../public/fonts/Ofform/Ofform-TRIAL-Regular.woff2',
  variable: '--font-ofform',
  display: 'swap',
});

const roobertMono = localFont({
  src: '../public/fonts/RoobertMono/RoobertMono-TRIAL-Regular.woff2',
  variable: '--font-roobertmono',
  display: 'swap',
});

export const metadata = {
  title: 'Reconnect',
  description: 'Reconnect app',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon-32.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${mekanikal.variable} ${hofmann.variable} ${dazzed.variable} ${documan.variable} ${lazzer.variable} ${newEdge666.variable} ${ofform.variable} ${roobertMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
