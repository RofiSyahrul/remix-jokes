import { Joke } from '@prisma/client';
import { Link, LoaderFunction, MetaFunction, useCatch, useLoaderData } from 'remix';

import { db } from '~/services/db.server';
import { buildMeta } from '~/utils/head';

type LoaderData = {
  randomJoke: Joke;
};

export const loader: LoaderFunction = async () => {
  const totalJoke = await db.joke.count();
  const randomRowNumber = Math.floor(Math.random() * totalJoke);
  const [randomJoke] = await db.joke.findMany({
    take: 1,
    skip: randomRowNumber
  });

  if (!randomJoke) {
    throw new Response('No random joke found', {
      status: 404
    });
  }

  const data: LoaderData = { randomJoke };

  return data;
};

export const meta: MetaFunction = () => {
  return buildMeta({ title: 'Jokes collection' });
};

export default function JokesIndexRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <p>Here's a random joke:</p>
      <p>{data.randomJoke.content}</p>
      <Link to={data.randomJoke.slug}>{`"${data.randomJoke.name}" Permalink`}</Link>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <div className='error-container'>
        There are no jokes to display.
      </div>
    );
  }

  throw new Error(
    `Unexpected caught response with status: ${caught.status}`
  );
}

export function ErrorBoundary() {
  return (
    <div className='error-container'>
      I did a whoopsies.
    </div>
  );
}
