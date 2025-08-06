/**
 * Pexels Image Service
 * Fetches relevant images from Pexels API based on project title and description
 */

export interface PexelsImageParams {
  title: string;
  description: string;
}

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

const PEXELS_API_KEY = 'tX7k2WHlVos1tTGp0kuBd2Cun7pGARfphzkoC68y93woaOjsEgJkJ4Fh';
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

export const findProjectImage = async (params: PexelsImageParams): Promise<string> => {
  try {
    // Create search query from title and description
    const searchQuery = createSearchQuery(params.title, params.description);
    
    console.log('Searching Pexels for:', searchQuery);
    
    // Search for images using Pexels API
    const imageUrl = await searchPexelsImages(searchQuery);
    
    return imageUrl;
    
  } catch (error) {
    console.error('Failed to fetch project image from Pexels:', error);
    // Return a fallback image or throw error based on requirements
    return getFallbackImage(params.title, params.description);
  }
};

const createSearchQuery = (title: string, description: string): string => {
  // Use the project title as the primary search term - this is usually the most specific
  const cleanTitle = title.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ')     // Normalize spaces
    .trim();
  
  // Extract 1-2 key nouns from description to add context
  const descriptionWords = description.toLowerCase()
    .split(' ')
    .filter(word => word.length > 4) // Only longer, more meaningful words
    .filter(word => !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'they', 'have', 'been', 'learn', 'about', 'explore', 'discover'].includes(word))
    .slice(0, 2); // Only take first 2 meaningful words
  
  // Combine title with 1-2 description words - keep it simple and focused
  const searchTerms = [cleanTitle, ...descriptionWords].join(' ').trim();
  
  return searchTerms || title; // Fallback to just title if processing fails
};

// Removed the complex extractKeywords function - no longer needed with simplified approach

const searchPexelsImages = async (query: string): Promise<string> => {
  const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`, {
    headers: {
      'Authorization': PEXELS_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
  }

  const data: PexelsResponse = await response.json();
  
  if (data.photos.length === 0) {
    throw new Error('No images found for query');
  }

  // Select a high-quality image that's appropriate for educational content
  const selectedPhoto = selectBestImage(data.photos);
  
  // Return medium-sized image URL for good quality and reasonable loading time
  return selectedPhoto.src.medium;
};

const selectBestImage = (photos: PexelsPhoto[]): PexelsPhoto => {
  // Filter images that are more likely to be educational/appropriate
  const goodPhotos = photos.filter(photo => {
    // Prefer landscape orientation images
    const isLandscape = photo.width > photo.height;
    
    // Prefer images with reasonable dimensions (not too small or extreme ratios)
    const goodDimensions = photo.width >= 640 && photo.height >= 400;
    const reasonableRatio = (photo.width / photo.height) <= 3;
    
    return isLandscape && goodDimensions && reasonableRatio;
  });
  
  // If we have good photos, pick from them, otherwise use any available photo
  const photosToChoose = goodPhotos.length > 0 ? goodPhotos : photos;
  
  // Select a random image from the first few results for variety
  const randomIndex = Math.floor(Math.random() * Math.min(photosToChoose.length, 5));
  return photosToChoose[randomIndex];
};

const getFallbackImage = (title: string, description: string): string => {
  // Provide themed fallback images based on content
  const content = `${title} ${description}`.toLowerCase();
  
  // Educational themed fallback images from Unsplash
  if (content.includes('space') || content.includes('planet') || content.includes('star')) {
    return 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&q=80';
  }
  if (content.includes('math') || content.includes('number') || content.includes('calculation')) {
    return 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80';
  }
  if (content.includes('ocean') || content.includes('marine') || content.includes('sea')) {
    return 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80';
  }
  if (content.includes('art') || content.includes('draw') || content.includes('paint')) {
    return 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&q=80';
  }
  if (content.includes('science') || content.includes('experiment')) {
    return 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80';
  }
  if (content.includes('nature') || content.includes('environment')) {
    return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80';
  }
  if (content.includes('book') || content.includes('read')) {
    return 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80';
  }
  if (content.includes('music') || content.includes('instrument')) {
    return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80';
  }
  
  // Default educational image
  return 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80';
};