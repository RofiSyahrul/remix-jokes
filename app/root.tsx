import {
  HtmlMetaDescriptor,
  LinkDescriptor,
  Links,
  LinksFunction,
  LiveReload,
  LoaderFunction,
  Meta,
  MetaFunction,
  Outlet,
  Scripts,
  useCatch,
  useLoaderData
} from 'remix';

import config from '~/config';
import globalLargeStylesUrl from '~/styles/global-large.css';
import globalMediumStylesUrl from '~/styles/global-medium.css';
import globalStylesUrl from '~/styles/global.css';
import { buildLinks, buildMeta, defaultTitle } from '~/utils/head';
import { singleLine } from '~/utils/string';

function buildBaseMeta() {
  return {
    viewport: 'width=device-width,initial-scale=1,viewport-fit=cover',
    'theme-color': config.manifest.themeColor,
    'application-name': config.manifest.name
  };
}

function buildAppleAppMeta(): HtmlMetaDescriptor {
  return {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': config.manifest.name,
    'apple-mobile-web-app-status-bar-style': 'default'
  };
}

function buildMSAppMeta(): HtmlMetaDescriptor {
  const icons = [
    { name: 'square70x70', size: '128' },
    { name: 'square150x150', size: '270' },
    { name: 'square310x310', size: '558' },
    { name: 'wide310x150', size: '558-270' }
  ];

  const msAppMeta: HtmlMetaDescriptor = {
    'msapplication-navbutton-color': config.manifest.themeColor,
    'msapplication-TileColor': config.manifest.backgroundColor,
    'msapplication-starturl': '/',
    'msapplication-tap-highlight': 'no'
  };

  return icons.reduce((obj, icon) => {
    const name = `msapplication-${icon.name}`;
    const content = `/icons/mstile-icon-${icon.size}.png`;
    return {
      ...obj,
      [name]: content
    };
  }, msAppMeta);
}

export const meta: MetaFunction = () => {
  return {
    ...buildBaseMeta(),
    ...buildAppleAppMeta(),
    ...buildMSAppMeta(),
    ...buildMeta({ hideTitle: true })
  };
};

function buildAppleTouchStartupImageLinks(): LinkDescriptor[] {
  const images = [
    { size: '2048-2732', width: 1024, height: 1366, ratio: 2 },
    { size: '1668-2388', width: 834, height: 1194, ratio: 2 },
    { size: '1536-2048', width: 768, height: 1024, ratio: 2 },
    { size: '1668-2224', width: 834, height: 1112, ratio: 2 },
    { size: '1620-2160', width: 810, height: 1080, ratio: 2 },
    { size: '1284-2778', width: 428, height: 926, ratio: 3 },
    { size: '1170-2532', width: 390, height: 844, ratio: 3 },
    { size: '1125-2436', width: 375, height: 812, ratio: 3 },
    { size: '1242-2688', width: 414, height: 896, ratio: 3 },
    { size: '828-1792', width: 414, height: 896, ratio: 2 },
    { size: '1242-2208', width: 414, height: 736, ratio: 3 },
    { size: '750-1334', width: 375, height: 667, ratio: 2 },
    { size: '640-1136', width: 320, height: 568, ratio: 2 }
  ];

  return images.map((image) => ({
    rel: 'apple-touch-startup-image',
    href: `/icons/apple-splash-${image.size}.png`,
    media: singleLine`(device-width: ${image.width}px) and (device-height: ${image.height}px)
    and (-webkit-device-pixel-ratio: ${image.ratio}) and (orientation: portrait)`
  }));
}

function buildManifestIconLinks(): LinkDescriptor[] {
  return config.manifest.iconSizes.map((iconSize) => ({
    rel: 'icon',
    type: 'image/png',
    href: `/icons/manifest-icon-${iconSize}.maskable.png`
  }));
}

export const links: LinksFunction = () => {
  return buildLinks(
    [
      globalStylesUrl,
      { href: globalMediumStylesUrl, media: 'print, (min-width: 640px)' },
      { href: globalLargeStylesUrl, media: 'screen and (min-width: 1024px)' }
    ],
    [
      {
        rel: 'manifest',
        href: '/manifest.json'
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '196x196',
        href: '/icons/favicon-196.png'
      },
      {
        rel: 'apple-touch-icon',
        href: '/icons/apple-icon-180.png'
      },
      ...buildAppleTouchStartupImageLinks(),
      ...buildManifestIconLinks()
    ]
  );
};

type RootLoaderData = {
  ENV: WindowEnv;
};

export const loader: LoaderFunction = () => {
  const data: RootLoaderData = {
    ENV: {
      APP_URL: process.env.APP_URL ?? 'http://localhost:8003'
    }
  };

  return data;
};

type DocumentProps = {
  children: React.ReactNode;
  title?: string;
};

function Document({ children, title = defaultTitle }: DocumentProps) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
        <title>{title}</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  );
}

export default function App() {
  const data = useLoaderData<RootLoaderData>();

  return (
    <Document>
      <Outlet />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(data.ENV)}`
        }}
      />
    </Document>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  return (
    <Document
      title={`${caught.status} ${caught.statusText}`}
    >
      <div className='error-container'>
        <h1>
          {caught.status} {caught.statusText}
        </h1>
      </div>
    </Document>
  );
}

type ErrorBoundaryProps = {
  error: Error;
};

export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  return (
    <Document title='Uh-oh!'>
      <div className='error-container'>
        <h1>App Error</h1>
        <pre>{error.message}</pre>
      </div>
    </Document>
  );
}
