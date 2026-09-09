import { useState, useEffect, useCallback } from 'react';
import { getProjects } from '../services/api';
import type { Project, ProjectFilters, ProjectListResponse } from '../types';

interface UseProjectsResult {
  projects: Project[];
  filters: ProjectListResponse['filters'] | null;
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProjects(activeFilters: ProjectFilters = {}): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters]   = useState<ProjectListResponse['filters'] | null>(null);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tick, setTick]         = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getProjects(activeFilters)
      .then(res => {
        if (cancelled) return;
        setProjects(res.data);
        setFilters(res.filters);
        setTotal(res.total);
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Unable to load projects.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeFilters), tick]);

  return { projects, filters, total, loading, error, refetch };
}
