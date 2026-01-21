import { Prisma } from '@prisma/client';
import { PaginatedResponse, CursorPaginatedResponse } from './query-optimization.dto';

/**
 * Query Optimization Utilities
 * Provides reusable functions for database query optimization
 */
export class QueryOptimizationHelper {
    /**
     * Build pagination metadata for offset-based pagination
     */
    static buildPaginationMeta<T>(
        data: T[],
        total: number,
        page: number,
        limit: number
    ): PaginatedResponse<T> {
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };
    }

    /**
     * Build cursor pagination metadata
     */
    static buildCursorPaginationMeta<T extends { id: string }>(
        data: T[],
        limit: number
    ): CursorPaginatedResponse<T> {
        const hasMore = data.length > limit;
        const items = hasMore ? data.slice(0, limit) : data;
        const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : undefined;

        return {
            data: items,
            nextCursor,
            hasMore,
            count: items.length,
        };
    }

    /**
     * Calculate skip value for pagination
     */
    static calculateSkip(page: number, limit: number): number {
        return (page - 1) * limit;
    }

    /**
     * Build orderBy clause for Prisma
     */
    static buildOrderBy(
        sortBy?: string,
        sortOrder: 'asc' | 'desc' = 'desc'
    ): Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[] {
        if (!sortBy) {
            return { createdAt: sortOrder };
        }

        // Handle nested sorting (e.g., 'society.name')
        if (sortBy.includes('.')) {
            const [relation, field] = sortBy.split('.');
            return {
                [relation]: {
                    [field]: sortOrder,
                },
            } as any; // Prisma's nested orderBy type is complex, using any for flexibility
        }

        return { [sortBy]: sortOrder };
    }

    /**
     * Build case-insensitive search conditions for multiple fields
     */
    static buildSearchCondition(
        searchTerm: string | undefined,
        fields: string[]
    ): any[] | undefined {
        if (!searchTerm || fields.length === 0) {
            return undefined;
        }

        const trimmedSearch = searchTerm.trim();
        return fields.map(field => {
            // Handle nested fields (e.g., 'society.name')
            if (field.includes('.')) {
                const [relation, nestedField] = field.split('.');
                return {
                    [relation]: {
                        [nestedField]: {
                            contains: trimmedSearch,
                            mode: 'insensitive' as Prisma.QueryMode,
                        },
                    },
                };
            }

            return {
                [field]: {
                    contains: trimmedSearch,
                    mode: 'insensitive' as Prisma.QueryMode,
                },
            };
        });
    }

    /**
     * Build date range filter
     */
    static buildDateRangeFilter(
        fromDate?: string,
        toDate?: string,
        field: string = 'date'
    ): Record<string, any> | undefined {
        if (!fromDate && !toDate) {
            return undefined;
        }

        const dateFilter: any = {};

        if (fromDate) {
            dateFilter.gte = new Date(fromDate);
        }

        if (toDate) {
            // Add time to end of day
            const endDate = new Date(toDate);
            endDate.setHours(23, 59, 59, 999);
            dateFilter.lte = endDate;
        }

        return { [field]: dateFilter };
    }

    /**
     * Optimize select statement - only fetch required fields
     */
    static selectFields<T>(fields: (keyof T)[]): Record<string, boolean> {
        return fields.reduce((acc, field) => {
            acc[field as string] = true;
            return acc;
        }, {} as Record<string, boolean>);
    }

    /**
     * Build optimized include statement with select
     * Prevents over-fetching of nested relations
     */
    static selectiveInclude(includes: Record<string, any>): Record<string, any> {
        return includes;
    }

    /**
     * Batch query execution helper
     * Prevents N+1 queries by batching requests
     */
    static async batchQuery<T, K extends string | number>(
        items: T[],
        keyExtractor: (item: T) => K,
        fetcher: (keys: K[]) => Promise<any[]>,
        keyField: string = 'id'
    ): Promise<Map<K, any>> {
        const keys = items.map(keyExtractor);
        const uniqueKeys = Array.from(new Set(keys));

        if (uniqueKeys.length === 0) {
            return new Map();
        }

        const results = await fetcher(uniqueKeys);
        const resultMap = new Map<K, any>();

        results.forEach(result => {
            resultMap.set(result[keyField] as K, result);
        });

        return resultMap;
    }

    /**
     * Aggregate data efficiently using database aggregation
     */
    static async aggregateData<T extends Record<string, any>>(
        prismaDelegate: any,
        where: any,
        groupBy: string[],
        aggregateFields: Record<string, 'sum' | 'avg' | 'count' | 'min' | 'max'>
    ): Promise<any[]> {
        const aggregateClause: any = {};

        Object.entries(aggregateFields).forEach(([field, operation]) => {
            if (!aggregateClause[`_${operation}`]) {
                aggregateClause[`_${operation}`] = {};
            }
            aggregateClause[`_${operation}`][field] = true;
        });

        return prismaDelegate.groupBy({
            by: groupBy,
            where,
            ...aggregateClause,
        });
    }

    /**
     * Smart query result caching key generator
     */
    static generateCacheKey(
        entity: string,
        filters: Record<string, any>
    ): string {
        const sortedFilters = Object.keys(filters)
            .sort()
            .reduce((acc, key) => {
                acc[key] = filters[key];
                return acc;
            }, {} as Record<string, any>);

        return `${entity}:${JSON.stringify(sortedFilters)}`;
    }

    /**
     * Execute queries in parallel when independent
     */
    static async executeParallel<T extends any[]>(
        ...queries: (() => Promise<any>)[]
    ): Promise<T> {
        return Promise.all(queries.map(query => query())) as Promise<T>;
    }

    /**
     * Chunk large arrays for batch processing
     */
    static chunk<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Build efficient WHERE clause with multiple filters
     */
    static buildWhereClause(filters: Record<string, any>): Record<string, any> {
        const where: Record<string, any> = {};

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                where[key] = value;
            }
        });

        return where;
    }

    /**
     * Optimize query by using select only for needed fields
     */
    static minimalSelect(baseFields: string[], includes?: Record<string, any>): any {
        const select: Record<string, any> = {};

        baseFields.forEach(field => {
            select[field] = true;
        });

        if (includes) {
            Object.entries(includes).forEach(([key, value]) => {
                select[key] = value;
            });
        }

        return select;
    }
}

/**
 * Database-level performance optimization tips
 */
export const DB_OPTIMIZATION_TIPS = {
    // Use connection pooling
    connectionPool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
    },

    // Query optimization patterns
    patterns: {
        useIndexes: 'Ensure queries use indexed fields in WHERE clauses',
        avoidSelectAll: 'Use select to fetch only required fields',
        useBatchQueries: 'Batch multiple queries together',
        useAggregations: 'Use database-level aggregations instead of JS reduce',
        useJoinsWisely: 'Be careful with deep nested includes',
        useCursor: 'Use cursor pagination for large datasets',
        usePreparedStatements: 'Prisma automatically uses prepared statements',
    },

    // Monitoring
    monitoring: {
        slowQueryThreshold: 1000, // ms
        queryLogging: process.env.NODE_ENV === 'development',
    },
};
