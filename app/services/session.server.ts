import bcrypt from 'bcrypt';
import { createCookieSessionStorage, redirect } from 'remix';

import badRequest from '~/utils/server/bad-request.server';
import getForm from '~/utils/server/get-form.server';

import { db } from './db.server';

type LoginForm = {
  username: string;
  password: string;
};

export async function register({ username, password }: LoginForm) {
  const saltRound = 10;
  const passwordHash = await bcrypt.hash(password, saltRound);
  return db.user.create({
    data: { username, passwordHash }
  });
}

export async function login({ username, password }: LoginForm) {
  const user = await db.user.findUnique({
    where: { username }
  });

  if (!user) return null;

  const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isCorrectPassword) return null;

  return user;
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set');
}

const storage = createCookieSessionStorage({
  cookie: {
    name: 'RJ_session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true
  }
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set('userId', userId);
  const cookie = await storage.commitSession(session);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': cookie
    }
  });
}

export async function getUserSession(request: Request) {
  const session = await storage.getSession(request.headers.get('Cookie'));
  return session;
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get('userId');
  if (!userId || typeof userId !== 'string') return null;
  return userId;
}

export async function requireUserId(request: Request, redirectTo?: string) {
  const userId = await getUserId(request);
  if (userId) return userId;

  let redirectToQS: string = redirectTo || '';
  if (!redirectToQS) {
    const { pathname, search } = new URL(request.url);
    redirectToQS = `${pathname}${search}`;
  }

  const searchParams = new URLSearchParams([['redirectTo', redirectToQS]]);

  throw redirect(`/login?${searchParams}`);
}

export async function logout(request: Request) {
  const formField = await getForm<'redirectTo'>(request);
  const redirectTo = formField.redirectTo ?? request.url;
  if (typeof redirectTo !== 'string') {
    return badRequest({ formError: `Form not submitted correctly.` });
  }

  const session = await getUserSession(request);
  const cookie = await storage.destroySession(session);
  return redirect(redirectTo || '/login', {
    headers: {
      'Set-Cookie': cookie
    }
  });
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: userId }
    });
    if (!user) throw logout(request);
    return user;
  } catch {
    throw logout(request);
  }
}
