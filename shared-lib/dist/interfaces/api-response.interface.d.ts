/**
 * Standard API Response Interface
 * Used for consistent API responses across all applications
 */
export interface IApiResponse<T = any> {
    code: number;
    message: string;
    data: T | null;
    path?: string;
    timestamp?: string;
}
export interface IServerResponse<T = any> {
    code: number;
    message: string;
    data: T | null;
}
export interface IPaginatedResponse<T> {
    code: number;
    message: string;
    data: {
        records: T[];
        total: number;
        page: number;
        pageSize: number;
    };
}
//# sourceMappingURL=api-response.interface.d.ts.map