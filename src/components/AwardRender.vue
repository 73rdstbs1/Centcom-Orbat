<!-- FILE: src/components/AwardRender.vue -->
<template>
  <span class="award-render" :title="titleText" :style="{ minHeight: `${sizePx}px` }">
    <template v-if="resolvedCodes.length">
      <template v-for="(c, idx) in resolvedCodes" :key="`${c}__${idx}`">
        <a
          v-if="hrefFor(c, idx)"
          class="award-link"
          :href="hrefFor(c, idx)"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img class="award-icon" :src="iconUrl(c)" :alt="c" loading="lazy" :style="{ width: `${sizePx}px`, height: `${sizePx}px` }" />
        </a>

        <img
          v-else
          class="award-icon"
          :src="iconUrl(c)"
          :alt="c"
          loading="lazy"
          :style="{ width: `${sizePx}px`, height: `${sizePx}px` }"
        />
      </template>
    </template>

    <template v-else>
      <span class="award-text">{{ value || "—" }}</span>
    </template>
  </span>
</template>

<script>
import {
  awardIconUrl,
  awardPageUrl,
  extractAwardCodes,
  parseAwardCodesList,
} from "@/utils/awards";

export default {
  name: "AwardRender",
  props: {
    value: { type: String, default: "" },
    // If provided, takes precedence over parsing `value`.
    codes: { type: Array, default: null },
    // Per-award certificate URLs aligned with `codes` (or parsed order).
    links: { type: Array, default: null },
    // Fallback to generic award info pages when no `links[idx]` is present.
    link: { type: Boolean, default: false },
    // Icon size in pixels.
    size: { type: [Number, String], default: 18 },
  },
  computed: {
    resolvedCodes() {
      if (Array.isArray(this.codes) && this.codes.length) return this.codes;

      // If links are provided we must preserve order -> use list parsing.
      if (Array.isArray(this.links) && this.links.length) return parseAwardCodesList(this.value);

      // Otherwise allow codes embedded in free-form text.
      return extractAwardCodes(this.value);
    },
    titleText() {
      return String(this.value || "").trim();
    },
    sizePx() {
      const n = Number(this.size);
      return Number.isFinite(n) && n > 0 ? n : 18;
    },
  },
  methods: {
    iconUrl(code) {
      return awardIconUrl(code);
    },
    hrefFor(code, idx) {
      const arr = Array.isArray(this.links) ? this.links : [];
      const direct = String(arr[idx] || "").trim();
      if (direct) return direct;
      return this.link ? awardPageUrl(code) : "";
    },
  },
};
</script>

<style scoped>
.award-render {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 18px;
}
.award-link {
  display: inline-flex;
}
.award-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.award-text {
  opacity: 0.9;
}
</style>
