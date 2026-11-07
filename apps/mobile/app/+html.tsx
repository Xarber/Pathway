// SPDX-License-Identifier: AGPL-3.0-only
import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();
  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
        <meta name="theme-color" content="#6269F5" />
        <meta
          name="description"
          content="Different paths. One destination. Temporary journey coordination with your people."
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/icon.svg" />
        <link rel="stylesheet" href="/leaflet.css" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html:
              'html,body,#root{min-height:100%;}body{overscroll-behavior-y:none;}input,textarea{font-size:16px!important}button,a{touch-action:manipulation}*:focus-visible{outline:3px solid #6269F5;outline-offset:3px}.leaflet-container{font-family:system-ui,sans-serif}.leaflet-control-attribution{font-size:10px!important;max-width:100%}',
          }}
        />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
        <script src="/pwa-register.js" defer />
      </body>
    </html>
  );
}
