import { HtmlLinkDescriptor, HtmlMetaDescriptor, LinkDescriptor } from 'remix';

import config from '~/config';

function buildCanonicalUrl(pathname = '/') {
  const host = typeof window === 'undefined' ? process.env.APP_URL : window.ENV.APP_URL;
  const url = `${host}${pathname}`;
  return url;
}

export const defaultTitle = 'Remix J🤪kes';
const defaultDescription = config.manifest.description;
const defaultKeyword = 'remix, remix run, jokes, daddy jokes';
const defaultImage = 'https://remix-jokes.lol/social.png';

type BuildMetaParam = {
  title?: string;
  description?: string;
  keyword?: string;
  image?: string;
  pathname?: string;
  hideTitle?: boolean;
};

export function buildMeta({
  description = defaultDescription,
  image = defaultImage,
  keyword = defaultKeyword,
  pathname = '/',
  title = defaultTitle,
  hideTitle = false
}: BuildMetaParam = {}): HtmlMetaDescriptor {
  const metaTitle = title === defaultTitle ? title : `${title} | ${defaultTitle}`;
  const url = buildCanonicalUrl(pathname);

  return {
    ...(!hideTitle && { title: metaTitle }),
    'og:title': metaTitle,
    'twitter:title': metaTitle,
    'og:url': url,
    description,
    'og:description': description,
    'twitter:description': description,
    'og:image': image,
    'twitter:image': image,
    'twitter:card': 'summary_large_image',
    'twitter:creator': '@RofiSyahrul',
    'twitter:site': 'Remix Jokes',
    site: 'Remix Jokes',
    'og:site': 'Remix Jokes',
    keywords: keyword
  };
}

type StylesheetDescriptor = string | Omit<HtmlLinkDescriptor, 'rel'>;

export function buildLinks(
  styles: StylesheetDescriptor[] = [],
  linkDescriptors: LinkDescriptor[] = []
): LinkDescriptor[] {
  const styleDescriptors = styles.map<LinkDescriptor>((style) => {
    const rel = 'stylesheet';

    if (typeof style === 'string') {
      return {
        rel,
        href: style
      };
    }

    return { rel, ...style };
  });

  return [...linkDescriptors, ...styleDescriptors];
}
