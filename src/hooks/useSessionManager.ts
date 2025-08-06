import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionData, SessionHistoryEntry, SessionUrl } from '@/types/session';
import { Project } from '@/types/project';
import { EmailService } from '@/services/emailService';
import { SettingsStorage } from '@/utils/settingsStorage';

const SESSION_STORAGE_KEY = 'session_history';
const ACTIVE_SESSION_KEY = 'active_session';
const PAUSE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const useSessionManager = () => {
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showEndSessionOption, setShowEndSessionOption] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUrlRef = useRef<string>('');
  const urlStartTimeRef = useRef<Date | null>(null);

  // Load active session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (savedSession) {
      const session: SessionData = JSON.parse(savedSession);
      session.startTime = new Date(session.startTime);
      if (session.pausedAt) {
        session.pausedAt = new Date(session.pausedAt);
      }
      session.urlHistory = session.urlHistory.map(url => ({
        ...url,
        timestamp: new Date(url.timestamp)
      }));
      setCurrentSession(session);
    }
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    if (currentSession && currentSession.status === 'active') {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsed = now.getTime() - currentSession.startTime.getTime() - currentSession.totalPauseDuration;
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentSession]);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (currentSession) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(currentSession));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, [currentSession]);

  // Track URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      if (currentSession && currentSession.status === 'active') {
        const currentUrl = window.location.href;
        const currentTitle = document.title;
        
        // Save duration of previous URL
        if (lastUrlRef.current && urlStartTimeRef.current) {
          const duration = new Date().getTime() - urlStartTimeRef.current.getTime();
          updateUrlDuration(lastUrlRef.current, duration);
        }
        
        // Start tracking new URL
        if (currentUrl !== lastUrlRef.current) {
          addUrlToHistory(currentUrl, currentTitle);
          lastUrlRef.current = currentUrl;
          urlStartTimeRef.current = new Date();
        }
      }
    };

    // Track initial URL
    if (currentSession && currentSession.status === 'active') {
      const currentUrl = window.location.href;
      const currentTitle = document.title;
      if (currentUrl !== lastUrlRef.current) {
        addUrlToHistory(currentUrl, currentTitle);
        lastUrlRef.current = currentUrl;
        urlStartTimeRef.current = new Date();
      }
    }

    // Listen for navigation changes
    window.addEventListener('popstate', handleLocationChange);
    
    // For React Router, also listen to pushstate/replacestate
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleLocationChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [currentSession]);

  const startSession = useCallback((project: Project) => {
    if (currentSession) {
      endSession();
    }

    const newSession: SessionData = {
      id: Date.now().toString(),
      projectName: project.title,
      projectId: project.id,
      startTime: new Date(),
      isPaused: false,
      totalPauseDuration: 0,
      urlHistory: [],
      status: 'active',
      // Store project descriptions in session for later use
      projectShortDescription: project.shortDescription,
      projectLongDescription: project.longDescription
    };

    setCurrentSession(newSession);
    setElapsedTime(0);
    setShowEndSessionOption(false);
    
    // Track initial URL
    const currentUrl = window.location.href;
    const currentTitle = document.title;
    lastUrlRef.current = currentUrl;
    urlStartTimeRef.current = new Date();

    // Notify Chrome extension background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const projectData = {
        id: project.id,
        name: project.title,
        type: 'custom', // Default type since Project doesn't have type field
        description: project.shortDescription,
        shortDescription: project.shortDescription,
        longDescription: project.longDescription,
        isActive: true
      };
      
      console.log('🚀 Sending project data to extension:', projectData);
      
      chrome.runtime.sendMessage({
        action: 'projectActivated',
        project: projectData
      }).catch((error) => {
        console.log('Failed to notify extension background script:', error);
      });
    }
  }, [currentSession]);

  const pauseSession = useCallback(() => {
    if (!currentSession || currentSession.status !== 'active') return;

    // Save duration of current URL
    if (lastUrlRef.current && urlStartTimeRef.current) {
      const duration = new Date().getTime() - urlStartTimeRef.current.getTime();
      updateUrlDuration(lastUrlRef.current, duration);
      urlStartTimeRef.current = null;
    }

    const updatedSession: SessionData = {
      ...currentSession,
      status: 'paused',
      isPaused: true,
      pausedAt: new Date()
    };

    setCurrentSession(updatedSession);

    // Start timeout for showing end session option
    pauseTimeoutRef.current = setTimeout(() => {
      setShowEndSessionOption(true);
    }, PAUSE_TIMEOUT_MS);

    // Notify Chrome extension background script (pause = deactivate monitoring)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: 'projectDeactivated'
      }).catch((error) => {
        console.log('Failed to notify extension background script:', error);
      });
    }
  }, [currentSession]);

  const resumeSession = useCallback(() => {
    if (!currentSession || currentSession.status !== 'paused') return;

    const now = new Date();
    const pauseDuration = currentSession.pausedAt
      ? now.getTime() - currentSession.pausedAt.getTime()
      : 0;

    const updatedSession: SessionData = {
      ...currentSession,
      status: 'active',
      isPaused: false,
      pausedAt: undefined,
      totalPauseDuration: currentSession.totalPauseDuration + pauseDuration
    };

    setCurrentSession(updatedSession);
    setShowEndSessionOption(false);
    
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }

    // Resume URL tracking
    const currentUrl = window.location.href;
    lastUrlRef.current = currentUrl;
    urlStartTimeRef.current = new Date();

    // Notify Chrome extension background script (resume = reactivate monitoring)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      // Get project info from current session to reactivate
      chrome.runtime.sendMessage({
        action: 'projectActivated',
        project: {
          id: currentSession.projectId,
          name: currentSession.projectName,
          type: 'custom', // We don't have type in session, default to custom
          description: currentSession.projectShortDescription || '',
          shortDescription: currentSession.projectShortDescription || '',
          longDescription: currentSession.projectLongDescription || '',
          isActive: true
        }
      }).catch((error) => {
        console.log('Failed to notify extension background script:', error);
      });
    }
  }, [currentSession]);

  const endSession = useCallback(async () => {
    if (!currentSession) return;

    // Save duration of current URL
    if (lastUrlRef.current && urlStartTimeRef.current) {
      const duration = new Date().getTime() - urlStartTimeRef.current.getTime();
      updateUrlDuration(lastUrlRef.current, duration);
    }

    const endTime = new Date();
    const totalDuration = endTime.getTime() - currentSession.startTime.getTime() - currentSession.totalPauseDuration;

    // Generate summary
    const summary = generateSessionSummary(currentSession.urlHistory);

    const historyEntry: SessionHistoryEntry = {
      id: currentSession.id,
      projectName: currentSession.projectName,
      projectId: currentSession.projectId,
      startTime: currentSession.startTime,
      endTime,
      duration: totalDuration,
      urlsViewed: currentSession.urlHistory,
      summary
    };

    saveSessionToHistory(historyEntry);

    // Send email notification if enabled
    try {
      const emailSettings = SettingsStorage.getEmailSettings();
      
      if (emailSettings.frequency === 'after_each_session' && 
          emailSettings.email && 
          EmailService.isValidEmail(emailSettings.email)) {
        
        console.log('📧 Sending session summary email...');
        
        const settings = SettingsStorage.loadSettings();
        const emailSent = await EmailService.sendSessionSummary(
          historyEntry,
          emailSettings.email,
          settings.childName
        );

        if (emailSent) {
          console.log('✅ Session summary email sent successfully');
        } else {
          console.warn('⚠️ Failed to send session summary email');
        }
      }
    } catch (error) {
      console.error('❌ Error sending session summary email:', error);
      // Don't let email errors break the session ending process
    }

    setCurrentSession(null);
    setElapsedTime(0);
    setShowEndSessionOption(false);
    
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }

    lastUrlRef.current = '';
    urlStartTimeRef.current = null;

    // Notify Chrome extension background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        action: 'projectDeactivated'
      }).catch((error) => {
        console.log('Failed to notify extension background script:', error);
      });
    }
  }, [currentSession]);

  const addUrlToHistory = useCallback((url: string, title: string) => {
    if (!currentSession) return;

    const urlEntry: SessionUrl = {
      url,
      title,
      timestamp: new Date(),
      duration: 0
    };

    setCurrentSession(prev => prev ? {
      ...prev,
      urlHistory: [...prev.urlHistory, urlEntry]
    } : null);
  }, [currentSession]);

  const updateUrlDuration = useCallback((url: string, duration: number) => {
    setCurrentSession(prev => {
      if (!prev) return null;
      
      const updatedHistory = [...prev.urlHistory];
      const lastEntry = updatedHistory[updatedHistory.length - 1];
      
      if (lastEntry && lastEntry.url === url) {
        lastEntry.duration += duration;
      }
      
      return {
        ...prev,
        urlHistory: updatedHistory
      };
    });
  }, []);

  const saveSessionToHistory = (entry: SessionHistoryEntry) => {
    const existingHistory = getSessionHistory();
    const updatedHistory = [entry, ...existingHistory];
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  const getSessionHistory = (): SessionHistoryEntry[] => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return [];
    
    return JSON.parse(stored).map((entry: SessionHistoryEntry) => ({
      ...entry,
      startTime: new Date(entry.startTime),
      endTime: new Date(entry.endTime),
      urlsViewed: entry.urlsViewed.map((url: SessionUrl) => ({
        ...url,
        timestamp: new Date(url.timestamp)
      }))
    }));
  };

  const generateSessionSummary = (urlHistory: SessionUrl[]): string => {
    const uniqueUrls = urlHistory.filter((url, index, self) => 
      index === self.findIndex(u => u.url === url.url)
    );
    
    if (uniqueUrls.length === 0) return 'No content viewed during this session.';
    
    const urlCount = uniqueUrls.length;
    const totalTime = urlHistory.reduce((sum, url) => sum + url.duration, 0);
    const avgTimePerUrl = totalTime / urlHistory.length;
    
    let summary = `Viewed ${urlCount} unique page${urlCount > 1 ? 's' : ''}. `;
    
    if (avgTimePerUrl > 60000) {
      summary += `Average time per page: ${Math.round(avgTimePerUrl / 60000)} minute${Math.round(avgTimePerUrl / 60000) > 1 ? 's' : ''}. `;
    } else {
      summary += `Average time per page: ${Math.round(avgTimePerUrl / 1000)} second${Math.round(avgTimePerUrl / 1000) > 1 ? 's' : ''}. `;
    }
    
    // Add most visited pages
    const topPages = uniqueUrls
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3)
      .map(url => url.title || url.url);
    
    if (topPages.length > 0) {
      summary += `Focus areas: ${topPages.join(', ')}.`;
    }
    
    return summary;
  };

  const formatElapsedTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    currentSession,
    elapsedTime: formatElapsedTime(elapsedTime),
    showEndSessionOption,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    getSessionHistory
  };
};