import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { ProfileProvider } from '@/components/ProfileProvider';
import '@/styles/globals.css';

function resolveAppUrl() {
  const fallback = 'https://your-project-name.vercel.app';
  const raw = process.env.NEXT_PUBLIC_APP_URL || fallback;

  try {
    return new URL(raw);
  } catch {
    return new URL(fallback);
  }
}

const appUrl = resolveAppUrl();

export const metadata: Metadata = {
  metadataBase: appUrl,
  title: {
    default: 'Mini Wiki',
    template: '%s | Mini Wiki'
  },
  description: 'Production-ready Mini Wiki platform for connected knowledge.',
  openGraph: {
    title: 'Mini Wiki',
    description: 'Production-ready Mini Wiki platform for connected knowledge.',
    url: appUrl,
    siteName: 'Mini Wiki',
    type: 'website'
  },
  icons: {
    icon: '/mini-wiki.png',
    shortcut: '/mini-wiki.png',
    apple: '/mini-wiki.png'
  },
  alternates: {
    canonical: '/'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ProfileProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
        </ProfileProvider>
      </body>
    </html>
  );
}
