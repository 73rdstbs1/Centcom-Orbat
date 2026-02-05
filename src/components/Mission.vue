<template>
  <div v-if="mission" class="mission" :class="[{ active: isActive }, mission.status]">
    <div class="name">
      <h1>Mission</h1>
      <h2>MISSION // {{ mission.slug || 'Unknown' }}</h2>
    </div>
    <div class="status" :class="mission.status || ''">
      {{ missionStatus }}
      <img :src="icon" />
    </div>
  </div>
  <div v-else class="mission missing">
    <div class="name">
      <h1>Mission // Unknown</h1>
      <h2>No mission data</h2>
    </div>
    <div class="status">
      <span>Missing</span>
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  props: {
    mission: {
      type: Object,
      required: true,
    },
    selected: {
      type: String,
      required: true,
    },
  },
  computed: {
    icon() {
      return this.mission?.status ? `/icons/mission-${this.mission.status}.svg` : '/icons/mission-missing.svg';
    },
    missionStatus() {
      switch (this.mission?.status) {
        case 'start':
          return 'Current\nBriefing';
        case 'partial-success':
          return 'Partial\nSuccess';
        case 'success':
          return 'Mission\nSuccess';
        case 'failure':
          return 'Mission\nFailure';
        default:
          return 'Unknown Status';
      }
    },
    isActive() {
      return this.mission?.slug === this.selected;
    },
  },
};
</script>

