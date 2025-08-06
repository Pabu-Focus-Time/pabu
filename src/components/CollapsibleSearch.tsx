import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CollapsibleSearchProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

export const CollapsibleSearch = ({ onSearch, searchQuery }: CollapsibleSearchProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    if (!searchQuery) {
      setIsExpanded(false);
    }
  };

  const handleClear = () => {
    onSearch('');
    setIsExpanded(false);
  };

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Keep expanded if there's a search query
  useEffect(() => {
    if (searchQuery) {
      setIsExpanded(true);
    }
  }, [searchQuery]);

  return (
    <div className="relative">
      {!isExpanded ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExpand}
          onMouseEnter={handleExpand}
          className="p-2 rounded-full hover:bg-muted/50 transition-all duration-200"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
        </Button>
      ) : (
        <div 
          className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-2 shadow-subtle animate-scale-in"
          onMouseLeave={handleCollapse}
        >
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            onBlur={handleCollapse}
            className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 text-sm w-64"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="p-1 h-auto rounded-full hover:bg-muted/50"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
