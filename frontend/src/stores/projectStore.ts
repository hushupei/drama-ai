import { create } from 'zustand'
import type { Project, Episode } from '@/types'

interface ProjectState {
  projects: Project[]
  selectedProject: Project | null
  episodes: Episode[]
  pagination: {
    page: number
    size: number
    total: number
  }
  setProjects: (projects: Project[]) => void
  setSelectedProject: (project: Project | null) => void
  setEpisodes: (episodes: Episode[]) => void
  setPagination: (pagination: Partial<ProjectState['pagination']>) => void
  addProject: (project: Project) => void
  updateProject: (project: Project) => void
  removeProject: (id: string) => void
  addEpisode: (episode: Episode) => void
  updateEpisode: (episode: Episode) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProject: null,
  episodes: [],
  pagination: {
    page: 0,
    size: 10,
    total: 0,
  },
  setProjects: (projects) => set({ projects }),
  setSelectedProject: (selectedProject) => set({ selectedProject }),
  setEpisodes: (episodes) => set({ episodes }),
  setPagination: (pagination) =>
    set((state) => ({ pagination: { ...state.pagination, ...pagination } })),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (project) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
  addEpisode: (episode) =>
    set((state) => ({ episodes: [...state.episodes, episode] })),
  updateEpisode: (episode) =>
    set((state) => ({
      episodes: state.episodes.map((e) => (e.id === episode.id ? episode : e)),
    })),
}))
