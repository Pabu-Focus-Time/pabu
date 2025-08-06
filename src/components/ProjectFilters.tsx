import { FilterType } from "@/types/project";
import { Star, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  projectCounts: {
    approved: number;
    unapproved: number;
    starred: number;
  };
}

export const ProjectFilters = ({ 
  activeFilter, 
  onFilterChange, 
  projectCounts 
}: ProjectFiltersProps) => {
  const filters = [
    {
      type: 'starred' as FilterType,
      label: 'Starred',
      count: projectCounts.starred
    },
    {
      type: 'approved' as FilterType,
      label: 'Approved',
      count: projectCounts.approved
    },
    {
      type: 'unapproved' as FilterType,
      label: 'Unapproved',
      count: projectCounts.unapproved
    }
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="flex gap-3">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.type;
          
          return (
            <button
              key={filter.type}
              onClick={() => onFilterChange(filter.type)}
              className={cn(
                "px-6 py-3 text-sm font-medium transition-smooth rounded-2xl border",
                isActive 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-card text-muted-foreground hover:text-foreground border-border hover:border-primary/30"
              )}
            >
              {filter.label}
              <span className={cn(
                "ml-2 px-2 py-0.5 rounded-full text-xs",
                isActive 
                  ? "bg-primary-foreground/20 text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};