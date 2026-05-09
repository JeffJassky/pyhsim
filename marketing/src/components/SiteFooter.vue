<script setup lang="ts">
import { AUDIENCES } from "@/data/audiences";
</script>

<template>
  <footer>
    <div class="wrap">
      <div class="foot-grid">
        <div class="foot-col">
          <RouterLink class="brand" to="/" style="margin-bottom: 18px">
            <span class="brand-mark"></span>
            <span class="brand-name"><b>Protokol</b> Lab</span>
          </RouterLink>
          <p
            style="color: var(--ink-dim); font-size: 13px; max-width: 36ch; line-height: 1.55; margin: 0"
          >
            A test flight for your routine. Built for the people who decided
            their body is too important to outsource.
          </p>
        </div>
        <div class="foot-col">
          <h6>Use cases</h6>
          <RouterLink v-for="a in AUDIENCES" :key="a.slug" :to="`/${a.slug}`">{{ a.title }}</RouterLink>
        </div>
        <div class="foot-col">
          <h6>Product</h6>
          <RouterLink to="/#features">The lab</RouterLink>
          <RouterLink to="/#how">How it works</RouterLink>
          <RouterLink to="/#pricing">Pricing</RouterLink>
          <RouterLink to="/#science">Science</RouterLink>
        </div>
        <div class="foot-col">
          <h6>Trust</h6>
          <a href="#privacy">Privacy</a>
          <a href="#security">Security</a>
          <a href="#data">Your data, your hardware</a>
          <a href="#terms">Terms</a>
          <a href="#contact">founder@protokol.lab</a>
        </div>
      </div>
      <div class="disclaimer">
        <b style="color: var(--ink)">Important.</b> Protokol Lab is an
        educational tool for adults running their own experiments. It is not a
        medical device, does not diagnose, and does not treat any condition.
        Predictions are model-based and may be wrong. Talk to a licensed
        clinician before changing medications, peptides, or supplements —
        especially during pregnancy, while breastfeeding, or if you have a
        diagnosed condition. Nothing in this product is medical advice. By
        design.
      </div>
      <div class="foot-bottom">
        <span>© 2026 Protokol Lab, Inc. — All experiments your own.</span>
        <span>Built because we felt like shit and wanted to feel better.</span>
      </div>
    </div>
  </footer>
</template>
