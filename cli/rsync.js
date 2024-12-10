import { execSync } from 'node:child_process';
import { loadEnvFile } from 'node:process';
import { ipv4, object, parse, pipe, string } from 'valibot';

loadEnvFile();

const env = parse(object({ HOST: pipe(string(), ipv4()) }), process.env);

execSync(
	`rsync -avzR --delete .env package.json ./chroma/ ./build/ root@${env.HOST}:/root/`, //
	{ stdio: 'inherit' }
);
