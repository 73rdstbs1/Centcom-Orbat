<!-- FILE: src/components/AwardRender.vue -->
<template>
  <span class="award-render" :title="titleText">
    <template v-if="codes.length">
      <template v-for="c in codes" :key="c">
      <a
        v-if="link && hrefFor(c)"
        class="award-link"
        :href="hrefFor(c)"
        target="_blank"
        rel="noopener"
        :aria-label="`Open award info: ${c}`"
      >
        <img
          class="award-icon"
          :src="iconUrl(c)"
          :alt="c"
          loading="lazy"
          decoding="async"
        />
      </a>
      <img
        v-else
        class="award-icon"
        :src="iconUrl(c)"
        :alt="c"
        loading="lazy"
        decoding="async"
      />
    </template>
    </template>
    <template v-else>
      <span class="award-text">{{ value || "—" }}</span>
    </template>
  </span>
</template>

<script>
import { awardIconUrl, awardPageUrl, extractAwardCodes } from "@/utils/awards";

export default {
  name: "AwardRender",
  props: {
    value: { type: String, default: "" },
    link: { type: Boolean, default: false },
  },
  computed: {
    codes() {
      return extractAwardCodes(this.value);
    },
    titleText() {
      return String(this.value || "").trim();
    },
  },
  methods: {
    hrefFor(code) {
      return awardPageUrl(code);
    },
    iconUrl(code) {
      return awardIconUrl(code);
    },
  },
};
</script>

<style scoped>
.award-render {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 18px;
}

.award-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
