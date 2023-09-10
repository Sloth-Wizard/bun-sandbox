export interface BRsp {
    api: "Bun-Sandbox/v0.0.1";
    data?: Record<string, any>;
    error?: {
        code: number;
        message: string;
    };
}
