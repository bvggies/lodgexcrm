/**
 * Loading state management utilities
 */

export interface LoadingState {
  [key: string]: boolean;
}

export const createLoadingState = (keys: string[]): LoadingState => {
  return keys.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as LoadingState);
};

export const setLoading = (state: LoadingState, key: string, value: boolean): LoadingState => {
  return { ...state, [key]: value };
};

export const setMultipleLoading = (
  state: LoadingState,
  updates: Record<string, boolean>
): LoadingState => {
  return { ...state, ...updates };
};

