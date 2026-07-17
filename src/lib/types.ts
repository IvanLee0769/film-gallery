export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  hotspot?: { x: number; y: number; width: number; height: number };
}

export interface Photo {
  _key: string;
  image: SanityImage;
  caption?: string;
  order: number;
  aspectRatio?: number;
}

export interface Roll {
  _id: string;
  rollNumber: string;
  title: string;
  slug: { current: string };
  filmType?: string;
  camera?: string;
  lens?: string;
  iso?: string;
  shotDate?: string;
  endDate?: string;
  developer?: string;
  scanner?: string;
  rating?: number;
  coverImage: SanityImage;
  photos: Photo[];
  notes?: any[];
  enableComments: boolean;
  publishedAt: string;
}

export interface RollSummary {
  _id: string;
  title: string;
  slug: { current: string };
  rollNumber: string;
  coverImage: SanityImage;
  filmType?: string;
  camera?: string;
  shotDate?: string;
  photos: Pick<Photo, '_key' | 'image' | 'order'>[];
  notes?: any[];
}

export interface Comment {
  _id: string;
  nickname: string;
  content: string;
  createdAt: string;
  photoKey: string;
}
