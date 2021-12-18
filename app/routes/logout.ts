import { ActionFunction, LoaderFunction, redirect } from 'remix';

import { logout } from '~/services/session.server';

export const action: ActionFunction = ({ request }) => {
  return logout(request);
};

export const loader: LoaderFunction = () => {
  return redirect('/', { status: 308 });
};
