import { writeFileSync } from 'fs';
import {
	array,
	boolean,
	filterItems,
	type InferOutput,
	number,
	object,
	parse,
	pipe,
	safeParse,
	string,
	transform
} from 'valibot';
import { LyricSchema } from './legacy/schemas.js';

const playlists = new Map([
	[2023, 'genre_period_DS101_0175'],
	[2022, 'genre_period_DS101_0174'],
	[2021, 'genre_period_DS101_0173'],
	[2020, 'genre_period_DS101_0147'],
	[2019, 'genre_period_DS101_0128'],
	[2018, 'genre_period_DS101_0082'],
	[2017, 'genre_period_DS101_0081'],
	[2016, 'genre_period_DS101_0083'],
	[2015, 'genre_period_DS101_0084'],
	[2014, 'genre_period_DS101_0085']
]);

const TracksSchema = pipe(
	object({
		response: object({
			result: object({
				playlist: object({
					tracks: pipe(
						array(
							pipe(
								object({
									trackId: number(),
									trackTitle: string(),
									artists: array(object({ artistName: string() })),
									album: object({ imageUrl: string() }),
									hasLyric: boolean()
								}),
								transform(({ artists, album, ...track }) => ({
									...track,
									artist: artists.map(({ artistName }) => artistName).join(', '),
									albumImageUrl: album.imageUrl
								}))
							)
						),
						transform((arr) => arr.slice(0, 20)),
						filterItems((track) => track.hasLyric)
					)
				})
			})
		})
	}),
	transform((v) => v.response.result.playlist.tracks)
);

type Track = InferOutput<typeof TracksSchema>[number];
const tracks: Record<number, Track> = {};

for (const [year, playlist] of playlists) {
	const pUrl = `https://apis.naver.com/vibeWeb/musicapiweb/vibe/v3/playlist/${playlist}.json`;
	const pResponse = await fetch(pUrl);
	if (!pResponse.ok) throw new Error(`Failed to fetch year ${year}`);
	const rawTracks = parse(TracksSchema, await pResponse.json());
	for (const rawTrack of rawTracks) {
		const { trackId } = rawTrack;
		tracks[trackId] = rawTrack;
		const lUrl = `https://apis.naver.com/vibeWeb/musicapiweb/vibe/v4/lyric/${trackId}.json`;
		const lResponse = await fetch(lUrl);
		if (!lResponse.ok) throw new Error(`Failed to fetch lyric ${rawTrack.trackId}`);
		const parsedLyric = safeParse(LyricSchema, await lResponse.json());
		if (parsedLyric.success && parsedLyric.output.text)
			writeFileSync(import.meta.dirname + `/lyrics/${trackId}.txt`, parsedLyric.output.text);
	}
}

writeFileSync('src/routes/crawled.json', JSON.stringify(tracks, null, '\t'));
