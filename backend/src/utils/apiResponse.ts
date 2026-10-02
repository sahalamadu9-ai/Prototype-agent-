export function apiSuccess<T>(data: T, requestId = crypto.randomUUID()) {
  return {
    success: true,
    data,
    error: null,
    requestId,
  };
}

export function apiError(
  code: string,
  message: string,
  details: Record<string, unknown> | null = null,
  requestId = crypto.randomUUID(),
) {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
    requestId,
  };
}
