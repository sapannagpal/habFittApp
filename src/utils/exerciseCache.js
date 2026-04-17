/**
 * exerciseCache.js
 * In-memory Map cache for exercise names and muscle info.
 * Lives for the app session; cleared on logout.
 */

const _cache = new Map(); // exerciseId (string) → { name, primaryMuscle }

export const exerciseCache = {
  /**
   * Get cached exercise name.
   * @param {string} exerciseId
   * @returns {string|null}
   */
  get(exerciseId) {
    return _cache.get(exerciseId)?.name ?? null;
  },

  /**
   * Get cached primary muscle.
   * @param {string} exerciseId
   * @returns {string|null}
   */
  getMuscle(exerciseId) {
    return _cache.get(exerciseId)?.primaryMuscle ?? null;
  },

  /**
   * Ensure all IDs are cached. Fetches missing ones in parallel.
   * @param {string[]} exerciseIds
   * @param {function} fetchFn - (id: string) => Promise<AxiosResponse<ExerciseResponse>>
   */
  async ensureAll(exerciseIds, fetchFn) {
    const missing = exerciseIds.filter(id => !_cache.has(id));
    if (missing.length === 0) return;

    const results = await Promise.allSettled(missing.map(id => fetchFn(id)));
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const ex = result.value.data;
        _cache.set(missing[index], {
          name: ex.name ?? '',
          primaryMuscle: ex.primaryMuscle ?? '',
        });
      }
    });
  },

  /** Clear cache on logout */
  clear() {
    _cache.clear();
  },
};
