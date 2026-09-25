import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BeatCode Studio - 100 Ways to Code with the Beat',
  description: 'Upload audio files to generate and run 100+ beat-driven code techniques, ranging from instantaneous background color switching to kinetic geometry, physics, shaders, and custom AI-generated code.',
  openGraph: {
    title: 'BeatCode Studio - 100 Ways to Code with the Beat',
    description: 'Upload audio files to generate and run 100+ beat-driven code techniques, ranging from instantaneous background color switching to kinetic geometry, physics, shaders, and custom AI-generated code.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BeatCode Studio - 100 Ways to Code with the Beat',
    description: 'Upload audio files to generate and run 100+ beat-driven code techniques, ranging from instantaneous background color switching to kinetic geometry, physics, shaders, and custom AI-generated code.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="bg-neutral-950 text-neutral-100 antialiased min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
