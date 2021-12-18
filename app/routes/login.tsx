import {
  ActionFunction,
  Form,
  Link,
  LinksFunction,
  MetaFunction,
  useActionData,
  useSearchParams
} from 'remix';

import { db } from '~/services/db.server';
import { createUserSession, login, register } from '~/services/session.server';
import stylesUrl from '~/styles/login.css';
import { buildLinks, buildMeta } from '~/utils/head';
import badRequest from '~/utils/server/bad-request.server';
import getForm from '~/utils/server/get-form.server';

export const links: LinksFunction = () => {
  return buildLinks([stylesUrl]);
};

function validateUsername(username: unknown) {
  const minimumUsernameLength = 3;
  if (typeof username !== 'string' || username.length < minimumUsernameLength) {
    return `Username must be at least ${minimumUsernameLength} characters long`;
  }

  const invalidUserNameRegExp = /[^a-zA-Z0-9_]+/g;
  if (invalidUserNameRegExp.test(username)) {
    return `You only could use alphanumeric and underscore as your username`;
  }

  return null;
}

function validatePassword(password: unknown) {
  const minimumPasswordLength = 6;
  if (typeof password !== 'string' || password.length < minimumPasswordLength) {
    return `Passwords must be at least ${minimumPasswordLength} characters long`;
  }

  return null;
}

type ActionData = {
  formError?: string;
  fieldErrors?: {
    username: string | null;
    password: string | null;
  };
  fields?: {
    loginType: string;
    username: string;
    password: string;
  };
};

type FormKey = 'loginType' | 'username' | 'password' | 'redirectTo';

export const action: ActionFunction = async ({ request }) => {
  const formField = await getForm<FormKey>(request);
  const { loginType, username, password } = formField;
  const redirectTo = formField.redirectTo || '/jokes';

  if (
    typeof loginType !== 'string' ||
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    typeof redirectTo !== 'string'
  ) {
    return badRequest<ActionData>({
      formError: `Form not submitted correctly.`
    });
  }

  const fields = { loginType, username, password };
  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password)
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest<ActionData>({ fieldErrors, fields });
  }

  switch (loginType) {
    case 'login': {
      const user = await login({ username, password });
      if (!user) {
        return badRequest<ActionData>({
          fields,
          formError: 'Username or password combination is incorrect'
        });
      }
      return createUserSession(user.id, redirectTo);
    }
    case 'register': {
      const userExists = await db.user.findFirst({
        where: { username }
      });
      if (userExists) {
        return badRequest<ActionData>({
          fields,
          formError: `User with username ${username} already exists`
        });
      }

      const user = await register({ username, password });
      if (!user) {
        return badRequest<ActionData>({
          fields,
          formError: `Something went wrong trying to create a new user.`
        });
      }

      return createUserSession(user.id, redirectTo);
    }
    default: {
      return badRequest<ActionData>({
        fields,
        formError: `Login type invalid`
      });
    }
  }
};

export const meta: MetaFunction = (ctx) => {
  const data = ctx.data as ActionData;

  return buildMeta({
    title: data?.fields?.loginType === 'register' ? 'Register' : 'Login'
  });
};

export default function Login() {
  const actionData = useActionData<ActionData>();
  const [searchParams] = useSearchParams();

  return (
    <div className='container'>
      <div className='content' data-light=''>
        <h1>Login</h1>
        <Form
          method='post'
          aria-describedby={actionData?.formError ? 'form-error-message' : undefined}
        >
          <input
            type='hidden'
            name='redirectTo'
            value={searchParams.get('redirectTo') ?? undefined}
          />
          <fieldset>
            <legend className='sr-only'>Login or Register?</legend>
            <label>
              <input
                type='radio'
                name='loginType'
                value='login'
                defaultChecked={
                  !actionData?.fields?.loginType || actionData?.fields?.loginType === 'login'
                }
              />
              {' Login'}
            </label>
            <label>
              <input
                type='radio'
                name='loginType'
                value='register'
                defaultChecked={actionData?.fields?.loginType === 'register'}
              />
              {' Register'}
            </label>
          </fieldset>
          <div>
            <label htmlFor='username-input'>Username</label>
            <input
              type='text'
              id='username-input'
              name='username'
              defaultValue={actionData?.fields?.username}
              aria-invalid={Boolean(actionData?.fieldErrors?.username)}
              aria-describedby={actionData?.fieldErrors?.username ? 'username-error' : undefined}
            />
            {actionData?.fieldErrors?.username && (
              <p className='form-validation-error' role='alert' id='username-error'>
                {actionData.fieldErrors.username}
              </p>
            )}
          </div>
          <div>
            <label htmlFor='password-input'>Password</label>
            <input
              id='password-input'
              name='password'
              type='password'
              defaultValue={actionData?.fields?.password}
              aria-invalid={Boolean(actionData?.fieldErrors?.password) || undefined}
              aria-describedby={actionData?.fieldErrors?.password ? 'password-error' : undefined}
            />
            {actionData?.fieldErrors?.password && (
              <p className='form-validation-error' role='alert' id='password-error'>
                {actionData.fieldErrors.password}
              </p>
            )}
          </div>
          <div id='form-error-message'>
            {actionData?.formError && (
              <p className='form-validation-error' role='alert'>
                {actionData?.formError}
              </p>
            )}
          </div>
          <button type='submit' className='btn'>
            Submit
          </button>
        </Form>
      </div>
      <div className='links'>
        <ul>
          <li>
            <Link to='/'>Home</Link>
          </li>
          <li>
            <Link to='/jokes'>Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
