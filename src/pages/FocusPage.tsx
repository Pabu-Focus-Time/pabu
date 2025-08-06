import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, Square, Send, ExternalLink, Trash2, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Project } from "@/types/project";
import { useSessionManager } from "@/hooks/useSessionManager";
import { SessionIndicator } from "@/components/SessionIndicator";
import redPandaLogo from "../assets/pabu_logo.png";
import { ProjectStorage } from "@/utils/projectStorage";
import Anthropic from '@anthropic-ai/sdk';
import { LinkRenderer } from "@/utils/linkRenderer";
import { SettingsStorage } from "@/utils/settingsStorage";

export default function () {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { startSession, currentSession, elapsedTime, pauseSession, resumeSession, endSession } = useSessionManager();
  const [project, setProject] = useState<Project | null>(location.state?.project as Project || null);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, sender: 'user' | 'assistant'}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState("");
  const [showTabNotRelevantDialog, setShowTabNotRelevantDialog] = useState(false);
  const [selectedResource, setSelectedResource] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<Array<{title: string, url: string, domain: string}>>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  useEffect(() => {
    // Force session manager to reload from localStorage when  loads via URL
    // This ensures we detect existing active sessions
    const checkActiveSession = () => {
      const savedSession = localStorage.getItem('active_session');
      if (savedSession) {
        console.log('🔄 Found active session in localStorage:', JSON.parse(savedSession));
      } else {
        console.log('❌ No active session found in localStorage');
      }
    };
    
    checkActiveSession();
    
    // If project is not available from location.state, try to load from chrome storage
    if (!project && projectId) {
      // Try to get project data from chrome storage (set by background script)
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([`Project_${projectId}`]).then((result) => {
          const storedProject = result[`Project_${projectId}`];
          if (storedProject) {
            // Convert the stored project to the expected Project format
            const projectData: Project = {
              id: storedProject.id,
              title: storedProject.name,
              shortDescription: storedProject.shortDescription || storedProject.description || '',
              longDescription: storedProject.longDescription || storedProject.description || '',
              isApproved: true, // Assume approved if it's active
              isFavorite: false, // Default to false
              createdAt: new Date(), // Use current date as fallback
              image: storedProject.image || undefined
            };
            setProject(projectData);
          } else {
            // Fallback: try to get from ProjectStorage
            try {
              const allProjects = ProjectStorage.loadProjects();
              if (allProjects) {
                const foundProject = allProjects.find(p => p.id === projectId);
                if (foundProject) {
                  setProject(foundProject);
                } else {
                  navigate('/');
                }
              } else {
                navigate('/');
              }
            } catch (error) {
              console.error('Failed to load project:', error);
              navigate('/');
            }
          }
        }).catch((error) => {
          console.error('Failed to load project from storage:', error);
          navigate('/');
        });
      } else {
        // Fallback for non-extension environment
        try {
          const allProjects = ProjectStorage.loadProjects();
          if (allProjects) {
            const foundProject = allProjects.find(p => p.id === projectId);
            if (foundProject) {
              setProject(foundProject);
            } else {
              navigate('/');
            }
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error('Failed to load project:', error);
          navigate('/');
        }
      }
    } else if (!project && !projectId) {
      navigate('/');
    }
  }, [project, projectId, navigate]);

  // Load cached recommendations or generate new ones when project loads
  useEffect(() => {
    if (project) {
      loadOrGenerateRecommendations();
    }
  }, [project]);

  // Load cached recommendations or generate new ones
  const loadOrGenerateRecommendations = async () => {
    if (!project) return;
    
    // Try to load cached recommendations first
    const cachedRecommendations = await loadCachedRecommendations(project.id);
    if (cachedRecommendations && cachedRecommendations.length > 0) {
      console.log(`📚 Loaded ${cachedRecommendations.length} cached recommendations for project ${project.title}`);
      setRecommendations(cachedRecommendations);
    } else {
      console.log(`🔄 No cached recommendations found for project ${project.title}, generating new ones...`);
      generateRecommendations();
    }
  };

  // Load cached recommendations from localStorage
  const loadCachedRecommendations = async (projectId: string) => {
    try {
      const cacheKey = `project_recommendations_${projectId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is still valid (24 hours)
        const cacheAge = Date.now() - data.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (cacheAge < maxAge) {
          return data.recommendations;
        } else {
          console.log('📅 Cached recommendations expired, will generate new ones');
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error loading cached recommendations:', error);
    }
    return null;
  };

  // Save recommendations to localStorage
  const saveCachedRecommendations = (projectId: string, recommendations: Array<{title: string, url: string, domain: string}>) => {
    try {
      const cacheKey = `project_recommendations_${projectId}`;
      const data = {
        recommendations,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(data));
      console.log(`💾 Saved ${recommendations.length} recommendations to cache for project ${projectId}`);
    } catch (error) {
      console.error('Error saving cached recommendations:', error);
    }
  };

  // Debug session state
  useEffect(() => {
    console.log('🔍  Debug:', {
      projectId,
      project: project?.id,
      currentSession: currentSession?.projectId,
      sessionStatus: currentSession?.status,
      elapsedTime,
      hasSession: !!currentSession
    });
  }, [projectId, project, currentSession, elapsedTime]);

  const handleStartSession = () => {
    if (project) {
      startSession(project);
    }
  };

  const handleApproveProject = () => {
    setShowPinDialog(true);
  };

  const handlePinSubmit = () => {
    // Get current PIN from settings
    const currentPin = SettingsStorage.getCurrentPin();
    
    if (pin === currentPin) {
      if (project) {
        try {
          // Update the project's approval status in storage
          const projects = ProjectStorage.loadProjects();
          if (projects) {
            const updatedProjects = projects.map(p =>
              p.id === project.id
                ? { ...p, isApproved: true }
                : p
            );
            ProjectStorage.saveProjects(updatedProjects);
            
            console.log("Project approved!");
            
            // Update local state to reflect the approval
            setProject(prev => prev ? { ...prev, isApproved: true } : null);
            
            setShowPinDialog(false);
            setPin("");
            
            // Don't navigate away - stay on the  to show the approved state
          } else {
            alert("Failed to load projects. Please try again.");
            setPin("");
          }
        } catch (error) {
          console.error('Failed to approve project:', error);
          alert("Failed to approve project. Please try again.");
          setPin("");
        }
      }
    } else {
      alert("Invalid PIN. Please try again.");
      setPin("");
    }
  };

  const handleDeleteProject = () => {
    if (!project) return;
    
    const success = ProjectStorage.deleteProject(project.id);
    if (success) {
      console.log(`Project "${project.title}" deleted!`);
    } else {
      console.error('Failed to delete project');
    }
    
    // Navigate back to projects page
    navigate('/');
  };

  const handleSendMessage = async () => {
    if (chatInput.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: chatInput,
        sender: 'user' as const
      };
      setChatMessages(prev => [...prev, newMessage]);
      const userInput = chatInput;
      setChatInput("");
      
      try {
        console.log('🚀 Sending message to Anthropic API using SDK');
        
        // Use the API key from not-api-key.txt
        const apiKey = '';
        
        // Create project-focused system prompt
        const systemPrompt = `You are Claude, an AI assistant integrated into Pabu, a focus and productivity app.

🎯 CURRENT FOCUS SESSION:
Project: "${project.title}"
Description: ${project.shortDescription}

🚨 CRITICAL INSTRUCTIONS:
• You MUST stay focused on "${project.title}" project topics
• ONLY answer questions directly related to this project or its learning objectives
• If asked about unrelated topics, respond: "I'm here to help you stay focused on your ${project.title} project. How can I assist you with that?"
• Provide specific, actionable guidance that helps achieve the project goals
• Keep responses concise and project-focused
• When helpful, provide relevant links to resources, tutorials, or documentation that support the project goals
• When providing lists, format each item on a separate line for better readability`;

        // Initialize Anthropic SDK
        const anthropic = new Anthropic({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true,
        });

        // Use Anthropic SDK
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            ...chatMessages.filter(msg => msg.sender !== 'assistant').map(msg => ({
              role: 'user' as const,
              content: msg.text
            })),
            {
              role: 'user' as const,
              content: userInput
            }
          ],
        });
        
        const responseText = response.content[0]?.type === 'text' ? response.content[0].text : 'Sorry, I couldn\'t generate a response.';
        
        console.log('✅ Received response from Claude:', responseText);
        
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: 'assistant' as const
        };
        setChatMessages(prev => [...prev, aiResponse]);
        
      } catch (error) {
        console.error('❌ Chat error:', error);
        const errorResponse = {
          id: (Date.now() + 1).toString(),
          text: `Sorry, there was an error connecting to the AI assistant: ${error instanceof Error ? error.message : 'Unknown error'}`,
          sender: 'assistant' as const
        };
        setChatMessages(prev => [...prev, errorResponse]);
      }
    }
  };

  const handleOpenResource = () => {
    if (selectedResource !== null) {
      window.open(recommendations[selectedResource].url, '_blank');
      setShowTabNotRelevantDialog(false);
      setSelectedResource(null);
    }
  };

  // Handle resource click - redirect current tab if session is active, otherwise open in new tab
  const handleResourceClick = (event: React.MouseEvent, url: string) => {
    // Prevent any default behavior and event bubbling
    event.preventDefault();
    event.stopPropagation();
    
    if (currentSession?.status === 'active') {
      // If session is active, redirect current tab to the resource (like content script)
      window.location.href = url;
    } else {
      // If no active session, open in new tab (normal behavior)
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // AI-powered resource generation (similar to content script)
  const generateRecommendations = async (forceRegenerate = false) => {
    if (!project) return;
    
    setIsLoadingRecommendations(true);
    try {
      const apiKey = 'sk-D1eRgnGMRHOMF9cVbO0SBMngp4UKPd8bdOeG3C5iQMlbUFjFhmT4XHQXnChK8RXlKHrNiusg/gD++hkmoVxxcDP9Qhji2Z0LpiEfUEsfKAM=';
      
      if (!apiKey) {
        console.warn('No API key found, using fallback recommendations');
        const fallbackRecs = getFallbackRecommendations(project.title, 'General');
        setRecommendations(fallbackRecs);
        saveCachedRecommendations(project.id, fallbackRecs);
        return;
      }

      const aiRecommendations = await getAIRecommendations(
        project.title,
        'General',
        project.shortDescription,
        project.longDescription,
        apiKey
      );
      setRecommendations(aiRecommendations);
      
      // Cache the new recommendations
      saveCachedRecommendations(project.id, aiRecommendations);
      
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      const fallbackRecs = getFallbackRecommendations(project.title, 'General');
      setRecommendations(fallbackRecs);
      saveCachedRecommendations(project.id, fallbackRecs);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // AI-powered recommendation generation
  const getAIRecommendations = async (projectName: string, projectType: string, shortDescription: string, longDescription: string, apiKey: string) => {
    const prompt = `You are an educational resource finder. Given a project name, type, and detailed descriptions, find 20 highly relevant, educational, and reputable online resources that would help someone learn about this specific topic.

PROJECT: ${projectName}
TYPE: ${projectType || 'General'}
SHORT DESCRIPTION: ${shortDescription || 'Not specified'}
LONG DESCRIPTION: ${longDescription || 'Not specified'}

Requirements:
- Find actual, real websites with working URLs
- Prioritize educational, official, or well-known learning platforms
- Include diverse resource types (documentation, tutorials, interactive tools, courses, videos, articles, tools)
- Ensure resources are appropriate for learning and skill development
- Focus on the specific project goals and descriptions provided
- Provide a good mix of beginner, intermediate, and advanced resources
- Include both free and premium resources when relevant

Respond with ONLY valid JSON in this exact format (exactly 20 resources):
[
  {
    "title": "Resource Title 1",
    "domain": "example.com",
    "url": "https://example.com/path"
  },
  {
    "title": "Resource Title 2",
    "domain": "example2.com",
    "url": "https://example2.com/path"
  }
  // ... continue for all 20 resources
]`;

    const response = await fetch('https://router.requesty.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://pabu-extension.local',
        'X-Title': 'Pabu - Resource Finder'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful educational resource finder that provides real, working URLs to educational content. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    try {
      // Clean the response in case there's extra text
      let jsonStr = content.trim();
      
      // Extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = jsonStr.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      // Try to find JSON array if there's extra text
      const jsonStart = jsonStr.indexOf('[');
      const jsonEnd = jsonStr.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      }

      const recommendations = JSON.parse(jsonStr);
      
      // Validate the structure
      if (!Array.isArray(recommendations) || recommendations.length < 10) {
        throw new Error(`Invalid recommendations format - expected at least 10, got ${recommendations.length}`);
      }
      
      // Validate each recommendation has required fields
      recommendations.forEach(rec => {
        if (!rec.title || !rec.domain || !rec.url) {
          throw new Error('Missing required fields in recommendation');
        }
      });
      
      return recommendations;
      
    } catch (parseError) {
      console.error('Error parsing AI recommendations:', parseError);
      throw new Error('Failed to parse AI response');
    }
  };

  // Fallback recommendations when AI is unavailable (expanded to 20 resources)
  const getFallbackRecommendations = (projectName: string, projectType: string) => {
    const projectLower = projectName.toLowerCase();
    const typeLower = projectType ? projectType.toLowerCase() : '';
    
    // Base resources that work for most topics
    const baseResources = [
      { title: `${projectName} - Khan Academy`, domain: 'khanacademy.org', url: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(projectName)}` },
      { title: `${projectName} - Wikipedia`, domain: 'wikipedia.org', url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(projectName)}` },
      { title: `${projectName} - Coursera Courses`, domain: 'coursera.org', url: `https://www.coursera.org/search?query=${encodeURIComponent(projectName)}` },
      { title: `${projectName} - edX Courses`, domain: 'edx.org', url: `https://www.edx.org/search?q=${encodeURIComponent(projectName)}` },
      { title: `${projectName} - YouTube Educational`, domain: 'youtube.com', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(projectName + ' tutorial')}` },
      { title: `${projectName} - MIT OpenCourseWare`, domain: 'ocw.mit.edu', url: `https://ocw.mit.edu/search/?q=${encodeURIComponent(projectName)}` },
      { title: `${projectName} - Stack Overflow`, domain: 'stackoverflow.com', url: `https://stackoverflow.com/search?q=${encodeURIComponent(projectName)}` },
      { title: `${projectName} - Reddit Discussions`, domain: 'reddit.com', url: `https://www.reddit.com/search/?q=${encodeURIComponent(projectName)}` },
      { title: `${projectName} - Udemy Courses`, domain: 'udemy.com', url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(projectName)}` },
      { title: `${projectName} - FreeCodeCamp`, domain: 'freecodecamp.org', url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(projectName)}` }
    ];

    // Topic-specific resources
    let specificResources = [];
    
    if (projectLower.includes('space') || projectLower.includes('astronomy')) {
      specificResources = [
        { title: 'NASA Educational Resources', domain: 'nasa.gov', url: 'https://www.nasa.gov/audience/foreducators/' },
        { title: 'Space Exploration - National Geographic', domain: 'nationalgeographic.com', url: 'https://www.nationalgeographic.com/science/space/' },
        { title: 'Interactive Solar System', domain: 'solarsystem.nasa.gov', url: 'https://solarsystem.nasa.gov/explore/' },
        { title: 'ESA Educational Resources', domain: 'esa.int', url: 'https://www.esa.int/Education' },
        { title: 'Astronomy Picture of the Day', domain: 'apod.nasa.gov', url: 'https://apod.nasa.gov/apod/' },
        { title: 'Stellarium - Virtual Planetarium', domain: 'stellarium.org', url: 'https://stellarium.org/' },
        { title: 'SpaceX Educational Content', domain: 'spacex.com', url: 'https://www.spacex.com/' },
        { title: 'Hubble Space Telescope', domain: 'hubblesite.org', url: 'https://hubblesite.org/' },
        { title: 'Cosmic Perspective Textbook', domain: 'pearson.com', url: 'https://www.pearson.com/us/higher-education/product/Bennett-Cosmic-Perspective-The-7th-Edition/9780321839558.html' },
        { title: 'Sky & Telescope Magazine', domain: 'skyandtelescope.org', url: 'https://skyandtelescope.org/' }
      ];
    } else if (projectLower.includes('math') || typeLower.includes('math')) {
      specificResources = [
        { title: 'Khan Academy Math', domain: 'khanacademy.org', url: 'https://www.khanacademy.org/math' },
        { title: 'Wolfram MathWorld', domain: 'mathworld.wolfram.com', url: 'https://mathworld.wolfram.com/' },
        { title: 'MIT OpenCourseWare Mathematics', domain: 'ocw.mit.edu', url: 'https://ocw.mit.edu/courses/mathematics/' },
        { title: 'Brilliant Math Courses', domain: 'brilliant.org', url: 'https://brilliant.org/courses/#math' },
        { title: 'Paul\'s Online Math Notes', domain: 'tutorial.math.lamar.edu', url: 'https://tutorial.math.lamar.edu/' },
        { title: 'GeoGebra Interactive Math', domain: 'geogebra.org', url: 'https://www.geogebra.org/' },
        { title: 'Desmos Graphing Calculator', domain: 'desmos.com', url: 'https://www.desmos.com/calculator' },
        { title: 'Art of Problem Solving', domain: 'artofproblemsolving.com', url: 'https://artofproblemsolving.com/' },
        { title: 'Professor Leonard YouTube', domain: 'youtube.com', url: 'https://www.youtube.com/channel/UCoHhuummRZaIVX7bD4t2czg' },
        { title: 'Mathway Problem Solver', domain: 'mathway.com', url: 'https://www.mathway.com/' }
      ];
    } else if (projectLower.includes('science') || typeLower.includes('science')) {
      specificResources = [
        { title: 'Khan Academy Science', domain: 'khanacademy.org', url: 'https://www.khanacademy.org/science' },
        { title: 'Crash Course Science', domain: 'youtube.com', url: 'https://www.youtube.com/user/crashcourse' },
        { title: 'Smithsonian Learning', domain: 'si.edu', url: 'https://www.si.edu/educators' },
        { title: 'National Science Foundation', domain: 'nsf.gov', url: 'https://www.nsf.gov/news/classroom/' },
        { title: 'SciShow YouTube Channel', domain: 'youtube.com', url: 'https://www.youtube.com/user/scishow' },
        { title: 'Nature Education', domain: 'nature.com', url: 'https://www.nature.com/scitable/' },
        { title: 'Scientific American', domain: 'scientificamerican.com', url: 'https://www.scientificamerican.com/' },
        { title: 'TED-Ed Science', domain: 'ed.ted.com', url: 'https://ed.ted.com/lessons?category=science-technology' },
        { title: 'Bill Nye the Science Guy', domain: 'billnye.com', url: 'https://www.billnye.com/' },
        { title: 'PhET Interactive Simulations', domain: 'phet.colorado.edu', url: 'https://phet.colorado.edu/' }
      ];
    } else {
      // Generic educational resources for other topics
      specificResources = [
        { title: 'TED Talks', domain: 'ted.com', url: `https://www.ted.com/search?q=${encodeURIComponent(projectName)}` },
        { title: 'Britannica Encyclopedia', domain: 'britannica.com', url: `https://www.britannica.com/search?query=${encodeURIComponent(projectName)}` },
        { title: 'Google Scholar', domain: 'scholar.google.com', url: `https://scholar.google.com/scholar?q=${encodeURIComponent(projectName)}` },
        { title: 'Library of Congress', domain: 'loc.gov', url: `https://www.loc.gov/search/?q=${encodeURIComponent(projectName)}` },
        { title: 'Open Culture', domain: 'openculture.com', url: `https://www.openculture.com/?s=${encodeURIComponent(projectName)}` },
        { title: 'Academic Earth', domain: 'academicearth.org', url: `https://academicearth.org/search/?q=${encodeURIComponent(projectName)}` },
        { title: 'iTunes U', domain: 'apple.com', url: 'https://www.apple.com/education/itunes-u/' },
        { title: 'Quizlet Study Sets', domain: 'quizlet.com', url: `https://quizlet.com/search?query=${encodeURIComponent(projectName)}` },
        { title: 'Study.com', domain: 'study.com', url: `https://study.com/search.html?q=${encodeURIComponent(projectName)}` },
        { title: 'ResearchGate', domain: 'researchgate.net', url: `https://www.researchgate.net/search?q=${encodeURIComponent(projectName)}` }
      ];
    }
    
    // Combine base and specific resources, ensuring we have exactly 20
    const allResources = [...baseResources, ...specificResources];
    return allResources.slice(0, 20);
  };

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SessionIndicator />
      
      {/* Header with Back Button, Logo, and Session Controls */}
      <div className="relative py-6">
        {/* Back to Projects Button */}
        <div className="absolute top-6 left-6 z-10">
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
        <div className="flex justify-center">
          <img 
            src={redPandaLogo} 
            alt="Red Panda Logo" 
            className="h-12 w-auto"
          />
        </div>

        {/* Session Controls in top-right */}
        <div className="absolute top-6 right-6 z-10">
          {currentSession?.projectId === project.id && currentSession.status !== 'ended' ? (
            <div className="flex items-center gap-3">
              <div className="text-lg font-mono font-bold text-primary">
                {elapsedTime}
              </div>
              {currentSession.status === 'active' ? (
                <Button 
                  onClick={pauseSession}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Pause className="w-3 h-3" />
                  Pause
                </Button>
              ) : (
                <Button 
                  onClick={resumeSession}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  Resume
                </Button>
              )}
              <Button 
                onClick={endSession}
                variant="destructive"
                size="sm"
                className="flex items-center gap-1"
              >
                <Square className="w-3 h-3" />
                End Session
              </Button>
            </div>
          ) : project.isApproved ? (
            <Button 
              onClick={handleStartSession}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-2 flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Session
            </Button>
          ) : (
            <Button 
              onClick={handleApproveProject}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-6 px-6 pb-6 items-stretch" style={{ height: 'calc(100vh - 100px)' }}>
        {/* Left Panel - Project Details (33% width) */}
        <div className="w-1/3">
          <Card className="bg-background shadow-subtle rounded-lg h-full relative">
            <CardContent className="p-6 h-full flex flex-col">
              <ScrollArea className="flex-1">
                <div className="space-y-6">
                  {/* Project Title */}
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      {project.title}
                    </h1>
                    <h2 className="text-lg text-muted-foreground">
                      {project.shortDescription}
                    </h2>
                  </div>

                  {/* Project Image */}
                  {project.image && (
                    <div className="w-full aspect-video rounded-lg overflow-hidden">
                      <img 
                        src={project.image} 
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Long Description */}
                  <div>
                    <p className="text-foreground leading-relaxed">
                      {project.longDescription}
                    </p>
                  </div>
                </div>
              </ScrollArea>
              
              {/* Delete Button at bottom right */}
              <div className="flex justify-end pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the project "{project.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteProject}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Tabs (67% width) */}
        <div className="w-2/3">
          <Card className="bg-background shadow-subtle rounded-lg h-full">
            <CardContent className="p-6 h-full flex flex-col">
              {/* Tabbed Interface */}
              <Tabs defaultValue="recommendations" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                </TabsList>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Helpful Resources
                      </h3>
                      <Button
                        onClick={() => generateRecommendations(true)}
                        disabled={isLoadingRecommendations}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${isLoadingRecommendations ? 'animate-spin' : ''}`} />
                        {isLoadingRecommendations ? 'Loading...' : 'Reload'}
                      </Button>
                    </div>
                    
                    {isLoadingRecommendations ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                          <span className="text-muted-foreground">Finding relevant resources for you...</span>
                        </div>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3 pr-4">
                          {recommendations.map((item, index) => (
                            <div
                              key={index}
                              onClick={(e) => handleResourceClick(e, item.url)}
                              className="block p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                                    {item.title}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {item.domain}
                                  </div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </TabsContent>

                {/* Chat Tab */}
                <TabsContent value="chat" className="flex-1 flex flex-col">
                  <div className="flex-1 flex flex-col">
                    {/* Messages Area */}
                    <ScrollArea className="flex-1 border border-border rounded-lg p-4 mb-4">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          Start a conversation about your project!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {chatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] p-3 rounded-lg ${
                                  message.sender === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-foreground'
                                }`}
                              >
                                <LinkRenderer 
                                  text={message.text}
                                  className={message.sender === 'user' ? 'text-primary-foreground' : 'text-foreground'}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Chat Input */}
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask anything about your project..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim()}
                        className="px-3"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Button for Tab Not Relevant Pop-up */}
      {/* <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={() => setShowTabNotRelevantDialog(true)} 
          variant="outline" 
          size="sm"
        >
          See Pop-up
        </Button>
      </div> */}

      {/* PIN Entry Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter PIN to Approve Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              type="password" 
              placeholder="Enter PIN" 
              value={pin} 
              onChange={(e) => setPin(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()} 
              className="text-center text-lg tracking-widest" 
              maxLength={4} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePinSubmit}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tab Not Relevant Dialog */}
      <Dialog open={showTabNotRelevantDialog} onOpenChange={setShowTabNotRelevantDialog}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4">
            {/* Logo at top */}
            <div className="flex justify-center mb-4">
              <img 
                src={redPandaLogo} 
                alt="Red Panda Logo" 
                className="h-16 w-auto" 
              />
            </div>
            
            {/* Headline */}
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-center">
                This tab does not seem relevant to project <strong>{project.title}</strong>.
              </DialogTitle>
            </DialogHeader>
            
            {/* Body Text */}
            <p className="text-muted-foreground">Check out one of these links:</p>
            
            {/* Resource Links */}
            <div className="space-y-3 text-left">
              {recommendations.map((item, index) => (
                <div 
                  key={index} 
                  className={`p-3 border border-border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedResource === index ? 'bg-muted ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedResource(index)}
                >
                  <div className="font-medium text-foreground">
                    {item.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.domain}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <DialogFooter className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowTabNotRelevantDialog(false);
                setSelectedResource(null);
              }}
            >
              Go Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}