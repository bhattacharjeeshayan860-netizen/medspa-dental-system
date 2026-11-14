export { apiConfig as API_CONFIG } from '../api/client';

import { apiConfig } from '../api/client';

export const API_URLS = Object.fromEntries(
  Object.entries(apiConfig.webhooks).map(([name, path]) => [name, `${apiConfig.baseUrl}${path}`])
);