import {
  ActionFunction,
  Form,
  Link,
  LoaderFunction,
  MetaFunction,
  redirect,
  useActionData,
  useCatch,
  useLocation
} from 'remix';

import { db } from '~/services/db.server';
import { getUserId, requireUserId } from '~/services/session.server';
import { buildMeta } from '~/utils/head';
import badRequest from '~/utils/server/bad-request.server';
import getForm from '~/utils/server/get-form.server';
import slugify from '~/utils/string/slugify';

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return {};
};

function validateJokeContent(content: string) {
  const minimumJokeContentLength = 10;
  if (content.length < minimumJokeContentLength) {
    return `Joke should be ${minimumJokeContentLength} characters or more`;
  }

  return null;
}

function validateJokeName(name: string) {
  const minimumJokeNameLength = 3;
  if (name.length < minimumJokeNameLength) {
    return `The joke's name should be ${minimumJokeNameLength} characters or more`;
  }

  return null;
}

type ActionData = {
  formError?: string;
  fieldErrors?: {
    name: string | null;
    content: string | null;
  };
  fields?: {
    name: string;
    content: string;
  };
};

type FormKey = 'jokeName' | 'jokeContent';

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const { jokeContent: content, jokeName: name } = await getForm<FormKey>(request);

  if (typeof name !== 'string' || typeof content !== 'string') {
    return badRequest<ActionData>({
      formError: `Form not submitted correctly.`
    });
  }

  const fieldErrors = {
    name: validateJokeName(name),
    content: validateJokeContent(content)
  };

  const fields = { name, content };

  if (fieldErrors.name || fieldErrors.content) {
    return badRequest<ActionData>({ fieldErrors, fields });
  }

  let slug = slugify(/new/i.test(name) ? `${name}-slug` : name);

  const jokesWithSameSlug = await db.joke.findMany({
    where: { slug },
    select: { slug: true }
  });

  if (jokesWithSameSlug.length) {
    const totalJoke = await db.joke.count();
    if (totalJoke > 0) {
      slug += `-${totalJoke + 1}`;
    }
  }

  const joke = await db.joke.create({
    data: { name, content, slug, jokesterId: userId }
  });

  return redirect(`/jokes/${joke.slug}`);
};

export const meta: MetaFunction = () => {
  return buildMeta({
    title: 'Add new joke',
    description: 'Add your own hilarious joke here 🚀 '
  });
};

export default function NewJokeRoute() {
  const actionData = useActionData<ActionData>();

  return (
    <div>
      <p>Add your own hilarious joke</p>
      <Form method='post'>
        <div>
          <label>
            {'Name: '}
            <input
              type='text'
              defaultValue={actionData?.fields?.name}
              name='jokeName'
              aria-invalid={Boolean(actionData?.fieldErrors?.name) || undefined}
              aria-describedby={actionData?.fieldErrors?.name ? 'joke-name-error' : undefined}
            />
          </label>
          {actionData?.fieldErrors?.name && (
            <p className='form-validation-error' role='alert' id='joke-name-error'>
              {actionData.fieldErrors.name}
            </p>
          )}
        </div>
        <div>
          <label>
            {'Content: '}
            <textarea
              defaultValue={actionData?.fields?.content}
              name='jokeContent'
              aria-invalid={Boolean(actionData?.fieldErrors?.content) || undefined}
              aria-describedby={actionData?.fieldErrors?.content ? 'joke-content-error' : undefined}
            />
          </label>
          {actionData?.fieldErrors?.content && (
            <p className='form-validation-error' role='alert' id='joke-content-error'>
              {actionData.fieldErrors.content}
            </p>
          )}
        </div>
        <div>
          <button type='submit' className='btn'>
            Add
          </button>
        </div>
      </Form>
    </div>
  );
}

export function CatchBoundary() {
  const { pathname, search } = useLocation();
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div className='error-container'>
        <p>You must be logged in to create a joke.</p>
        <Link to={{ pathname: '/login', search: `?redirectTo=${pathname}${search}` }}>
          Login
        </Link>
      </div>
    );
  }
}

export function ErrorBoundary() {
  return <div className='error-container'>Something unexpected went wrong. Sorry about that.</div>;
}
