import { globSync, readFileSync } from 'node:fs';
import { collection } from '../chroma/client.js';

for await (const path of globSync('./vibe/lyrics/*.txt')) {
	const id = path.split('/').pop()?.replace('.txt', '');
	if (!id) continue;
	await collection.add({
		ids: [id],
		documents: [readFileSync(path, 'utf-8')]
	});
}
