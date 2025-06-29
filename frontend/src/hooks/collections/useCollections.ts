import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { TRPCClientError } from '@trpc/client';
import type { CollectionListResponse } from '@/types';
import type { AppRouter } from '@/lib/trpc';

export const useListCollections = (params?: {
  userId?: string;
  isPublic?: boolean;
  limit?: number;
  cursor?: string;
}) => {
  return trpc.collection.list.useQuery({
    userId: params?.userId,
    isPublic: params?.isPublic,
    limit: params?.limit ?? 20,
    cursor: params?.cursor,
  });
};

export const useAdminCollections = (params?: {
  limit?: number;
  cursor?: string;
  page?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'productCount';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  isPublic?: boolean;
}) => {
  return trpc.collection.adminCollections.useQuery({
    limit: params?.limit ?? 20,
    cursor: params?.cursor,
    page: params?.page,
    sortBy: params?.sortBy,
    sortOrder: params?.sortOrder,
    search: params?.search,
    isPublic: params?.isPublic,
  });
};

export const useMyCollections = (params?: {
  limit?: number;
  cursor?: string;
}) => {
  return trpc.collection.myCollections.useQuery({
    limit: params?.limit ?? 20,
    cursor: params?.cursor,
  });
};

export const useCollectionById = (id: string) => {
  return trpc.collection.getById.useQuery(
    { id },
    {
      enabled: !!id,
    },
  );
};

export const useCollectionBySlug = (slug: string) => {
  return trpc.collection.getBySlug.useQuery(
    { slug },
    {
      enabled: !!slug,
    },
  );
};

export const useCreateCollection = () => {
  const utils = trpc.useContext();

  return trpc.collection.create.useMutation({
    onSuccess: () => {
      void utils.collection.myCollections.invalidate();
      void utils.collection.list.invalidate();
      toast.success('Collection created successfully');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to create collection');
    },
  });
};

export const useUpdateCollection = () => {
  const utils = trpc.useContext();

  return trpc.collection.update.useMutation({
    onSuccess: (updatedCollection, variables) => {
      void utils.collection.getById.invalidate({ id: variables.id });
      void utils.collection.getBySlug.invalidate({ slug: updatedCollection.slug });
      void utils.collection.myCollections.invalidate();
      void utils.collection.list.invalidate();
      toast.success('Collection updated successfully');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to update collection');
    },
  });
};

export const useDeleteCollection = () => {
  const utils = trpc.useContext();

  return trpc.collection.delete.useMutation({
    onSuccess: () => {
      void utils.collection.myCollections.invalidate();
      void utils.collection.list.invalidate();
      toast.success('Collection deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to delete collection');
    },
  });
};

export const useAddProductsToCollection = () => {
  const utils = trpc.useContext();

  return trpc.collection.addProducts.useMutation({
    onSuccess: (updatedCollection, variables) => {
      void utils.collection.getById.invalidate({ id: variables.collectionId });
      void utils.collection.getBySlug.invalidate({ slug: updatedCollection.slug });
      toast.success('Products added to collection');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to add products to collection');
    },
  });
};

export const useRemoveProductsFromCollection = () => {
  const utils = trpc.useContext();

  return trpc.collection.removeProducts.useMutation({
    onSuccess: (updatedCollection, variables) => {
      void utils.collection.getById.invalidate({ id: variables.collectionId });
      void utils.collection.getBySlug.invalidate({ slug: updatedCollection.slug });
      toast.success('Products removed from collection');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to remove products from collection');
    },
  });
};

export const useSetProductsForCollection = () => {
  const utils = trpc.useContext();

  return trpc.collection.setProducts.useMutation({
    onSuccess: (updatedCollection, variables) => {
      void utils.collection.getById.invalidate({ id: variables.collectionId });
      void utils.collection.getBySlug.invalidate({ slug: updatedCollection.slug });
      void utils.collection.myCollections.invalidate();
      void utils.collection.list.invalidate();
      toast.success('Collection products updated successfully');
    },
    onError: (error) => {
      toast.error(error.message ?? 'Failed to update collection products');
    },
  });
};

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'data' in error) {
    const trpcError = error as TRPCClientError<AppRouter>;
    const data = trpcError.data as { code?: string; message?: string } | undefined;
    const code = data?.code;
    const message = data?.message;
    
    switch (code) {
      case 'CONFLICT':
        return 'A collection with this name already exists';
      case 'TOO_MANY_REQUESTS':
        return 'Too many requests. Please wait a moment.';
      case 'UNAUTHORIZED':
        return 'You need to be logged in to create collections';
      case 'BAD_REQUEST':
        return message ?? 'Invalid collection data';
      default:
        return 'Failed to create collection. Please try again.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export const useQuickCreateCollection = () => {
  const queryClient = useQueryClient();
  
  return trpc.collection.quickCreate.useMutation({
    onSuccess: (newCollection) => {
      queryClient.setQueryData(
        ['collection', 'list'],
        (oldData: CollectionListResponse | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            collections: [...oldData.collections, newCollection],
          };
        },
      );
      
      toast.success(`Collection "${newCollection.name}" created`);
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      toast.error(message, {
        action: error.data?.code === 'TOO_MANY_REQUESTS' ? undefined : {
          label: 'Retry',
          onClick: () => {
            // Retry logic would be implemented here
          },
        },
      });
    },
  });
};

export const useCheckCollectionAvailability = () => {
  const utils = trpc.useContext();

  const checkAvailability = useCallback(async (name: string) => {
    const result = await utils.collection.checkAvailability.fetch({ name });
    return result;
  }, [utils]);

  return { checkAvailability };
};

// Admin-specific mutation hooks
export const useAdminUpdateCollection = () => {
  const queryClient = useQueryClient();

  return trpc.collection.adminUpdateCollection.useMutation({
    onSuccess: (updatedCollection) => {
      // Update admin collections cache
      queryClient.setQueryData(
        [['collection', 'adminCollections'], { type: 'query' }],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            collections: oldData.collections.map((collection: any) =>
              collection._id === updatedCollection._id ? updatedCollection : collection
            ),
          };
        },
      );

      // Also update individual collection cache
      queryClient.setQueryData(
        [['collection', 'getById'], { input: { id: updatedCollection._id }, type: 'query' }],
        updatedCollection,
      );

      toast.success(`Collection "${updatedCollection.name}" updated`);
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      toast.error(message);
    },
  });
};

export const useAdminDeleteCollection = () => {
  const queryClient = useQueryClient();

  return trpc.collection.adminDeleteCollection.useMutation({
    onSuccess: (_, variables) => {
      // Remove from admin collections cache
      queryClient.setQueryData(
        [['collection', 'adminCollections'], { type: 'query' }],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            collections: oldData.collections.filter((collection: any) => collection._id !== variables.id),
          };
        },
      );

      // Remove individual collection cache
      queryClient.removeQueries({
        queryKey: [['collection', 'getById'], { input: { id: variables.id }, type: 'query' }],
      });

      toast.success('Collection deleted successfully');
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      toast.error(message);
    },
  });
};