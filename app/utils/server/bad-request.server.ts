import { json } from 'remix';

export default function badRequest<T>(data: T) {
  return json(data, { status: 400 });
}
