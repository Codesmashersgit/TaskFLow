const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status = 0, code = 'NETWORK_ERROR', details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function api(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Could not reach the server. Please verify backend is running on port 5001.', 0, 'NETWORK_ERROR')
  }

  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data?.message || data?.error?.message || 'The request could not be completed.'
    const code = data?.code || data?.error?.code || 'API_ERROR'
    throw new ApiError(message, response.status, code, data)
  }
  return data
}

export function jsonBody(value) {
  return JSON.stringify(value)
}

export async function getDashboardTasks(params = {}) {
  const query = new URLSearchParams()
  if (params.employee && params.employee !== 'All') query.set('employee', params.employee)
  if (params.status && params.status !== 'All') query.set('status', params.status)
  if (params.source && params.source !== 'All') query.set('source', params.source)
  if (params.urgency && params.urgency !== 'All') query.set('urgency', params.urgency)
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.search) query.set('search', params.search)
  if (params.simulateError && params.simulateError !== 'none') query.set('simulateError', params.simulateError)

  const queryString = query.toString() ? `?${query.toString()}` : ''
  return api(`/dashboard/tasks${queryString}`)
}

export async function patchTaskStatus(taskId, status) {
  return api(`/dashboard/tasks/${encodeURIComponent(taskId)}/status`, {
    method: 'PATCH',
    body: jsonBody({ status }),
  })
}

export async function resetMockTasks() {
  return api('/dashboard/reset', { method: 'POST' })
}
