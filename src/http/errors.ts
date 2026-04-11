/**
 * Error handling for SW Combine SDK
 */

export type SWCErrorType =
  | 'auth'
  | 'rate_limit'
  | 'not_found'
  | 'validation'
  | 'server'
  | 'network'
  | 'unknown';

export interface SWCErrorOptions {
  type: SWCErrorType;
  statusCode?: number;
  requestId?: string;
  response?: Record<string, unknown>;
  retryable?: boolean;
  retryAfter?: number;
  cause?: Error;
}

/**
 * Custom error class for SW Combine API errors
 */
export class SWCError extends Error {
  /** Error type discriminator */
  public readonly type: SWCErrorType;
  /** HTTP status code if applicable */
  public readonly statusCode?: number;
  /** Request ID from API response */
  public readonly requestId?: string;
  /** Original API error response */
  public readonly response?: Record<string, unknown>;
  /** Whether this error can be retried */
  public readonly retryable: boolean;
  /** Seconds to wait before retrying (for rate limit errors) */
  public readonly retryAfter?: number;
  /** Original error that caused this error */
  public readonly cause?: Error;

  constructor(message: string, options: SWCErrorOptions) {
    super(message);
    this.name = 'SWCError';
    this.type = options.type;
    this.statusCode = options.statusCode;
    this.requestId = options.requestId;
    this.response = options.response;
    this.retryable = options.retryable ?? this.determineRetryable(options.type, options.statusCode);
    this.retryAfter = options.retryAfter;
    this.cause = options.cause;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SWCError);
    }
  }

  /**
   * Determine if an error is retryable based on type and status code
   */
  private determineRetryable(type: SWCErrorType, statusCode?: number): boolean {
    // Network errors are always retryable
    if (type === 'network') {
      return true;
    }

    // Server errors (5xx) are retryable
    if (type === 'server' || (statusCode && statusCode >= 500 && statusCode < 600)) {
      return true;
    }

    // Rate limit errors are technically retryable (with backoff)
    if (type === 'rate_limit') {
      return true;
    }

    // Everything else is not retryable
    return false;
  }

  /**
   * Create an error from an HTTP status code and response
   */
  static fromHttpResponse(
    statusCode: number,
    response: Record<string, unknown> | undefined,
    requestId?: string
  ): SWCError {
    let type: SWCErrorType;
    let message: string;

    // SW Combine wraps error details inside a `swcapi` envelope on error
    // responses, e.g.:
    //   { version, timestamp, resource, request,
    //     swcapi: { error_code: 403, error_message: "Required permission: X" } }
    // The success path in HttpClient unwraps the swcapi envelope; the error
    // path does not (we want to keep the raw envelope around for debugging).
    // Look inside the envelope for message-bearing fields while still
    // falling back to top-level fields for non-swcapi error shapes.
    const swcapi =
      response && typeof response.swcapi === 'object' && response.swcapi !== null
        ? (response.swcapi as Record<string, unknown>)
        : undefined;
    const envelope: Record<string, unknown> | undefined = swcapi ?? response;

    // Check if this is a rate limit error (SW Combine uses HTTP 400 for rate limiting)
    const isRateLimitError =
      statusCode === 400 &&
      (envelope?.error === 'rate_limit_exceeded' ||
        (typeof envelope?.message === 'string' &&
          envelope.message.toLowerCase().includes('rate limit')) ||
        (typeof envelope?.error_description === 'string' &&
          envelope.error_description.toLowerCase().includes('rate limit')));

    // Determine error type from status code and content
    if (isRateLimitError) {
      type = 'rate_limit';
      message = 'Rate limit exceeded. Please wait before making more requests.';
    } else {
      switch (statusCode) {
        case 401:
          type = 'auth';
          message = 'Authentication failed. Check your credentials or token.';
          break;
        case 403:
          type = 'auth';
          message = 'Forbidden. You do not have permission to access this resource.';
          break;
        case 404:
          type = 'not_found';
          message = 'Resource not found.';
          break;
        case 400:
        case 422:
          type = 'validation';
          message = 'Invalid request parameters.';
          break;
        case 429:
          type = 'rate_limit';
          message = 'Rate limit exceeded. Please wait before making more requests.';
          break;
        default:
          if (statusCode >= 500) {
            type = 'server';
            message = 'Server error occurred. Please try again later.';
          } else {
            type = 'unknown';
            message = 'An unknown error occurred.';
          }
      }
    }

    // Use error message from response if available. Prefer
    // swcapi.error_message since SW Combine puts its specific error text
    // there (e.g. "Required permission: faction_datacards_read; Available
    // permissions: character_read"). Fall back to generic OAuth-style
    // fields for other error shapes.
    if (typeof envelope?.error_message === 'string') {
      message = envelope.error_message;
    } else if (typeof envelope?.error_description === 'string') {
      message = envelope.error_description;
    } else if (typeof envelope?.message === 'string') {
      message = envelope.message;
    } else if (envelope?.error) {
      message = typeof envelope.error === 'string' ? envelope.error : message;
    }

    // Extract retry-after header for rate limit errors
    const retryAfter =
      type === 'rate_limit' && typeof envelope?.retry_after === 'number'
        ? envelope.retry_after
        : undefined;

    return new SWCError(message, {
      type,
      statusCode,
      requestId,
      response,
      retryAfter,
    });
  }

  /**
   * Create an error from a network failure
   */
  static fromNetworkError(error: Error): SWCError {
    return new SWCError(`Network error: ${error.message}`, {
      type: 'network',
      retryable: true,
      cause: error,
    });
  }

  /**
   * Check if an error is a SWCError
   */
  static isSWCError(error: unknown): error is SWCError {
    return error instanceof SWCError;
  }

  /**
   * Get a user-friendly error message
   */
  toUserFriendlyMessage(): string {
    switch (this.type) {
      case 'auth':
        return 'Authentication failed. Please check your credentials and try again.';
      case 'rate_limit':
        return this.retryAfter
          ? `Rate limit exceeded. Please wait ${this.retryAfter} seconds before trying again.`
          : 'Rate limit exceeded. Please wait before making more requests.';
      case 'not_found':
        return 'The requested resource was not found.';
      case 'validation':
        return 'Invalid request. Please check your parameters and try again.';
      case 'server':
        return 'A server error occurred. Please try again later.';
      case 'network':
        return 'Network connection failed. Please check your internet connection and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}
