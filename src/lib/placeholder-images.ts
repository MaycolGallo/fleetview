import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

// It is okay for this to be empty, it is populated by another function
export const PlaceHolderImages: ImagePlaceholder[] = data as any;
