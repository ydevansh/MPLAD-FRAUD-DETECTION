import type {
  ProjectFilters,
  ProjectListResponse,
  ProjectDetailResponse,
  ProjectIntelligenceResponse,
} from '../types';

const BASE = '/api';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getProjects(filters: ProjectFilters = {}): Promise<ProjectListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  const qs = params.toString();
  return apiFetch<ProjectListResponse>(`/projects${qs ? `?${qs}` : ''}`);
}

export async function getProjectById(projectId: string): Promise<ProjectDetailResponse> {
  return apiFetch<ProjectDetailResponse>(`/projects/${projectId}`);
}

export async function getProjectIntelligence(projectId: string): Promise<ProjectIntelligenceResponse> {
  return apiFetch<ProjectIntelligenceResponse>(`/projects/${projectId}/intelligence`);
}

export async function checkHealth(): Promise<{ success: boolean; message: string }> {
  return apiFetch('/health');
}