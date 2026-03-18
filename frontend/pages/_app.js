import '../styles/globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import Navbar from '../components/navbar';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
        <Navbar />
        <Toaster position="top-center" reverseOrder={false} />
        <Component {...pageProps} />
      </ThemeProvider>
      <Analytics />
    </>
  );
}