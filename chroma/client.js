import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import { loadEnvFile } from 'node:process';
import { object, parse, string } from 'valibot';

loadEnvFile();

const env = parse(
	object({ OPEN_AI_API_KEY: string() }), //
	process.env
);

export const chromaClient = new ChromaClient();

export const embeddingFunction = new OpenAIEmbeddingFunction({
	openai_api_key: env.OPEN_AI_API_KEY
});

export const collection = await chromaClient.getOrCreateCollection({
	name: 'songs',
	embeddingFunction
});
