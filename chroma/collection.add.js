import { globSync, readFileSync } from 'node:fs';
import { collection } from './client.js';

for await (const path of globSync('./vibe/tracks/*.json')) {

	const id = path.split('/').pop()?.replace('.json', '');
	if (!id) continue;

	/** @type {import('../vibe/types').Track} */
	const { lyric, ...track } = JSON.parse(readFileSync(path, 'utf-8'))

	await collection.add({
		ids: [id],
		metadatas: [track],
		documents: [lyric.text]
	});
}
