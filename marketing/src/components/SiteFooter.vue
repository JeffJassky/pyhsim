<script setup lang="ts">
</script>

<template>
  <footer>
    <div class="wrap">
      <div class="foot-grid" style="grid-template-columns: 1.4fr 1fr 1fr 1.6fr">
        <div class="foot-col foot-brand">
          <RouterLink class="brand" to="/" style="margin-bottom: 18px">
            <span class="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" fill="#c4633c" />
                <path d="M3 14 L25 14" stroke="#fbf8f3" stroke-width="1.2" />
                <path d="M5 17 L23 17" stroke="#fbf8f3" stroke-width="1.2" opacity="0.85" />
                <path d="M7 20 L21 20" stroke="#fbf8f3" stroke-width="1.2" opacity="0.7" />
                <path d="M9 23 L19 23" stroke="#fbf8f3" stroke-width="1.2" opacity="0.55" />
              </svg>
            </span>
            <span class="brand-name"><b>Protokol</b> Lab</span>
          </RouterLink>
          <p
            style="color: var(--ink-dim); font-size: 13px; max-width: 36ch; line-height: 1.55; margin: 0"
          >
            A simulation lab for your routine. Built for the people who decided
            their body is too important to outsource.
          </p>
        </div>

        <div class="foot-col">
          <h6>Product</h6>
          <RouterLink to="/#what">What we model</RouterLink>
          <RouterLink to="/#how">How it works</RouterLink>
          <RouterLink to="/#pricing">Pricing</RouterLink>
          <a href="#methodology">Methodology</a>
          <a href="#changelog">Changelog</a>
        </div>

        <div class="foot-col">
          <h6>Trust</h6>
          <a href="#privacy">Privacy</a>
          <a href="#security">Security</a>
          <a href="#data">Your data, your hardware</a>
          <a href="#terms">Terms</a>
          <a href="mailto:founder@protokol.lab">founder@protokol.lab</a>
        </div>

        <div class="foot-col foot-cta">
          <h6>
            Subscribe and get the <i>self-experimenter's</i> field guide.
          </h6>
          <p>
            One email a month. The protocols people are running, with the
            citations behind them. Nothing to sell.
          </p>
          <form class="foot-form" @submit.prevent>
            <input type="email" placeholder="Email address" />
            <button type="submit">Subscribe</button>
          </form>
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
        <span
          >Built because we felt like a black box and wanted to feel less like
          one.</span
        >
      </div>
    </div>
  </footer>
</template>
