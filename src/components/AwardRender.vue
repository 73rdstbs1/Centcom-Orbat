<!-- FILE: src/components/AwardRender.vue -->
<template>
  <span class="award-render" :title="titleText">
    <template v-if="codes.length">
      <img
        v-for="c in codes"
        :key="c"
        class="award-icon"
        :src="iconUrl(c)"
        :alt="c"
        loading="lazy"
        decoding="async"
      />
    </template>
    <template v-else>
      <span class="award-text">{{ value || "—" }}</span>
    </template>
  </span>
</template>

<script>
import { awardIconUrl, extractAwardCodes } from "@/utils/awards";

export default {
  name: "AwardRender",
  props: {
    value: { type: String, default: "" },
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

.award-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.award-text {
  opacity: 0.9;
}
</style>
