export type SuccessEnvelope<T> = { data: T };

export type ErrorEnvelope = { error: { code: string; message: string } };

export const success = <T>(data: T): SuccessEnvelope<T> => ({ data });

export const failure = (code: string, message: string): ErrorEnvelope => ({ error: { code, message } });
