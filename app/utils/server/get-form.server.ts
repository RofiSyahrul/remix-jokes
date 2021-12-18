type FormField<K extends string> = Record<K, FormDataEntryValue | null>;

export default async function getForm<K extends string = string>(
  request: Request
): Promise<FormField<K>> {
  const form = await request.formData();
  const keys = [...form.keys()] as K[];

  const result: FormField<K> = {} as any;

  keys.forEach((key) => {
    result[key] = form.get(key);
  });

  return result;
}
