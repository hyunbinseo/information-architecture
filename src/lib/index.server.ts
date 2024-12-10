// place files you want to import through the `$lib` alias in this folder.
import { OPEN_AI_API_KEY } from '$env/static/private';
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';

export const chromaClient = new ChromaClient();

export const embeddingFunction = new OpenAIEmbeddingFunction({
	openai_api_key: OPEN_AI_API_KEY
});

export const collection = await chromaClient.getOrCreateCollection({
	name: 'songs',
	embeddingFunction
});
