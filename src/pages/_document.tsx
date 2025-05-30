import Document, { Head, Html, Main, NextScript } from 'next/document'
import siteConfig from '../../config/site.config'

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta name="description" content="OneDrive Vercel Index" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          {siteConfig.googleFontLinks.map(link => (
            <link key={link} rel="stylesheet" href={link} />
          ))}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    // Get theme from cookie
                    const cookieMatch = document.cookie.match(/theme=([^;]+)/);
                    const savedTheme = cookieMatch ? cookieMatch[1] : 'system';
                    
                    const applyTheme = (theme) => {
                      if (theme === 'system') {
                        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        if (systemDark) {
                          document.documentElement.classList.add('dark');
                        } else {
                          document.documentElement.classList.remove('dark');
                        }
                      } else if (theme === 'dark') {
                        document.documentElement.classList.add('dark');
                      } else {
                        document.documentElement.classList.remove('dark');
                      }
                    };
                    
                    applyTheme(savedTheme);
                  } catch (e) {
                    // If anything fails, default to system preference
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                })();
              `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
