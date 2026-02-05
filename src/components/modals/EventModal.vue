<template>
	<div class="event-modal">
		<div class="event-header-container">
			<div class="section-header clipped-medium-backward-bio">
				<img src="/icons/events.svg" />
				<h1>EVENT LOG</h1>
			</div>
			<div class="rhombus-back">&nbsp;</div>
		</div>

		<!-- Updated rendering to support local image paths -->
		<div v-if="event && event.content" class="event">
			<div class="name">
				<h1>{{ event.location }} // {{ event.time }}</h1>
				<h2>{{ event.title }}</h2>
			</div>
			<!-- Render Markdown using preprocessed localSource -->
			<vue-markdown-it :source="localSource" class="markdown" />
		</div>

		<div v-else class="event">
			<div class="name">
				<h2>[No Event Selected]</h2>
			</div>
			<p class="subtle--text">Please select an event to view its details.</p>
		</div>
	</div>
</template>

<script>
import { VueMarkdownIt } from '@f3ve/vue-markdown-it';

export default {
	name: "EventModal",
	components: { VueMarkdownIt },
	props: {
		event: {
			type: Object,
			required: true,
		},
	},

	computed: {
		/**
		 * Converts relative image references (like "map.png") in Markdown
		 * into full local paths ("/events/<id>/map.png").
		 * Preserves existing absolute URLs (http/https or starting with /).
		 */
		localSource() {
			if (!this.event?.content) return "";

			// Determine which folder to pull from.
			// event.id or event.filename (e.g., "000") should exist — fallback to "000"
			const id = this.event.id || this.event.filename || "000";
			const folder = `/events/${id}/`;

			let src = this.event.content;

			// Replace Markdown image paths that are local (no http or / prefix)
			src = src.replace(
				/!\[(.*?)\]\(([^)]+)\)/g,
				(match, alt, path) => {
					// Leave absolute or remote URLs untouched
					if (path.startsWith("http") || path.startsWith("/")) return match;
					// Convert relative reference to local event folder
					return `![${alt}](${folder}${path})`;
				}
			);

			// Also handle plain lines that are just a URL (legacy style)
			src = src.replace(
				/^(https?:\/\/\S+\.(?:jpg|jpeg|png|webp|gif|gifv))(?:\?.*)?$/gim,
				(url) => `![](${url})`
			);

			return src;
		},
	},
};
</script>

<style scoped>
.markdown img {
	display: block;
	max-width: 100%;
	height: auto;
	border-radius: 0.5rem;
	margin: 0.5rem 0 1rem;
}
</style>
