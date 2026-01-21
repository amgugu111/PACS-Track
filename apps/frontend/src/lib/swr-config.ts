import { SWRConfiguration } from 'swr';

// Global SWR configuration for optimized caching
export const swrConfig: SWRConfiguration = {
    // Dedupe requests within 2 seconds (prevents duplicate calls)
    dedupingInterval: 2000,

    // Cache data for 5 minutes before considering it stale
    focusThrottleInterval: 300000,

    // Revalidate on focus (when user returns to tab)
    revalidateOnFocus: true,

    // Revalidate on network reconnect
    revalidateOnReconnect: true,

    // Don't revalidate on mount if data exists (use cache first)
    revalidateIfStale: false,

    // Keep previous data while revalidating (smooth UX)
    keepPreviousData: true,

    // Error retry configuration
    errorRetryCount: 3,
    errorRetryInterval: 5000,
};

// Different config for frequently changing data (like gate entries)
export const dynamicDataConfig: SWRConfiguration = {
    dedupingInterval: 1000,
    revalidateOnFocus: true,
    revalidateIfStale: true,
    focusThrottleInterval: 60000, // 1 minute
};

// Config for static/rarely changing data (like districts, seasons)
export const staticDataConfig: SWRConfiguration = {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    focusThrottleInterval: 3600000, // 1 hour
};
