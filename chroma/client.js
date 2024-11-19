import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import { env, loadEnvFile } from 'node:process';

loadEnvFile('.env');

if (!env.OPEN_AI_API_KEY) throw new Error('OPEN_AI_API_KEY is required');

export const client = new ChromaClient();
export const embeddingFunction = new OpenAIEmbeddingFunction({ openai_api_key: env.OPEN_AI_API_KEY });
export const collection = await client.getOrCreateCollection({ name: 'younha', embeddingFunction });
