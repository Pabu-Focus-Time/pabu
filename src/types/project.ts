export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  image?: string;
  isFavorite: boolean;
  isApproved: boolean;
  createdAt: Date;
}

export type FilterType = 'approved' | 'unapproved' | 'starred';

export interface ProjectFormData {
  title: string;
  shortDescription: string;
  longDescription: string;
}