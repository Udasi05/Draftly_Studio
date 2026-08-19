import type { Metadata } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';
import './globals.css';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Draftly Studio - Clean AI Document Platform',
  description:
    'Draftly Studio turns a short brief into polished Word or PDF documents with a clean, light writing workspace.',
  keywords: ['AI', 'document generator', 'resume', 'SRS', 'report', 'pdf', 'docx', 'cover letter'],
  openGraph: {
    title: 'Draftly Studio - Clean AI Document Platform',
    description: 'Generate polished documents instantly with AI in a light workspace.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="font-body antialiased min-h-screen bg-white text-slate-900">
        <Providers>
          <Navbar />
          <main className="pt-16 relative">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
