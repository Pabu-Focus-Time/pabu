import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectFilters } from "@/components/ProjectFilters";
import { ProjectProposalModal } from "@/components/ProjectProposalModal";
import { CollapsibleSearch } from "@/components/CollapsibleSearch";
import { SessionIndicator } from "@/components/SessionIndicator";
import { Button } from "@/components/ui/button";
import { Settings, History } from "lucide-react";
import { Link } from "react-router-dom";
import redPandaLogo from "../assets/pabu_logo.png";
import { Project, FilterType, ProjectFormData } from "@/types/project";
import { useToast } from "@/hooks/use-toast";
import { findProjectImage } from "@/services/pexelsImageService";
import { ProjectStorage } from "@/utils/projectStorage";

// Mock data for demonstration
const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Space Explorer',
    shortDescription: 'Learn about planets and stars in our solar system',
    longDescription: 'An interactive journey through space where you can explore planets, learn about stars, and discover the wonders of our universe.',
    image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400',
    isFavorite: true,
    isApproved: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'Math Adventure',
    shortDescription: 'Fun math games and puzzles for all levels',
    longDescription: 'Practice math skills through engaging games, puzzles, and interactive challenges designed to make learning math enjoyable.',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
    isFavorite: false,
    isApproved: true,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    title: 'Ocean Discovery',
    shortDescription: 'Dive deep into marine life and ocean ecosystems',
    longDescription: 'Explore the depths of the ocean, meet fascinating sea creatures, and learn about marine ecosystems and conservation.',
    isFavorite: true,
    isApproved: false,
    createdAt: new Date('2024-01-25'),
  },
  {
    id: '4',
    title: 'Art Studio',
    shortDescription: 'Create digital art and learn drawing techniques',
    longDescription: 'Express your creativity through digital art tools, learn various drawing techniques, and create beautiful artwork.',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
    isFavorite: false,
    isApproved: false,
    createdAt: new Date('2024-01-30'),
  },
  {
    id: '5',
    title: 'Mars Missions',
    shortDescription: 'Discover how robots explore the Red Planet.',
    longDescription: 'Learn about the history of Mars missions—from the Sojourner rover to Perseverance—including how engineers design, launch, and control these robotic explorers. Explore their findings on Martian rocks, weather, and the search for signs of ancient life.',
    isFavorite: false,
    isApproved: true,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '6',
    title: 'Ocean Conservation',
    shortDescription: 'Understand why and how we protect our seas.',
    longDescription: 'Dive into the work of marine biologists, NGOs, and volunteers who rescue marine wildlife, clean up plastic, and study ocean health. Learn practical ways kids can help—from beach cleanups to supporting sustainable seafood.',
    isFavorite: false,
    isApproved: true,
    createdAt: new Date('2024-02-02'),
  },
  {
    id: '7',
    title: 'Ancient Egypt: Pyramids & Mummies',
    shortDescription: 'Uncover the secrets of pharaohs and tombs.',
    longDescription: 'Explore how the Egyptians designed and built the Great Pyramids, the technology they used, and the religious beliefs behind mummification. Follow archaeologists as they decode hieroglyphs and unearth treasures buried for thousands of years.',
    isFavorite: false,
    isApproved: true,
    createdAt: new Date('2024-02-03'),
  },
  {
    id: '8',
    title: 'Renewable Energy: Solar Power',
    shortDescription: 'See how sunlight becomes electricity.',
    longDescription: 'Investigate photovoltaic cells, solar farms, and rooftop panels to understand how sunlight is converted into usable energy. Compare solar power to wind, hydro, and fossil fuels—and calculate how much sunshine you\'d need to power your home.',
    isFavorite: false,
    isApproved: true,
    createdAt: new Date('2024-02-04'),
  },
  {
    id: '9',
    title: 'Introduction to Coding with Scratch',
    shortDescription: 'Create games and animations with block code.',
    longDescription: 'Get started with Scratch\'s visual programming interface: design characters, scripts, and interactive stories. Learn key coding concepts like loops, conditionals, and events through fun, step-by-step projects you can share with friends.',
    isFavorite: false,
    isApproved: true,
    createdAt: new Date('2024-02-05'),
  },
  {
    id: '10',
    title: 'Rainforest Ecosystems',
    shortDescription: 'Explore life in Earth\'s greenest jungles.',
    longDescription: 'Journey through the layers of the rainforest—emergent, canopy, understory, and forest floor—meeting exotic plants, insects, birds, and mammals. Study the importance of biodiversity, the carbon cycle, and how deforestation threatens these world-rainforests.',
    isFavorite: false,
    isApproved: true,
    createdAt: new Date('2024-02-06'),
  },
  {
    id: '11',
    title: 'Volcanoes & Earthquakes',
    shortDescription: 'Peek at Earth\'s most powerful forces.',
    longDescription: 'Discover how tectonic plates shift to form volcanoes and trigger earthquakes. Learn to read seismograph data, understand lava types, and follow real-time monitoring efforts that keep people safe in quake- and eruption-prone regions.',
    isFavorite: false,
    isApproved: true,
    createdAt: new Date('2024-02-07'),
  },
  {
    id: '12',
    title: 'Dinosaurs & Fossils',
    shortDescription: 'Travel back to the age of giants.',
    longDescription: 'Meet famous dinosaurs from the Triassic to the Cretaceous, and learn how bones become fossils. Follow paleontologists in the field—using brushes and jackhammers—to reconstruct skeletons and piece together life millions of years ago.',
    isFavorite: false,
    isApproved: true,
    createdAt: new Date('2024-02-08'),
  },
  {
    id: '13',
    title: 'Everyday Robotics',
    shortDescription: 'See how robots help in our daily lives.',
    longDescription: 'From vacuum bots to factory arms and medical assistants, explore the roles robots play at home, in industry, and in hospitals. Peek into basic robot design: sensors, motors, and programming languages that make these helpers smart and safe.',
    isFavorite: false,
    isApproved: true,
    createdAt: new Date('2024-02-09'),
  },
  {
    id: '14',
    title: 'Star Constellations & Mythology',
    shortDescription: 'Connect the dots in the night sky.',
    longDescription: 'Learn how different cultures—Greek, Chinese, Indigenous—named and told stories about the patterns of stars. Use star-chart apps to locate Orion, the Big Dipper, and other constellations, and find out how sailors once navigated by starlight.',
    isFavorite: false,
    isApproved: true,
    createdAt: new Date('2024-02-10'),
  },
  {
    id: '15',
    title: 'The Science of Baking',
    shortDescription: 'Explore chemistry through cookies and bread.',
    longDescription: 'Experiment with ingredients like yeast, baking soda, and sugar to see how they react under heat. Investigate why dough rises, how gluten forms, and how changing temperature or ratios can turn cakes into muffins or pancakes.',
    isFavorite: false,
    isApproved: true,
    createdAt: new Date('2024-02-11'),
  },
  {
    id: '16',
    title: 'Virtual Reality: Exploring Digital Worlds',
    shortDescription: 'Step inside computer-generated environments.',
    longDescription: 'Discover how VR headsets and motion controllers create immersive experiences for gaming, education, and therapy. Learn about the hardware and software behind VR, design simple 3D scenes, and consider the future of virtual field trips and simulations.',
    isFavorite: false,
    isApproved: true,
    createdAt: new Date('2024-02-12'),
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [childName, setChildName] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load projects and child name from localStorage on component mount
  useEffect(() => {
    const savedChildName = localStorage.getItem('childName') || 'Alex';
    setChildName(savedChildName);
    
    // Load projects from localStorage
    const storedProjects = ProjectStorage.loadProjects();
    if (storedProjects) {
      setProjects(storedProjects);
    } else {
      // First time - initialize with mock data
      setProjects(mockProjects);
      ProjectStorage.saveProjects(mockProjects);
    }
  }, []);

  // Listen for storage changes and window focus to refresh projects
  useEffect(() => {
    const refreshProjects = () => {
      const updatedProjects = ProjectStorage.loadProjects();
      if (updatedProjects) {
        setProjects(updatedProjects);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'projects') {
        refreshProjects();
      }
    };

    const handleWindowFocus = () => {
      // Refresh projects when user returns to the tab
      refreshProjects();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Save projects whenever projects state changes
  useEffect(() => {
    if (projects.length > 0) {
      ProjectStorage.saveProjects(projects);
    }
  }, [projects]);

  const filteredProjects = useMemo(() => {
    // If searching, show all projects that match regardless of filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return projects.filter(project => 
        project.title.toLowerCase().includes(query) ||
        project.shortDescription.toLowerCase().includes(query) ||
        project.longDescription.toLowerCase().includes(query)
      );
    }
    
    // Otherwise apply normal filter logic
    switch (activeFilter) {
      case 'starred':
        return projects.filter(p => p.isFavorite && p.isApproved);
      case 'unapproved':
        return projects.filter(p => !p.isApproved);
      case 'approved':
      default:
        return projects.filter(p => p.isApproved);
    }
  }, [projects, activeFilter, searchQuery]);

  const projectCounts = useMemo(() => ({
    approved: projects.filter(p => p.isApproved).length,
    unapproved: projects.filter(p => !p.isApproved).length,
    starred: projects.filter(p => p.isFavorite && p.isApproved).length,
  }), [projects]);

  const handleToggleFavorite = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    const wasStarred = project.isFavorite;
    
    setProjects(prev => prev.map(project => 
      project.id === id 
        ? { ...project, isFavorite: !project.isFavorite }
        : project
    ));
    
    // Show toast feedback
    toast({
      title: wasStarred ? "Removed from favorites" : "Added to favorites",
      description: `${project.title} ${wasStarred ? 'unstarred' : 'starred'}`,
    });
  };

  const handleProjectClick = (project: Project) => {
    // Navigate to focus page without starting session
    navigate(`/focus/${project.id}`, { 
      state: { project } 
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // When search ends (query becomes empty), switch to starred filter
    if (!query.trim()) {
      setActiveFilter('starred');
    }
  };

  const handleProjectSubmit = async (data: ProjectFormData, isApproved: boolean) => {
    try {
      // Generate image using Pexels API based on project title and description
      const generatedImage = await findProjectImage({
        title: data.title,
        description: data.shortDescription
      });

      const newProject: Project = {
        id: Date.now().toString(),
        title: data.title,
        shortDescription: data.shortDescription,
        longDescription: data.longDescription,
        image: generatedImage, // Now using Pexels image
        isFavorite: false,
        isApproved,
        createdAt: new Date(),
      };

      setProjects(prev => [...prev, newProject]);
      
      toast({
        title: "Project Created",
        description: "Project created successfully with image!",
      });
      
    } catch (error) {
      console.error('Failed to create project:', error);
      
      // Fallback: create project without image
      const newProject: Project = {
        id: Date.now().toString(),
        title: data.title,
        shortDescription: data.shortDescription,
        longDescription: data.longDescription,
        isFavorite: false,
        isApproved,
        createdAt: new Date(),
      };

      setProjects(prev => [...prev, newProject]);
      
      toast({
        title: "Project Created",
        description: "Project created successfully, but image search failed.",
        variant: "destructive",
      });
    }
  };

  const canToggleFavorites = true;

  return (
    <div className="min-h-screen bg-background relative">
      <SessionIndicator />
      {/* Settings Icon */}
      <div className="absolute top-6 left-6">
        <Link 
          to="/settings" 
          className="p-3 rounded-xl hover:bg-black/5 transition-smooth"
        >
          <Settings className="w-6 h-6 text-foreground" />
        </Link>
      </div>

      {/* Centered Logo and Greeting */}
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
            Hello {childName}
          </h1>
          <p className="font-inter text-xl text-muted-foreground">
            What do you want to explore today?
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <ProjectFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          projectCounts={projectCounts}
        />
        
        <div className="flex justify-center mb-8 mt-6">
          <CollapsibleSearch
            onSearch={handleSearch}
            searchQuery={searchQuery}
          />
        </div>

        <div className="flex flex-col items-center">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8 w-full">
              {filteredProjects.map((project, index) => (
                <div 
                  key={project.id}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProjectCard
                    project={project}
                    onToggleFavorite={handleToggleFavorite}
                    onProjectClick={handleProjectClick}
                    showFavoriteToggle={canToggleFavorites}
                  />
                </div>
              ))}
              
              {/* Create New Project Card */}
              {!searchQuery && (
                <div 
                  className="group relative bg-card rounded-2xl shadow-subtle hover:shadow-hover 
                             hover:-translate-y-0.5 transition-smooth cursor-pointer 
                             animate-slide-up border border-border/50 h-80 w-full flex flex-col"
                  onClick={() => setIsModalOpen(true)}
                  style={{ animationDelay: `${filteredProjects.length * 100}ms` }}
                >
                  {/* Plus Icon - same aspect ratio as project image */}
                  <div className="aspect-[4/3] rounded-t-2xl overflow-hidden bg-red-100 flex items-center justify-center">
                    <Plus className="w-12 h-12 text-muted-foreground/60" />
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col justify-start pt-6">
                    <h3 className="font-semibold text-lg text-card-foreground text-center font-inter">
                      Create New Project
                    </h3>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-4">
                {searchQuery ? 'No projects found matching your search' : 'No projects found in this category'}
              </div>
              <p className="text-muted-foreground mb-8">
                {searchQuery 
                  ? `Try searching for "${searchQuery}" with different keywords or clear your search.`
                  : activeFilter === 'starred' && "You haven't starred any projects yet."
                }
                {!searchQuery && activeFilter === 'unapproved' && "No projects are waiting for approval."}
                {!searchQuery && activeFilter === 'approved' && "No approved projects available."}
              </p>
              
              {!searchQuery && (
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 
                             px-8 py-4 text-lg font-semibold rounded-xl shadow-subtle"
                >
                  Create a New Project
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Session History Section at bottom */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-center">
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
      </div>

      <ProjectProposalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleProjectSubmit}
      />
    </div>
  );
}
