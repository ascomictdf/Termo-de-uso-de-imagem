import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ICTDF | Autorização de Uso de Imagem, Nome e Voz',
  description:
    'Plataforma digital para autorização, assinatura e envio de termos de uso de imagem, nome e voz do ICTDF.',
  openGraph: {
    title: 'ICTDF | Autorização de Uso de Imagem, Nome e Voz',
    description:
      'Autorize, assine e gere o termo digital de uso de imagem, nome e voz do ICTDF.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ICTDF | Autorização de Uso de Imagem, Nome e Voz',
    description:
      'Autorize, assine e gere o termo digital de uso de imagem, nome e voz do ICTDF.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
