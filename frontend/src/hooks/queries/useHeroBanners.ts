import { trpc } from '../../lib/trpc';

export const useFeaturedCollections = () => {
  return trpc.collection.getFeaturedCollections.useQuery();
};

export const useUpdateHeroContent = () => {
  return trpc.collection.updateHeroContent.useMutation();
};