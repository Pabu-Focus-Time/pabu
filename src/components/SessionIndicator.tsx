import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionManager } from "@/hooks/useSessionManager";

export const SessionIndicator = () => {
  const { 
    currentSession, 
    elapsedTime, 
    showEndSessionOption, 
    pauseSession, 
    resumeSession, 
    endSession 
  } = useSessionManager();

  if (!currentSession) return null;

  return (
    <div className="fixed top-6 right-6 bg-card border border-border/50 rounded-xl shadow-subtle p-4 z-50 min-w-[280px]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-card-foreground mb-1">
            {currentSession.projectName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {elapsedTime}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {currentSession.status === 'active' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={pauseSession}
              className="flex items-center gap-1"
            >
              <Pause className="w-3 h-3" />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={resumeSession}
              className="flex items-center gap-1"
            >
              <Play className="w-3 h-3" />
              Resume
            </Button>
          )}
          
          {(currentSession.status === 'active' || showEndSessionOption) && (
            <Button
              size="sm"
              variant="destructive"
              onClick={endSession}
              className="flex items-center gap-1"
            >
              <Square className="w-3 h-3" />
              End
            </Button>
          )}
        </div>
      </div>
      
      {currentSession.status === 'paused' && (
        <div className="mt-2 text-xs text-muted-foreground">
          Session paused {showEndSessionOption && '• Idle for 5+ minutes'}
        </div>
      )}
    </div>
  );
};