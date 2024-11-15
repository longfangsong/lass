/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { load } from 'cheerio';

async function fetch_single_article(title: string, url: string, db: D1Database): Promise<void> {
	const response = await fetch(`https://sverigesradio.se${url}`);
	const $ = load(await response?.text());
	let content = $('.publication-preamble').text();
	const details = $('.article-details__section p')
		.map((_, it) => $(it).text())
		.toArray();
	const audio_id = $('.audio-button').attr('data-audio-id');
	const audio_url_response = await fetch(
		`https://sverigesradio.se/playerajax/audio?id=${audio_id}&type=publication&publicationid=${audio_id}&quality=high`,
	);
	const { audioUrl } = await audio_url_response.json<{ audioUrl: string }>();
	details.pop();
	content += details.join('');
	const create_time = new Date($('time.publication-metadata__item').attr('datetime') || '');
	const id = crypto.randomUUID();
	const stmt = db.prepare('INSERT INTO Article (id, title, content, create_time, url, voice_url) VALUES (?1, ?2, ?3, ?4, ?5, ?6);');
	await stmt.bind(id, title, content, create_time.getTime(), url, audioUrl).run();
}

async function title_exists(title: string, db: D1Database): Promise<boolean> {
	let query_title_result = await db.prepare('select id from Article where title = ?1;').bind(title).first();
	return query_title_result !== null;
}

async function fetch_all(): Promise<Array<{ title: string; url: string }>> {
	const latt_svenska_page = await fetch('https://sverigesradio.se/radioswedenpalattsvenska');
	const html = await latt_svenska_page.text();
	const $ = load(html);
	const elements = $('h2.heading.heading-link.h2>a.heading');
	let all_titles = elements
		.map((_, element) => {
			return {
				title: $(element).text(),
				url: $(element).attr('href') || '',
			};
		})
		.toArray();
	return all_titles;
}

export default {
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(event, env, ctx): Promise<void> {
		let all_articles = await fetch_all();
		let exists = await Promise.all(all_articles.map(({ title }) => title_exists(title, env.DB)));
		let new_articles = all_articles.filter((_, index) => !exists[index]);
		await Promise.all(new_articles.map(({ title, url }) => fetch_single_article(title, url, env.DB)));
	},
} satisfies ExportedHandler<Env>;
