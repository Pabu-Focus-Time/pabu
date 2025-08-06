import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const SessionHistoryButton = () => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <Link to="/session-history">
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-card border border-border/50 shadow-subtle hover:shadow-hover"
        >
          <History className="w-4 h-4" />
          Session History
        </Button>
      </Link>
    </div>
  );
};