export async function handleFetchResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(error.error || 'An error occurred');
  }
  return response.json();
}

export function handleFetchError(error: any) {
  console.error('API Error:', error);
  if (error.message === 'Token expired' || error.message === 'Invalid token') {
    // Clear invalid token and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
    return { error: 'Session expired. Please login again.' };
  }
  return { error: error.message || 'An error occurred. Please try again.' };
}
