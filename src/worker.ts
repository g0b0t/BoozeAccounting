import { errorJson } from '../functions/_lib/response';
import type { Env as AuthEnv } from '../functions/_lib/auth';
import { onRequestPost as authPost } from '../functions/api/auth';
import { onRequestGet as crewGet, onRequestPost as crewPost } from '../functions/api/crew';
import { onRequestPost as crewJoinPost } from '../functions/api/crew/join';
import { onRequestGet as crewDetailGet } from '../functions/api/crew/[crewId]/index';
import { onRequestGet as crewMembersGet } from '../functions/api/crew/[crewId]/members';
import { onRequestGet as crewSummaryGet } from '../functions/api/crew/[crewId]/summary';
import { onRequestGet as crewProductsGet, onRequestPost as crewProductsPost } from '../functions/api/crew/[crewId]/products';
import { onRequestPut as crewProductPut } from '../functions/api/crew/[crewId]/products/[productId]';
import { onRequestPost as crewProductArchivePost } from '../functions/api/crew/[crewId]/products/[productId]/archive';
import {
  onRequestDelete as crewEntriesDelete,
  onRequestGet as crewEntriesGet,
  onRequestPost as crewEntriesPost
} from '../functions/api/crew/[crewId]/entries';
import { onRequestPost as crewEntriesUndoPost } from '../functions/api/crew/[crewId]/entries/undo';
import { onRequestGet as crewSessionsActiveGet } from '../functions/api/crew/[crewId]/sessions/active';
import { onRequestPost as crewSessionsStartPost } from '../functions/api/crew/[crewId]/sessions/start';
import { onRequestPost as crewSessionsEndPost } from '../functions/api/crew/[crewId]/sessions/[sessionId]/end';
import { onRequestGet as crewOnThisDayGet } from '../functions/api/crew/[crewId]/stats/onthisday';
import {
  onRequestGet as crewSuggestionsGet,
  onRequestPost as crewSuggestionsPost
} from '../functions/api/crew/[crewId]/suggestions';
import { onRequestPost as crewSuggestionApprovePost } from '../functions/api/crew/[crewId]/suggestions/[suggestionId]/approve';
import { onRequestPost as crewSuggestionRejectPost } from '../functions/api/crew/[crewId]/suggestions/[suggestionId]/reject';
import { onRequestGet as profileGet, onRequestPut as profilePut } from '../functions/api/profile';

interface WorkerEnv extends AuthEnv {
  ASSETS: Fetcher;
}

type PagesHandler = (context: {
  request: Request;
  env: AuthEnv;
  params: Record<string, string>;
}) => Response | Promise<Response>;

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

async function dispatch(handler: PagesHandler, request: Request, env: AuthEnv, params: Record<string, string>): Promise<Response> {
  return handler({ request, env, params });
}

async function handleApi(request: Request, env: AuthEnv): Promise<Response | null> {
  const url = new URL(request.url);
  const path = normalizePath(url.pathname);
  const method = request.method.toUpperCase();

  if (!path.startsWith('/api/')) {
    return null;
  }

  if (path === '/api/auth') {
    if (method === 'POST') {
      return dispatch(authPost, request, env, {});
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  if (path === '/api/profile') {
    if (method === 'GET') {
      return dispatch(profileGet, request, env, {});
    }
    if (method === 'PUT') {
      return dispatch(profilePut, request, env, {});
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  if (path === '/api/crew') {
    if (method === 'GET') {
      return dispatch(crewGet, request, env, {});
    }
    if (method === 'POST') {
      return dispatch(crewPost, request, env, {});
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  if (path === '/api/crew/join') {
    if (method === 'POST') {
      return dispatch(crewJoinPost, request, env, {});
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewMatch = path.match(/^\/api\/crew\/([^/]+)$/);
  if (crewMatch) {
    if (method === 'GET') {
      return dispatch(crewDetailGet, request, env, { crewId: crewMatch[1] });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewMembersMatch = path.match(/^\/api\/crew\/([^/]+)\/members$/);
  if (crewMembersMatch) {
    if (method === 'GET') {
      return dispatch(crewMembersGet, request, env, { crewId: crewMembersMatch[1] });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewSummaryMatch = path.match(/^\/api\/crew\/([^/]+)\/summary$/);
  if (crewSummaryMatch) {
    if (method === 'GET') {
      return dispatch(crewSummaryGet, request, env, { crewId: crewSummaryMatch[1] });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewProductsMatch = path.match(/^\/api\/crew\/([^/]+)\/products$/);
  if (crewProductsMatch) {
    if (method === 'GET') {
      return dispatch(crewProductsGet, request, env, { crewId: crewProductsMatch[1] });
    }
    if (method === 'POST') {
      return dispatch(crewProductsPost, request, env, { crewId: crewProductsMatch[1] });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewProductMatch = path.match(/^\/api\/crew\/([^/]+)\/products\/([^/]+)$/);
  if (crewProductMatch) {
    if (method === 'PUT') {
      return dispatch(crewProductPut, request, env, { crewId: crewProductMatch[1], productId: crewProductMatch[2] });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewProductArchiveMatch = path.match(/^\/api\/crew\/([^/]+)\/products\/([^/]+)\/archive$/);
  if (crewProductArchiveMatch) {
    if (method === 'POST') {
      return dispatch(crewProductArchivePost, request, env, {
        crewId: crewProductArchiveMatch[1],
        productId: crewProductArchiveMatch[2]
      });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewEntriesMatch = path.match(/^\/api\/crew\/([^/]+)\/entries$/);
  if (crewEntriesMatch) {
    if (method === 'GET') {
      return dispatch(crewEntriesGet, request, env, { crewId: crewEntriesMatch[1] });
    }
    if (method === 'POST') {
      return dispatch(crewEntriesPost, request, env, { crewId: crewEntriesMatch[1] });
    }
    if (method === 'DELETE') {
      return dispatch(crewEntriesDelete, request, env, { crewId: crewEntriesMatch[1] });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewEntriesUndoMatch = path.match(/^\/api\/crew\/([^/]+)\/entries\/undo$/);
  if (crewEntriesUndoMatch) {
    if (method === 'POST') {
      return dispatch(crewEntriesUndoPost, request, env, { crewId: crewEntriesUndoMatch[1] });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewSessionsActiveMatch = path.match(/^\/api\/crew\/([^/]+)\/sessions\/active$/);
  if (crewSessionsActiveMatch) {
    if (method === 'GET') {
      return dispatch(crewSessionsActiveGet, request, env, { crewId: crewSessionsActiveMatch[1] });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewSessionsStartMatch = path.match(/^\/api\/crew\/([^/]+)\/sessions\/start$/);
  if (crewSessionsStartMatch) {
    if (method === 'POST') {
      return dispatch(crewSessionsStartPost, request, env, { crewId: crewSessionsStartMatch[1] });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewSessionsEndMatch = path.match(/^\/api\/crew\/([^/]+)\/sessions\/([^/]+)\/end$/);
  if (crewSessionsEndMatch) {
    if (method === 'POST') {
      return dispatch(crewSessionsEndPost, request, env, {
        crewId: crewSessionsEndMatch[1],
        sessionId: crewSessionsEndMatch[2]
      });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewOnThisDayMatch = path.match(/^\/api\/crew\/([^/]+)\/stats\/onthisday$/);
  if (crewOnThisDayMatch) {
    if (method === 'GET') {
      return dispatch(crewOnThisDayGet, request, env, { crewId: crewOnThisDayMatch[1] });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewSuggestionsMatch = path.match(/^\/api\/crew\/([^/]+)\/suggestions$/);
  if (crewSuggestionsMatch) {
    if (method === 'GET') {
      return dispatch(crewSuggestionsGet, request, env, { crewId: crewSuggestionsMatch[1] });
    }
    if (method === 'POST') {
      return dispatch(crewSuggestionsPost, request, env, { crewId: crewSuggestionsMatch[1] });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewSuggestionApproveMatch = path.match(/^\/api\/crew\/([^/]+)\/suggestions\/([^/]+)\/approve$/);
  if (crewSuggestionApproveMatch) {
    if (method === 'POST') {
      return dispatch(crewSuggestionApprovePost, request, env, {
        crewId: crewSuggestionApproveMatch[1],
        suggestionId: crewSuggestionApproveMatch[2]
      });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  const crewSuggestionRejectMatch = path.match(/^\/api\/crew\/([^/]+)\/suggestions\/([^/]+)\/reject$/);
  if (crewSuggestionRejectMatch) {
    if (method === 'POST') {
      return dispatch(crewSuggestionRejectPost, request, env, {
        crewId: crewSuggestionRejectMatch[1],
        suggestionId: crewSuggestionRejectMatch[2]
      });
    }
    return errorJson('METHOD_NOT_ALLOWED', 'Method not allowed', 405);
  }

  console.warn('API route not found', { method, path });
  return errorJson('NOT_FOUND', 'Route not found', 404);
}

async function serveAssets(request: Request, env: WorkerEnv): Promise<Response> {
  const response = await env.ASSETS.fetch(request);
  if (response.status !== 404) {
    return response;
  }
  const url = new URL(request.url);
  url.pathname = '/index.html';
  return env.ASSETS.fetch(new Request(url.toString(), request));
}

const worker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const apiResponse = await handleApi(request, env);
    if (apiResponse) {
      return apiResponse;
    }
    return serveAssets(request, env);
  }
};

export default worker;
