import type {
  ProjectFilters,
  ProjectListResponse,
  ProjectDetailResponse,
  ProjectIntelligenceResponse,
  AdminSummaryResponse,
  AdminAttentionResponse,
  AdminProjectsFilters,
  AdminProjectsResponse,
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

// ─── Public APIs ──────────────────────────────────────────────────────────────

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

// ─── Authority Admin APIs (Phase 4) ───────────────────────────────────────────

export async function getAdminSummary(): Promise<AdminSummaryResponse> {
  return apiFetch<AdminSummaryResponse>('/admin/summary');
}

export async function getAdminAttention(): Promise<AdminAttentionResponse> {
  return apiFetch<AdminAttentionResponse>('/admin/attention');
}

export async function getAdminProjects(filters: AdminProjectsFilters = {}): Promise<AdminProjectsResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'All') {
      params.set(k, String(v));
    }
  });
  const qs = params.toString();
  return apiFetch<AdminProjectsResponse>(`/admin/projects${qs ? `?${qs}` : ''}`);
}