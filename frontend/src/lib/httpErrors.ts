/* frontend/src/lib/httpErrors.ts */
export function messageForStatus(status?: number) {
  if (!status) return "An unexpected error occurred.";
  if (status === 401) return "Session expired. Please sign in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "Not found.";
  if (status >= 500) return "We hit a server error. Please try again.";
  return "Request failed. Please try again.";
}
