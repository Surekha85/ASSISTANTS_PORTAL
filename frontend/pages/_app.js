
import '../styles/globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import Navbar from '../components/navbar';
import { useRouter } from 'next/router';

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // :point_down: Only hide in login page
  const hideNavbar = router.pathname === '/login';

  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
        {!hideNavbar && <Navbar />}
        <Toaster position="top-right" reverseOrder={false} />
        <Component {...pageProps} />
      </ThemeProvider>
      <Analytics />
    </>
  );
}
