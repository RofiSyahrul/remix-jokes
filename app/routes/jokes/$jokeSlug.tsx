import { Joke } from '@prisma/client';
import {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
  redirect,
  useCatch,
  useLoaderData,
  useParams
} from 'remix';

import { JokeDisplay } from '~/components/joke';
import { db } from '~/services/db.server';
import { getUserId, requireUserId } from '~/services/session.server';
import { buildMeta } from '~/utils/head';
import getForm from '~/utils/server/get-form.server';

type LoaderData = {
  joke: Joke;
  isOwner: boolean;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const { jokeSlug } = params;

  const joke = await db.joke.findUnique({
    where: { slug: jokeSlug }
  });

  if (!joke) {
    throw new Response('What a joke! Not found.', {
      status: 404
    });
  }

  const userId = await getUserId(request);

  const data: LoaderData = { joke, isOwner: userId === joke.jokesterId };

  return data;
};

export const meta: MetaFunction = (args) => {
  const data = args.data as LoaderData;

  if (!data) {
    return buildMeta({ title: 'No joke', description: 'No joke found' });
  }

  return buildMeta({
    title: data.joke.name ?? undefined,
    description: `Enjoy the "${data.joke.name}" joke and much more`
  });
};

type FormKey = '_method' | 'jokesterId';

export const action: ActionFunction = async ({ request, params }) => {
  const formField = await getForm<FormKey>(request);
  if (formField._method !== 'delete') return null;

  const { jokesterId } = formField;
  const userId = await requireUserId(request);

  if (jokesterId !== userId) {
    throw new Response(`Pssh, nice try. That's not your joke`, { status: 401 });
  }

  await db.joke.delete({ where: { slug: params.jokeSlug } });
  return redirect('/jokes');
};

export default function JokeRoute() {
  const data = useLoaderData<LoaderData>();

  return <JokeDisplay joke={data.joke} isOwner={data.isOwner} />;
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

  switch (caught.status) {
    case 404: {
      return <div className='error-container'>Huh? What the heck is "{params.jokeSlug}"?</div>;
    }
    case 401: {
      return <div className='error-container'>Sorry, but {params.jokeSlug} is not your joke.</div>;
    }
    default: {
      throw new Error(`Unhandled error: ${caught.status}`);
    }
  }
}

export function ErrorBoundary() {
  const { jokeSlug } = useParams();
  return (
    <div className='error-container'>
      {`There was an error loading joke by the slug ${jokeSlug}. Sorry.`}
    </div>
  );
}
