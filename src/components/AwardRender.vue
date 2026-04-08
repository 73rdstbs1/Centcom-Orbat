<!-- FILE: src/components/AwardRender.vue -->
<template>
  <span class="award-render" :title="titleText" :style="{ '--award-icon-size': iconSize }">
    <template v-if="resolvedCodes.length">
      <template v-for="(c, idx) in resolvedCodes" :key="`${c}__${idx}`">
        <a
          v-if="hrefFor(c, idx)"
          class="award-link"
          :href="hrefFor(c, idx)"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img class="award-icon" :src="iconUrl(c)" :alt="c" loading="lazy" />
        </a>

        <img
          v-else
          class="award-icon"
          :src="iconUrl(c)"
          :alt="c"
          loading="lazy"
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
    // Size in pixels for each ribbon icon.
    size: { type: [Number, String], default: 18 },
    // Fallback to generic award info pages when no `links[idx]` is present.
    link: { type: Boolean, default: false },
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
    iconSize() {
      const n = Number(this.size);
      return Number.isFinite(n) && n > 0 ? `${n}px` : "18px";
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
  min-height: var(--award-icon-size, 18px);
  flex-wrap: wrap;
}
.award-link {
  display: inline-flex;
}
.award-icon {
  width: var(--award-icon-size, 18px);
  height: var(--award-icon-size, 18px);
  object-fit: contain;
}
.award-text {
  opacity: 0.9;
}
</style>
