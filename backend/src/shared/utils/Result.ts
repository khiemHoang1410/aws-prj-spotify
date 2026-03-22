export type Result<T> =

    | { success: true; data: T }
    | { success: false; error: string; code?: number };

export const Success = <T>(data: T): Result<T> => ({ success: true, data });
export const Failure = (error: string, code = 400): Result<never> => ({ 
    success: false, 
    error, 
    code 
});
