import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ComponentFrameProps {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  theme?: 'light' | 'dark';
  containerWidth?: string;
}

export default function ComponentFrame({
  children,
  width = '100%',
  height = '100%',
  theme = 'light',
  containerWidth = 'auto',
}: ComponentFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeDoc, setIframeDoc] = useState<Document | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Copy all stylesheets from parent to iframe
    const parentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
    const styleHTML = parentStyles
      .map((el) => el.outerHTML)
      .join('\n');

    // Set up the iframe document
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html class="${theme}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${styleHTML}
          <style>
            body {
              margin: 0;
              padding: 16px;
              font-family: system-ui, -apple-system, sans-serif;
              background: transparent;
            }
            .component-container {
              width: ${containerWidth};
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div id="component-root" class="component-container"></div>
        </body>
      </html>
    `);
    doc.close();

    setIframeDoc(doc);
  }, [theme, containerWidth]);

  // Handle component sizing
  const frameStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    border: '1px solid',
    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
    borderRadius: '0.5rem',
    backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
  };

  return (
    <div className="component-frame-wrapper">
      <iframe
        ref={iframeRef}
        title="Component Preview"
        style={frameStyle}
        sandbox="allow-scripts allow-same-origin"
      />
      {iframeDoc &&
        createPortal(
          <div className={theme}>{children}</div>,
          iframeDoc.getElementById('component-root')!
        )}
    </div>
  );
}