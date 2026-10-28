import { logger } from '../utils/logger.js';

export const getOllamaConfig = () => ({
  baseUrl: (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/+$/, ''),
  chatModel: process.env.CHAT_MODEL || 'llama3.2:3b',
  embedModel: process.env.EMBED_MODEL || 'embeddinggemma'
});

/**
 * Checks if local Ollama daemon is running and lists installed models
 */
export const checkOllamaHealth = async () => {
  const { baseUrl, chatModel, embedModel } = getOllamaConfig();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        isAvailable: false,
        url: baseUrl,
        error: `Ollama service returned HTTP status ${response.status}`,
        models: [],
        hasChatModel: false,
        hasEmbedModel: false
      };
    }

    const data = await response.json();
    const installedModels = (data.models || []).map((m) => m.name);

    const hasChatModel = installedModels.some(
      (m) => m === chatModel || m.startsWith(`${chatModel}:`) || m === `${chatModel}:latest`
    );
    const hasEmbedModel = installedModels.some(
      (m) => m === embedModel || m.startsWith(`${embedModel}:`) || m === `${embedModel}:latest`
    );

    return {
      isAvailable: true,
      url: baseUrl,
      error: null,
      models: installedModels,
      chatModel,
      embedModel,
      hasChatModel,
      hasEmbedModel
    };
  } catch (error) {
    let msg = error.message;
    if (error.name === 'AbortError') {
      msg = `Connection to Ollama timed out at ${baseUrl}`;
    } else if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      msg = `Ollama is offline or not running at ${baseUrl}`;
    }
    return {
      isAvailable: false,
      url: baseUrl,
      error: msg,
      models: [],
      chatModel,
      embedModel,
      hasChatModel: false,
      hasEmbedModel: false
    };
  }
};

/**
 * Generates vector embedding for text using Ollama
 * @param {string} text
 * @param {string} [modelOverride]
 * @returns {Promise<number[]>}
 */
export const generateEmbedding = async (text, modelOverride = null) => {
  const { baseUrl, embedModel } = getOllamaConfig();
  const model = modelOverride || embedModel;

  if (!text || !text.trim()) {
    throw new Error('Cannot generate embedding for empty text');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // Try modern /api/embed first
    const embedRes = await fetch(`${baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        input: text.trim()
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (embedRes.ok) {
      const data = await embedRes.json();
      if (Array.isArray(data.embeddings) && data.embeddings.length > 0) {
        return data.embeddings[0];
      }
    }

    // Fallback to classic /api/embeddings
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 20000);

    const legacyRes = await fetch(`${baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: text.trim()
      }),
      signal: controller2.signal
    });

    clearTimeout(timeoutId2);

    if (!legacyRes.ok) {
      const errText = await legacyRes.text().catch(() => '');
      if (legacyRes.status === 404) {
        throw new Error(`Embedding model '${model}' is not pulled in Ollama. Run: 'ollama pull ${model}' in your terminal.`);
      }
      throw new Error(`Ollama embedding error (${legacyRes.status}): ${errText || legacyRes.statusText}`);
    }

    const legacyData = await legacyRes.json();
    if (Array.isArray(legacyData.embedding)) {
      return legacyData.embedding;
    }

    throw new Error('Unexpected embedding response format from Ollama');
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Ollama embedding generation timed out after 20 seconds at ${baseUrl}`);
    }
    if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      throw new Error(`Ollama is not running. Please start Ollama locally and pull '${model}' (Command: ollama pull ${model}).`);
    }
    throw error;
  }
};

/**
 * Executes chat generation with context using Ollama
 * @param {Array<{role: string, content: string}>} messages
 * @param {Object} [options]
 * @returns {Promise<string>}
 */
export const generateChatResponse = async (messages, options = {}) => {
  const { baseUrl, chatModel } = getOllamaConfig();
  const model = options.model || chatModel;
  const timeoutMs = options.timeoutMs || 90000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: options.temperature !== undefined ? options.temperature : 0.1,
          num_predict: options.maxTokens || 1024
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      if (response.status === 404) {
        throw new Error(`Chat model '${model}' is not pulled in Ollama. Run: 'ollama run ${model}' in your terminal.`);
      }
      throw new Error(`Ollama chat error (${response.status}): ${errText || response.statusText}`);
    }

    const data = await response.json();
    if (data.message && data.message.content) {
      return data.message.content.trim();
    }

    throw new Error('Invalid chat response structure returned from Ollama');
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Ollama chat request timed out after ${timeoutMs / 1000} seconds`);
    }
    if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      throw new Error(`Ollama is not running at ${baseUrl}. Please start the Ollama application.`);
    }
    throw error;
  }
};
