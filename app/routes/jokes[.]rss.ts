import { LoaderFunction } from 'remix';

import { db } from '~/services/db.server';

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const loader: LoaderFunction = async ({ request }) => {
  const host = request.headers.get('X-Forwarded-Host') ?? request.headers.get('host');
  if (!host) {
    throw new Error('Could not determine domain URL.');
  }

  const protocol = host.includes('localhost') ? 'http' : 'https';
  const domain = `${protocol}://${host}`;
  const jokesUrl = `${domain}/jokes`;

  const jokes = await db.joke.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { jokester: { select: { username: true } } }
  });

  const jokeRssList = jokes.map((joke) =>
    `
    <item>
      <title>${joke.name}</title>
      <description>A funny joke called ${escapeHtml(joke.name)}</description>
      <author>${joke.jokester.username}</author>
      <pubDate>${joke.createdAt.toUTCString()}</pubDate>
      <link>${jokesUrl}/${joke.slug}</link>
      <guid>${jokesUrl}/${joke.slug}</guid>
    </item>
  `.trim()
  );

  const rssString = `
    <rss xmlns:blogChannel="${jokesUrl}" version="2.0">
      <channel>
        <title>Remix Jokes</title>
        <link>${jokesUrl}</link>
        <description>Some funny jokes</description>
        <language>en-us</language>
        <generator>Rofi</generator>
        <ttl>40</ttl>
        ${jokeRssList.join('\n')}
      </channel>
    </rss>
  `.trim();

  return new Response(rssString, {
    headers: {
      'Cache-Control': `public, max-age=${60 * 10}, s-maxage=${60 * 60 * 24}`,
      'Content-Type': 'application/xml',
      'Content-Length': String(Buffer.byteLength(rssString))
    }
  });
};
