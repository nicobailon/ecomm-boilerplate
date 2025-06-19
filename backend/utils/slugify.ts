import slugifyModule from 'slugify';

const slugify = slugifyModule as unknown as (text: string, options?: { lower?: boolean; strict?: boolean; trim?: boolean }) => string;

export const generateSlug = (text: string): string => {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
};

export const generateUniqueSlug = async (
  text: string,
  checkExistence: (slug: string) => Promise<boolean>,
): Promise<string> => {
  const baseSlug = generateSlug(text);
  let slug = baseSlug;
  let counter = 1;

  while (await checkExistence(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};