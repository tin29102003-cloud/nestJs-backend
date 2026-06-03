export class PaginationHelper{
   static getParams(maxLimit: number, page?: string, limit?: string) {
        const pageSafe = Math.max(1, Number(page) || 1);
        const limitSafe = Math.max(1, Math.min(Number(limit) || maxLimit, maxLimit));
        return {
            pageSafe,
            limitSafe,
            offset: (pageSafe - 1) * limitSafe
        };
    }

    static buildResult<T>(rows: T[], totalItems: number, limit: number, page: number) {
        return {
            data: rows,
            pagination: {
                currentPage: page,
                limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit)
            }
        };
    }

}