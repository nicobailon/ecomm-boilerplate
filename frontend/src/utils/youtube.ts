export interface YouTubeParseResult {
  isValid: boolean;
  videoId?: string;
  error?: string;
  title?: string;
}

export const parseYouTubeUrl = (url: string): YouTubeParseResult => {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is required',
    };
  }

  try {
    const urlObj = new URL(url);
    let videoId: string | null = null;

    const patterns = [
      {
        domain: ['youtube.com', 'www.youtube.com'],
        path: ['/watch'],
        param: 'v',
      },
      {
        domain: ['youtube.com', 'www.youtube.com'],
        path: ['/embed/'],
        extract: (pathname: string) => pathname.split('/embed/')[1]?.split('/')[0],
      },
      {
        domain: ['youtube.com', 'www.youtube.com'],
        path: ['/v/'],
        extract: (pathname: string) => pathname.split('/v/')[1]?.split('/')[0],
      },
      {
        domain: ['youtu.be'],
        path: ['/'],
        extract: (pathname: string) => pathname.substring(1).split('/')[0],
      },
      {
        domain: ['m.youtube.com'],
        path: ['/watch'],
        param: 'v',
      },
    ];

    for (const pattern of patterns) {
      if (pattern.domain.includes(urlObj.hostname)) {
        if (pattern.path.some(p => urlObj.pathname.startsWith(p))) {
          if (pattern.param) {
            videoId = urlObj.searchParams.get(pattern.param);
          } else if (pattern.extract) {
            videoId = pattern.extract(urlObj.pathname) || null;
          }
          
          if (videoId) break;
        }
      }
    }

    if (!videoId || !isValidVideoId(videoId)) {
      return {
        isValid: false,
        error: 'Invalid YouTube URL format',
      };
    }

    return {
      isValid: true,
      videoId,
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }
};

export const isValidVideoId = (videoId: string): boolean => {
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
};

export const getYouTubeThumbnailUrl = (videoId: string, quality: 'default' | 'hqdefault' | 'maxresdefault' = 'hqdefault'): string => {
  if (!isValidVideoId(videoId)) {
    throw new Error('Invalid video ID');
  }
  
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

export const getYouTubeEmbedUrl = (videoId: string, options: {
  autoplay?: boolean;
  mute?: boolean;
  controls?: boolean;
  start?: number;
} = {}): string => {
  if (!isValidVideoId(videoId)) {
    throw new Error('Invalid video ID');
  }
  
  const params = new URLSearchParams();
  
  if (options.autoplay) params.set('autoplay', '1');
  if (options.mute) params.set('mute', '1');
  if (options.controls === false) params.set('controls', '0');
  if (options.start) params.set('start', options.start.toString());
  
  const paramString = params.toString();
  const queryString = paramString ? `?${paramString}` : '';
  
  return `https://www.youtube.com/embed/${videoId}${queryString}`;
};

export const extractYouTubeTitle = async (videoId: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json() as { title?: string };
    return data.title ?? null;
  } catch {
    return null;
  }
};