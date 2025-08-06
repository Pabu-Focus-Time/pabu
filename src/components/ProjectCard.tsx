import { Star } from "lucide-react";
import { Project } from "@/types/project";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  onToggleFavorite: (id: string) => void;
  onProjectClick: (project: Project) => void;
  showFavoriteToggle?: boolean;
}

export const ProjectCard = ({ 
  project, 
  onToggleFavorite, 
  onProjectClick,
  showFavoriteToggle = true 
}: ProjectCardProps) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(project.id);
  };

  // Truncate description to fixed character limit with fade
  const truncatedDescription = project.shortDescription.length > 80 
    ? project.shortDescription.substring(0, 80) + "..."
    : project.shortDescription;

  // Show star toggle only for approved projects or if already favorited
  const canToggleStar = showFavoriteToggle && (project.isApproved || project.isFavorite);

  return (
    <div 
      className="group relative bg-card rounded-2xl shadow-subtle hover:shadow-hover 
                 hover:-translate-y-0.5 transition-smooth cursor-pointer 
                 animate-slide-up border border-border/50 h-80 w-full flex flex-col"
      onClick={() => onProjectClick(project)}
    >
      {/* Image - larger portion */}
      <div className="aspect-[3/2] rounded-t-2xl overflow-hidden bg-muted">
        {project.image ? (
          <img 
            src={project.image} 
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
          />
        ) : (
          <div className="w-full h-full bg-gradient-primary opacity-20 flex items-center justify-center">
            <span className="text-primary font-medium text-sm">No Image</span>
          </div>
        )}
      </div>

      {/* Content - fixed height for uniformity */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg text-card-foreground line-clamp-1 font-inter">
            {project.title}
          </h3>
          {canToggleStar && (
            <button
              onClick={handleFavoriteClick}
              className={cn(
                "p-1 rounded-full transition-smooth hover:scale-110 flex-shrink-0",
                project.isFavorite 
                  ? "text-[#FFD166] hover:text-[#FFD166]/80" 
                  : "text-muted-foreground hover:text-[#FFD166]"
              )}
            >
              <Star 
                className={cn(
                  "w-5 h-5", 
                  project.isFavorite && "fill-current"
                )} 
              />
            </button>
          )}
        </div>
        
        {/* Fixed height container for 2 lines of description */}
        <div className="relative h-10 overflow-hidden">
          <p className="text-muted-foreground text-sm leading-5 font-inter">
            {project.shortDescription}
          </p>
          {project.shortDescription.length > 100 && (
            <div className="absolute bottom-0 right-0 w-8 h-5 bg-gradient-to-l from-card to-transparent"></div>
          )}
        </div>
      </div>

      {/* Approval status indicator - only for unapproved */}
      {!project.isApproved && (
        <div className="absolute top-3 left-3 bg-accent text-accent-foreground 
                        px-3 py-1 rounded-full text-xs font-medium">
          Pending
        </div>
      )}
    </div>
  );
};