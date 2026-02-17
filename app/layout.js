import './globals.css';

export const metadata = {
  title: 'Reconnect',
  description: 'Reconnect app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
