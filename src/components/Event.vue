<template>
	<div class="event">
		<div class="name">
			<h1>{{ event.location }} // {{ event.time }}</h1>
			<h2>{{ event.title }}</h2>
		</div>

		<!-- Thumbnail image -->
		<img
			class="thumbnail"
			:src="getThumbnail(event.thumbnail)"
			:alt="event.title"
		/>

		<div class="preview">
			{{ getPreview }}
		</div>

		<a @click.prevent="selectEvent">Read More</a>
	</div>
</template>

<script>
import EventModal from "@/components/modals/EventModal.vue";
import removeMd from "remove-markdown";

export default {
	name: "Event",
	components: {
		EventModal,
	},
	props: {
		event: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			removeMd,
		};
	},
	computed: {
		getPreview() {
			return this.removeMd(this.event.content).substring(0, 200) + "...";
		},
	},
	methods: {
		selectEvent() {
			this.$emit("select-event", this.event);
		},

		/**
		 * Returns the correct image path for the thumbnail.
		 * - Absolute paths (starting with "/") are used as-is (for /events/...).
		 * - Full URLs (http/https) are used as-is (for legacy Imgur links).
		 * - Plain filenames (e.g. "000/header.png") are prefixed with /events/.
		 * - Falls back to /events/default.png if missing.
		 */
		getThumbnail(thumb) {
			if (!thumb) return "/events/default.png"; // fallback image
			if (thumb.startsWith("http") || thumb.startsWith("/")) return thumb;
			return `/events/${thumb}`;
		},
	},
};
</script>

<style scoped>
.thumbnail {
	display: block;
	max-width: 100%;
	height: auto;
	border-radius: 0.5rem;
	margin: 0.5rem 0 1rem;
	object-fit: cover;
}
</style>
