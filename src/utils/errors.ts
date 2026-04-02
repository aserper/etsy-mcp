export class EtsyApiError extends Error {
  constructor(
    public status: number,
    public errorBody: unknown,
    message?: string
  ) {
    super(message ?? `Etsy API error (${status})`);
    this.name = "EtsyApiError";
  }
}
