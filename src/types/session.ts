export interface SessionData {
  id: string;
  projectName: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  isPaused: boolean;
  pausedAt?: Date;
  totalPauseDuration: number; // in milliseconds
  urlHistory: SessionUrl[];
  status: 'active' | 'paused' | 'ended';
  // Project descriptions for Chrome extension integration
  projectShortDescription?: string;
  projectLongDescription?: string;
}

export interface SessionUrl {
  url: string;
  title: string;
  timestamp: Date;
  duration: number; // time spent on this URL in milliseconds
}

export interface SessionHistoryEntry {
  id: string;
  projectName: string;
  projectId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // total active duration in milliseconds
  urlsViewed: SessionUrl[];
  summary: string;
}