import { Familjen_Grotesk } from 'next/font/google'

// One family for everything — wordmark, headings and body copy.
// Variable weight axis (400–700) carries the whole hierarchy.
export const siteFont = Familjen_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans'
})
