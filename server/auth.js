import { ServiceError } from '../src/projectService.js'

// Server-only. No service-role key or client-provided user ID is used for Auth.
export function readAuthConfiguration(env = process.env) {
  if (env.IEUM_AUTH_PROVIDER !== 'supabase' || !env.IEUM_SUPABASE_URL || !env.IEUM_SUPABASE_PUBLISHABLE_KEY) throw new ServiceError('인증 서비스가 아직 연결되지 않았어요.', { status: 503, code: 'SERVICE_NOT_CONFIGURED' })
  let url
  try { url = new URL(env.IEUM_SUPABASE_URL) } catch { throw new ServiceError('인증 서비스 설정을 확인해야 해요.', { status: 503, code: 'INVALID_SERVICE_CONFIGURATION' }) }
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.username || url.password || url.search || url.hash) throw new ServiceError('인증 서비스 설정을 확인해야 해요.', { status: 503, code: 'INVALID_SERVICE_CONFIGURATION' })
  return { url: url.origin, publishableKey: env.IEUM_SUPABASE_PUBLISHABLE_KEY }
}

export async function verifyRequestUser(request, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const authorization = request.headers.get('authorization')
  const match = /^Bearer ([^\s,]+)$/i.exec(authorization || '')
  if (!match || match[1].length > 16384) throw new ServiceError('로그인이 필요해요.', { status: 401, code: 'AUTH_REQUIRED' })
  const configuration = readAuthConfiguration(env)
  let response
  try {
    response = await fetchImpl(`${configuration.url}/auth/v1/user`, {
      method: 'GET', redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${match[1]}`, apikey: configuration.publishableKey, Accept: 'application/json' }
    })
  } catch { throw new ServiceError('인증 서버에 연결하지 못했어요.', { status: 503, code: 'AUTH_UNAVAILABLE' }) }
  if ([401, 403].includes(response.status)) throw new ServiceError('로그인을 다시 확인해 주세요.', { status: 401, code: 'AUTH_REQUIRED' })
  if (!response.ok) throw new ServiceError('인증 서버에 연결하지 못했어요.', { status: 503, code: 'AUTH_UNAVAILABLE' })
  let user
  try { user = await response.json() } catch { throw new ServiceError('인증 응답을 확인할 수 없어요.', { status: 503, code: 'INVALID_AUTH_RESPONSE' }) }
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(user?.id || '')) throw new ServiceError('인증 응답을 확인할 수 없어요.', { status: 503, code: 'INVALID_AUTH_RESPONSE' })
  return { id: user.id }
}

export function sessionResponse(user) {
  return Response.json({ authenticated: true, user: { id: user.id } }, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } })
}

export function serviceErrorResponse(error) {
  // Only explicit codes/statuses; upstream bodies, URLs and tokens stay private.
  const allowed = ['AUTH_REQUIRED', 'SERVICE_NOT_CONFIGURED', 'INVALID_SERVICE_CONFIGURATION', 'AUTH_UNAVAILABLE', 'INVALID_AUTH_RESPONSE']
  const code = allowed.includes(error?.code) ? error.code : 'SERVICE_ERROR'
  if (code === 'SERVICE_ERROR') console.error('IEUM session request failed', { code })
  return Response.json({ error: { code } }, { status: code === 'AUTH_REQUIRED' ? 401 : 503, headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } })
}
