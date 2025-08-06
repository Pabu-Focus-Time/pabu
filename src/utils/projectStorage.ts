import { Project } from "@/types/project";

const PROJECTS_STORAGE_KEY = 'projects';

export const ProjectStorage = {
  /**
   * Save projects to localStorage
   */
  saveProjects: (projects: Project[]): void => {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Failed to save projects to localStorage:', error);
    }
  },

  /**
   * Load projects from localStorage
   */
  loadProjects: (): Project[] | null => {
    try {
      const storedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        // Convert date strings back to Date objects
        return parsedProjects.map((project: any) => ({
          ...project,
          createdAt: new Date(project.createdAt)
        }));
      }
      return null;
    } catch (error) {
      console.error('Failed to load projects from localStorage:', error);
      return null;
    }
  },

  /**
   * Delete a project by ID
   */
  deleteProject: (projectId: string): boolean => {
    try {
      const projects = ProjectStorage.loadProjects();
      if (projects) {
        const updatedProjects = projects.filter(p => p.id !== projectId);
        ProjectStorage.saveProjects(updatedProjects);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  },

  /**
   * Update a specific project's favorite status
   */
  toggleProjectFavorite: (projectId: string): boolean => {
    try {
      const projects = ProjectStorage.loadProjects();
      if (projects) {
        const updatedProjects = projects.map(project => 
          project.id === projectId 
            ? { ...project, isFavorite: !project.isFavorite }
            : project
        );
        ProjectStorage.saveProjects(updatedProjects);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle project favorite:', error);
      return false;
    }
  },

  /**
   * Add a new project
   */
  addProject: (project: Project): boolean => {
    try {
      const projects = ProjectStorage.loadProjects() || [];
      const updatedProjects = [...projects, project];
      ProjectStorage.saveProjects(updatedProjects);
      return true;
    } catch (error) {
      console.error('Failed to add project:', error);
      return false;
    }
  }
};