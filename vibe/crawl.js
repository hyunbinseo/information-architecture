import { writeFileSync } from 'node:fs';
import * as prettier from 'prettier';
import { parse, safeParse } from 'valibot';
import { AlbumsSchema, LyricSchema, TracksSchema } from './schemas.js';

export const artists = /** @type {const} */ ({
	15649: '윤하',
	112579: '아이유(IU)',
	243100: 'AKMU(악뮤)',
});

/** @type {Array<keyof typeof artists>} */
const artistIds = [15649, 112579, 243100];

for await (const artistId of new Set(artistIds)) {
	/** @type {import('valibot').InferOutput<typeof AlbumsSchema>} */
	const allAlbums = [];

	for await (const type of ['REGULAR', 'SINGLE_AND_EP']) {
		const response = await fetch(
			`https://apis.naver.com/vibeWeb/musicapiweb/v3/musician/artist/${artistId}/albums?start=1&display=1000&type=${type}&sort=newRelease`,
			{ headers: { Accept: 'application/json' } },
		);

		if (!response.ok) continue;

		const albums = parse(AlbumsSchema, await response.json());
		albums.forEach((album) => allAlbums.push(album));
	}

	writeFileSync(
		`${import.meta.dirname}/artists/${artistId}.json`,
		JSON.stringify(allAlbums, null, '\t'),
	);

	for await (const { albumId, albumTitle, releaseDate } of allAlbums) {
		const response = await fetch(
			`https://apis.naver.com/vibeWeb/musicapiweb/album/${albumId}/tracks?start=1&display=1000`,
			{ headers: { Accept: 'application/json' } },
		);

		if (!response.ok) continue;

		const tracks = parse(TracksSchema, await response.json());

		for await (const { trackId, trackTitle, discNumber, trackNumber } of tracks) {
			if (trackTitle.toLowerCase().includes('inst')) continue;

			const response = await fetch(
				`https://apis.naver.com/vibeWeb/musicapiweb/vibe/v4/lyric/${trackId}`,
				{ headers: { Accept: 'application/json' } },
			);

			if (!response.ok) continue;

			const parsedLyric = safeParse(LyricSchema, await response.json());
			if (!parsedLyric.success) {
				// Tracks might not have lyrics.
				// e.g. https://apis.naver.com/vibeWeb/musicapiweb/vibe/v4/lyric/2122791
				// 2122791, 2005838, 2005841, 2005845, 2005846, 1903124, 1903129, 1903130
				console.error(`Failed to parse lyric for track ${trackId}`);
				continue;
			}

			/** @type {import('./types.js').Track} */
			const track = {
				artistId,
				albumTitle,
				releaseDate,
				trackTitle,
				discNumber,
				trackNumber,
				trackId,
				lyric: parsedLyric.output,
			};

			writeFileSync(
				`${import.meta.dirname}/tracks/${trackId}.json`,
				await prettier.format(JSON.stringify(track), {
					parser: 'json',
					useTabs: true,
				}),
			);
		}
	}
}
