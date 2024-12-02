import { InferOutput } from 'valibot';
import { artists } from './crawl.js';
import type { LyricSchema } from './schemas.js';

type Lyric = InferOutput<typeof LyricSchema>;

export type Track = {
	artistId: keyof typeof artists;
	albumTitle: string;
	releaseDate: string;
	trackTitle: string;
	discNumber: number;
	trackNumber: number;
	trackId: number;
	lyric: Lyric;
};
