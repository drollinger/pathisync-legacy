import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch'
import config from './config'

export default function pathifyFetch(
  path: RequestInfo,
  options?: RequestInit,
): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    'flow-token': config.pathify_token,
    ...options?.headers
  }
  return fetch(config.baseUrl + path, {
    ...options,
    headers
  })
}
