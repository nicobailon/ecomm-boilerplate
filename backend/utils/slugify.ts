import * as slugifyModule from 'slugify';

// Handle both default and named exports
const slugify = (slugifyModule as any).default || slugifyModule;

export const generateSlug = (text: string): string => {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
};

export const generateUniqueSlug = async (
  text: string,
  checkExistence: (slug: string) => Promise<boolean>
): Promise<string> => {
  let baseSlug = generateSlug(text);
  let slug = baseSlug;
  let counter = 1;

  while (await checkExistence(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};