import { User } from '@prisma/client';
import {
  Form,
  Link,
  LinksFunction,
  LoaderFunction,
  Outlet,
  useLoaderData,
  useLocation
} from 'remix';

import { db } from '~/services/db.server';
import { getUser } from '~/services/session.server';
import jokesStylesUrl from '~/styles/jokes.css';
import { buildLinks } from '~/utils/head';

export const links: LinksFunction = () => {
  return buildLinks([jokesStylesUrl]);
};

type LoaderData = {
  user: User | null;
  jokes: Array<{ slug: string; name: string }>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);
  const jokes = await db.joke.findMany({
    take: 10,
    orderBy: { updatedAt: 'desc' },
    select: { slug: true, name: true }
  });

  const data: LoaderData = {
    user,
    jokes
  };

  return data;
};

type UserInfoProps = {
  username: string;
  redirectTo: string;
};

function UserInfo({ username, redirectTo }: UserInfoProps) {
  return (
    <div className='user-info'>
      <span>{`Hi ${username}`}</span>
      <Form action='/logout' method='post'>
        <input type='hidden' name='redirectTo' value={redirectTo} />
        <button type='submit' className='btn'>
          Logout
        </button>
      </Form>
    </div>
  );
}

export default function JokesRoute() {
  const data = useLoaderData<LoaderData>();
  const { pathname, search } = useLocation();
  const redirectTo = `${pathname}${search}`;

  return (
    <div className='jokes-layout'>
      <header className='jokes-header'>
        <div className='container'>
          <h1 className='home-link'>
            <Link to='/' title='Remix Jokes' aria-label='Remix Jokes'>
              <span className='logo'>🤪</span>
              <span className='logo-medium'>J🤪KES</span>
            </Link>
          </h1>
          {data.user ? (
            <UserInfo username={data.user.username} redirectTo={redirectTo} />
          ) : (
            <Link to={`/login?redirectTo=${redirectTo}`}>Login</Link>
          )}
        </div>
      </header>
      <main className='jokes-main'>
        <div className='container'>
          <div className='jokes-list'>
            <Link to='.'>Get a random joke</Link>
            <p>Here are a few more jokes to check out:</p>
            <ul>
              {data.jokes.map((joke) => (
                <li key={joke.slug}>
                  <Link to={joke.slug} prefetch='intent'>{joke.name}</Link>
                </li>
              ))}
            </ul>
            <Link to='new' className='btn'>
              Add your own
            </Link>
          </div>
          <div className='jokes-outlet'>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
