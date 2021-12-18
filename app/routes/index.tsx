import { Link, LinksFunction } from 'remix';

import stylesUrl from '~/styles/index.css';
import { buildLinks } from '~/utils/head';

export const links: LinksFunction = () => {
  return buildLinks([stylesUrl]);
};

export default function IndexRoute() {
  return (
    <div className='container'>
      <div className='content'>
        <h1>
          Remix <span>J🤪kes!</span>
        </h1>
        <nav>
          <ul>
            <li>
              <Link to='jokes'>Read Jokes</Link>
            </li>
            <li>
              <Link to='jokes.rss' reloadDocument>RSS</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
