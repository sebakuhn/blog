// used for rendering equations (optional)
import 'katex/dist/katex.min.css'
// used for code syntax highlighting (optional)
import 'prismjs/themes/prism-coy.css'
// core styles shared by all of react-notion-x (required)
import 'react-notion-x/styles.css'
// global styles shared across the entire site
import 'styles/global.css'
// this might be better for dark mode
// import 'prismjs/themes/prism-okaidia.css'
// global style overrides for notion
import 'styles/notion.css'
// global style overrides for prism theme (optional)
import 'styles/prism-theme.css'
// personal design system — imported last so it wins over the above
import 'styles/theme.css'

import type { AppProps } from 'next/app'
import Head from 'next/head'

import { bootstrap } from '@/lib/bootstrap-client'
import { isServer } from '@/lib/config'
import { siteFont } from '@/lib/fonts/site-fonts'

if (!isServer) {
  bootstrap()
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Importing siteFont here is what makes next/font emit its @font-face
          rules onto every page. The class it generates cannot be applied to
          <html> from _document — the class lands but its stylesheet does not,
          so --font-sans came out empty in production. Declaring the variable
          ourselves keeps it on :root, where styles/theme.css reads it, without
          pulling in a styled-jsx runtime that Turbopack cannot resolve. */}
      <Head>
        <style>{`:root{--font-sans:${siteFont.style.fontFamily}}`}</style>
      </Head>

      <Component {...pageProps} />
    </>
  )
}
