import { ArrowLeft, Clock, Calendar, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSessionManager } from "@/hooks/useSessionManager";
import { SessionHistoryEntry } from "@/types/session";
import { format } from "date-fns";
import redPandaLogo from "../assets/pabu_logo.png";

export default function SessionHistoryPage() {
  const navigate = useNavigate();
  const { getSessionHistory } = useSessionManager();
  const sessionHistory = getSessionHistory();

  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const SessionCard = ({ session }: { session: SessionHistoryEntry }) => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{session.projectName}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(session.startTime, 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(session.duration)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Session Summary:</p>
            <p className="text-sm">{session.summary}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Time Period:</p>
            <p className="text-sm">
              {format(session.startTime, 'h:mm a')} - {format(session.endTime, 'h:mm a')}
            </p>
          </div>

          {session.urlsViewed.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Content Viewed ({session.urlsViewed.length} pages):
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {session.urlsViewed.map((url, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{url.title || url.url}</span>
                    </div>
                    <span className="text-muted-foreground ml-2 flex-shrink-0">
                      {formatDuration(url.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="absolute top-6 left-6">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Button>
      </div>

      {/* Centered Logo */}
      <div className="flex flex-col items-center pt-8 pb-12">
        <div className="mb-8">
          <img 
            src={redPandaLogo} 
            alt="Logo" 
            className="w-24 h-24 mx-auto"
          />
        </div>
        
        <div className="text-center">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-2">
            Session History
          </h1>
          <p className="font-inter text-xl text-muted-foreground">
            Review your learning sessions
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {sessionHistory.length > 0 ? (
          <div className="space-y-6">
            {sessionHistory.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg mb-4">
              No session history found
            </div>
            <p className="text-muted-foreground mb-8">
              Start working on a project to begin tracking your learning sessions.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Explore Projects
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}