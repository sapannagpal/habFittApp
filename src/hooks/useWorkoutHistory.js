/**
 * useWorkoutHistory — fetches paginated session history from hf_ms_workout.
 */
import { useState, useEffect, useCallback } from 'react';
import { workoutApi } from '../api/workoutApi';
import { transformHistoryPage } from '../utils/workoutTransformers';
import { useWorkout } from '../context/WorkoutContext';

const PAGE_SIZE = 20;

export default function useWorkoutHistory() {
  const { activePlan } = useWorkout();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPage = useCallback(async (page) => {
    const { data } = await workoutApi.getSessionHistory(page, PAGE_SIZE);
    return transformHistoryPage(data, activePlan?.name ?? null);
  }, [activePlan?.name]);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchPage(0)
      .then(result => {
        if (!cancelled) {
          setItems(result.items);
          setHasMore(result.hasMore);
          setCurrentPage(0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load workout history');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await fetchPage(nextPage);
      setItems(prev => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch {
      // silently fail — user can retry by scrolling again
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, currentPage, fetchPage]);

  return { items, isLoading, error, hasMore, isLoadingMore, loadMore };
}
