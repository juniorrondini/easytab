import type { RuntimeResponse } from '../types';

export async function sendRuntimeMessage<T>(message: unknown): Promise<T> {
  const response = (await chrome.runtime.sendMessage(message)) as RuntimeResponse<T>;
  if (!response?.ok) {
    throw new Error(response?.error || 'Falha ao executar ação.');
  }
  return response.data as T;
}
