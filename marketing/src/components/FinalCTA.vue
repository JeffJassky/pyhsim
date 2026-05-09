<script setup lang="ts">
withDefaults(
  defineProps<{
    headline?: string;
    body?: string;
  }>(),
  {
    headline: "Run the experiment <i>before</i> you run it on yourself.",
    body: "Request access to the closed beta. We're letting in 50 new lab users a week. If you're building your own routine and tired of guessing, we want you in.",
  },
);
</script>

<template>
  <section class="final">
    <div class="wrap-narrow">
      <span class="mono-accent">Invite-only beta</span>
      <h2 style="margin-top: 18px" v-html="headline"></h2>
      <p v-html="body"></p>
      <div class="ctas">
        <a class="btn btn-primary btn-lg" href="#waitlist">
          Request lab access <span class="arr">→</span>
        </a>
        <RouterLink class="btn btn-lg" to="/#how">Read the methodology</RouterLink>
      </div>
    </div>
  </section>
</template>
