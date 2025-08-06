import React from 'react';

interface LinkRendererProps {
  text: string;
  className?: string;
}

export const LinkRenderer: React.FC<LinkRendererProps> = ({ text, className = '' }) => {
  // Regex to match URLs (http, https, www, or common domains)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s]+\.[^\s]{2,})/g;
  
  const parts = text.split(urlRegex);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          // Clean up the URL
          let url = part;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          
          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-6 h-6 mx-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-full border-0 transition-all duration-200 no-underline hover:scale-110 cursor-pointer"
              title={`Open: ${part}`}
              onClick={(e) => {
                e.stopPropagation();
                // For Chrome extensions, we might want to open in new tab
                if (chrome?.tabs) {
                  e.preventDefault();
                  chrome.tabs.create({ url });
                }
              }}
            >
              🔗
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}; 