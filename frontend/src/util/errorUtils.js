export function extractErrorMessages(error) {
  const data = error?.data;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors
      .map(({ field, message }) => (field ? `${field}: ${message}` : message))
      .join('. ');
  }

  return error?.message || 'Something went wrong. Please try again.';
}