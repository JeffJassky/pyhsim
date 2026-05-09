<script setup lang="ts">
import { computed } from "vue";
import { AUDIENCES } from "@/data/audiences";
import { AUDIENCE_CONTENT } from "@/data/audienceContent";
import AudienceSwitcher from "@/components/AudienceSwitcher.vue";
import Crumb from "@/components/Crumb.vue";
import Signal from "@/components/Signal.vue";
import FinalCTA from "@/components/FinalCTA.vue";

const props = defineProps<{ slug: string }>();

const audience = computed(() => AUDIENCES.find((a) => a.slug === props.slug));
const content = computed(() => AUDIENCE_CONTENT[props.slug]);

const ctaBody = computed(
  () =>
    `Closed beta. Tell us you're building a routine for ${audience.value?.title.toLowerCase() ?? ""} and we'll get you in. Every founder@ email gets read.`,
);
</script>

<template>
  <template v-if="audience && content">
    <AudienceSwitcher :active-slug="slug" />
    <Crumb :active-title="audience.title" />

    <!-- HERO -->
    <section class="hero" style="padding-top: 32px; padding-bottom: 80px">
      <div class="hero-grid"></div>
      <div class="hero-glow"></div>
      <div class="wrap hero-inner">
        <span class="eyebrow">
          <span class="dot"></span> {{ content.eyebrow }}
        </span>
        <h1 class="h1 wide" v-html="content.h1"></h1>
        <p class="hero-sub" v-html="content.sub"></p>
        <div class="hero-ctas">
          <a class="btn btn-primary btn-lg" href="#waitlist">
            Request lab access <span class="arr">→</span>
          </a>
          <a class="btn btn-lg" href="#anxieties">What we model for you</a>
        </div>
        <div class="hero-meta">
          <div v-for="m in content.metrics" :key="m.label">
            <b>{{ m.value }}</b>
            <span>{{ m.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ANXIETIES -->
    <section class="section" id="anxieties">
      <div class="wrap">
        <div class="section-head">
          <div class="label"><span class="mono-accent">01 / What keeps you up</span></div>
          <div>
            <h2>The questions on the inside of your head — that aren't getting answered <i>anywhere</i>.</h2>
            <p>I built each of these models because I had the question and couldn't find an honest answer. Not from the prescriber. Not from the subreddit. Not from the AI summary that just regurgitated the prescriber.</p>
          </div>
        </div>
        <div class="anxiety">
          <div v-for="x in content.anxieties" :key="x.num" class="anx">
            <div class="num">{{ x.num }}</div>
            <h4 v-html="x.title"></h4>
            <p v-html="x.body"></p>
          </div>
        </div>
      </div>
    </section>

    <!-- PROTOCOL -->
    <section class="section tight">
      <div class="wrap">
        <div class="section-head">
          <div class="label"><span class="mono-accent">02 / A real protocol</span></div>
          <div>
            <h2>What the lab outputs for someone <i>like you</i>.</h2>
            <p>One real scenario someone built in the closed beta. Not a recommendation. A worked example — to show you the shape of what you'd be designing for yourself.</p>
          </div>
        </div>
        <div class="protocol">
          <div class="protocol-meta">
            <span class="lab">{{ content.protocol.lab }}</span>
            <h4 v-html="content.protocol.title"></h4>
            <p v-html="content.protocol.desc"></p>
            <div class="legend">
              <div
                v-for="l in content.protocol.legend"
                :key="l.k"
                class="legend-row"
              >
                <span class="k">{{ l.k }}</span>
                <span class="v" v-html="l.v"></span>
              </div>
            </div>
            <span class="disclaim">
              Not medical advice · Provider in the loop · Reviewed Q4W
            </span>
          </div>
          <div class="vis" style="background: var(--bg)">
            <div class="vis-head">
              <span class="lt">PREDICTED SIGNALS · 12-WK</span>
              <span class="rt">
                <span class="pill">1D</span>
                <span class="pill">7D</span>
                <span class="pill on">12W</span>
              </span>
            </div>
            <div class="v-signals cols-2" style="margin-top: 14px">
              <Signal
                v-for="s in content.signals"
                :key="s.name"
                :name="s.name"
                :val="s.val"
                :klass="s.klass"
                :points="s.points"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TESTS -->
    <section class="section tight">
      <div class="wrap">
        <div class="section-head">
          <div class="label"><span class="mono-accent">03 / Bloodwork that matters</span></div>
          <div>
            <h2>The tests that move <i>this</i> protocol — and why.</h2>
            <p>Not every marker on a Function Health panel matters for what you're doing. These are the ones that do, with the reason next to each.</p>
          </div>
        </div>
        <div class="tests">
          <div v-for="t in content.tests" :key="t.name" class="test">
            <div class="top">
              <h5>{{ t.name }}</h5>
              <span class="src">{{ t.src }}</span>
            </div>
            <div class="why" v-html="t.why"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- TWO-COL -->
    <section class="section tight">
      <div class="wrap">
        <div class="twocol">
          <div>
            <span class="mono-accent">04 / Harm reduction</span>
            <h4 style="margin-top: 14px">When the lab will <i>refuse</i> to model.</h4>
            <p>The harm engine is hard-coded, not statistical. <b>MAOIs + SSRIs, methylene blue + serotonergics, contraindicated peptide stacks, dosing into a known drug-interaction window</b> — the lab refuses to render the prediction and surfaces peer-reviewed warnings instead.</p>
            <p>It will also flag when you're outside the population the literature was sampled from — pregnant, breastfeeding, under 18, or stacking compounds the model has low confidence in. <b>You always know what the model knows and what it's guessing.</b></p>
          </div>
          <div>
            <span class="mono-accent">05 / With your provider</span>
            <h4 style="margin-top: 14px">A protocol your prescriber will <i>read</i>.</h4>
            <p>Every protocol you save can be exported as a clean PDF: mechanisms cited, doses listed, comparator scenario attached, predicted markers tracked. The point isn't to replace your prescriber. The point is to walk into a 12-minute appointment with a structured artifact instead of a story.</p>
            <p>This is not medical advice. By design. It is education that makes you a more informed person sitting across from someone who can give it.</p>
          </div>
        </div>
      </div>
    </section>

    <FinalCTA
      headline="Run the experiment <i>before</i> you run it on yourself."
      :body="ctaBody"
    />
  </template>
  <div v-else class="wrap" style="padding: 80px 0"><h2>Not found.</h2></div>
</template>
