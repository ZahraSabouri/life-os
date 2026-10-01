import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'JobMap',description:'Your private job application workspace.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en-GB"><body>{children}</body></html>}
