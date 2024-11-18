import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
import { globSync, readFileSync } from 'node:fs';
import { env, loadEnvFile } from 'node:process';

loadEnvFile('.env');

if (!env.OPEN_AI_API_KEY) throw new Error('OPEN_AI_API_KEY is required');

const client = new ChromaClient();
const embeddingFunction = new OpenAIEmbeddingFunction({ openai_api_key: env.OPEN_AI_API_KEY });
const collection = await client.getOrCreateCollection({ name: 'younha', embeddingFunction });

for await (const path of globSync('./vibe/tracks/*.json')) {

	const id = path.split('/').pop()?.replace('.json', '');
	if (!id) continue;

	/** @type {import('../vibe/track').Track} */
	const { lyric, ...track } = JSON.parse(readFileSync(path, 'utf-8'))
	if (!lyric.normalLyric?.text) continue;

	await collection.add({
		ids: [id],
		metadatas: [track],
		documents: [lyric.normalLyric.text]
	});
}
