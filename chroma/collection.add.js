import { globSync, readFileSync } from 'node:fs';
import { collection } from './client';

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
