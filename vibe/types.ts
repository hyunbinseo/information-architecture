import { InferOutput } from 'valibot';
import { artists } from './crawl.js';
import type { LyricSchema } from './schemas.js';

export type Track = {
	artistId: keyof typeof artists;
	albumTitle: string;
	releaseDate: string;
	trackTitle: string;
	discNumber: number;
	trackNumber: number;
	trackId: number;
	lyric: InferOutput<typeof LyricSchema>;
};
