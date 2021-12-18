import { Joke } from '@prisma/client';
import { Form, Link } from 'remix';

type JokeDisplayProps = {
  joke: Pick<Joke, 'content' | 'name' | 'jokesterId'>;
  isOwner: boolean;
  canDelete?: boolean;
};

export function JokeDisplay({ joke, isOwner, canDelete = true }: JokeDisplayProps) {
  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>{joke.content}</p>
      <Link to='.'>{`${joke.name} Permalink`}</Link>
      {isOwner && (
        <Form method='post'>
          <input type='hidden' name='_method' value='delete' />
          {joke.jokesterId && <input type='hidden' name='jokesterId' value={joke.jokesterId} />}
          <button type='submit' className='btn' disabled={!canDelete}>
            Delete
          </button>
        </Form>
      )}
    </div>
  );
}
