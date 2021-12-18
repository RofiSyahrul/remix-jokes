import { PrismaClient, Prisma } from '@prisma/client';
import { genSalt, hash } from 'bcrypt';

import { singleLine } from '../app/utils/string';
import slugify from '../app/utils/string/slugify';

async function getUser(): Promise<Prisma.UserCreateInput> {
  try {
    const saltRound = 10;
    const salt = await genSalt(saltRound);
    const password = process.env.SEED_PASSWORD ?? '';
    const passwordHash = await hash(password, salt);
    return {
      passwordHash,
      username: 'rofi'
    };
  } catch (error) {
    error.message = `getUser ERROR: ${error.message}`;
    throw error;
  }
}

type CreatedJoke = Omit<Prisma.JokeCreateInput, 'jokesterId' | 'jokester'>;

function getJokes(): CreatedJoke[] {
  // shout-out to https://icanhazdadjoke.com/

  const jokeList: Array<Omit<CreatedJoke, 'slug'>> = [
    {
      name: 'Road worker',
      content: singleLine`I never wanted to believe that my Dad was stealing
      from his job as a road worker. But when I got home, all the signs were there.`
    },
    {
      name: 'Frisbee',
      content: `I was wondering why the frisbee was getting bigger, then it hit me.`
    },
    {
      name: 'Trees',
      content: `Why do trees seem suspicious on sunny days? Dunno, they're just a bit shady.`
    },
    {
      name: 'Skeletons',
      content: `Why don't skeletons ride roller coasters? They don't have the stomach for it.`
    },
    {
      name: 'Hippos',
      content: `Why don't you find hippopotamuses hiding in trees? They're really good at it.`
    },
    {
      name: 'Dinner',
      content: `What did one plate say to the other plate? Dinner is on me!`
    },
    {
      name: 'Elevator',
      content: singleLine`My first time using an elevator was an uplifting experience.
      The second time let me down.`
    }
  ];

  return jokeList.map((joke) => ({
    ...joke,
    slug: slugify(joke.name)
  }));
}

const db = new PrismaClient();

async function seed() {
  try {
    const user = await db.user.create({
      data: await getUser()
    });

    await Promise.all(
      getJokes().map((joke) => {
        return db.joke.create({
          data: { jokesterId: user.id, ...joke }
        });
      })
    );
  } catch (error) {
    console.log('ERROR', error);
    process.exit(1);
  }
}

seed();
