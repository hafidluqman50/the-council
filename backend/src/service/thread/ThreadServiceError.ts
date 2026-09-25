export class ThreadServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
