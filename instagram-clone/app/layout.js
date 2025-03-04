import './globals.css';

export const metadata = {
  title: 'Instagram Clone',
  description: 'A simple Instagram clone with feed and post creation',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}