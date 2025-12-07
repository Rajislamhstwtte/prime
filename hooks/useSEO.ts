
import { useEffect } from 'react';
import { ContentItem } from '../types';

export const useSEO = (content?: ContentItem | null) => {
  useEffect(() => {
    if (!content) {
      document.title = "Cineflix - Stream Movies & TV Shows";
      updateMeta('description', "Cineflix is a media discovery platform. Browse movies, view metadata, and manage watchlists.");
      return;
    }

    const title = `${content.title} (${content.release_date?.split('-')[0] || 'N/A'}) - Cineflix`;
    const description = content.overview?.substring(0, 160) + '...' || "Watch this amazing title on Cineflix.";
    const image = content.backdrop_path || content.poster_path;

    document.title = title;
    
    // Standard Meta
    updateMeta('description', description);
    
    // Open Graph
    updateMeta('og:title', title);
    updateMeta('og:description', description);
    updateMeta('og:image', image);
    updateMeta('og:url', window.location.href);
    
    // Twitter
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', image);

    // JSON-LD Structured Data
    const schema = {
        "@context": "https://schema.org",
        "@type": content.media_type === 'movie' ? "Movie" : "TVSeries",
        "name": content.title,
        "image": image,
        "description": content.overview,
        "datePublished": content.release_date,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": content.vote_average,
            "bestRating": "10",
            "ratingCount": "1000" // Placeholder
        }
    };
    
    const scriptTag = document.getElementById('ld-json');
    if (scriptTag) {
        scriptTag.textContent = JSON.stringify(schema);
    } else {
        const newScript = document.createElement('script');
        newScript.id = 'ld-json';
        newScript.type = 'application/ld+json';
        newScript.textContent = JSON.stringify(schema);
        document.head.appendChild(newScript);
    }

  }, [content]);

  const updateMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!element) {
          element = document.createElement('meta');
          if (name.startsWith('og:')) {
              element.setAttribute('property', name);
          } else {
              element.setAttribute('name', name);
          }
          document.head.appendChild(element);
      }
      element.setAttribute('content', content);
  }
};
