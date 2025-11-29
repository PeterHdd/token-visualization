import './globals.css';

export const metadata = {
  title: 'Tokenizer Visualizer',
  description: 'Visualize how GPT, LLaMA, Mistral, and BERT tokenizers split your prompt.',
  icons: {
    icon: '/tv-icon.svg',
    shortcut: '/tv-icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/tv-icon.svg" sizes="any" />
        <link rel="shortcut icon" type="image/svg+xml" href="/tv-icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
