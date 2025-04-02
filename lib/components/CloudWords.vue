<template>
  <ul class="cloud" aria-label="Webdev word cloud">
    <li v-for="word in processedWords" :key="word.text">
      <a href="#" :data-weight="word.weight">{{ word.text }}</a>
    </li>
  </ul>
  <slot></slot>
</template>

<script>
import { defineComponent, computed } from 'vue';

export default defineComponent({
  props: {
    words: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const processedWords = computed(() => {
      return props.words.map((word) => {
        if (typeof word === 'string') {
          return {
            text: word,
            weight: Math.floor(Math.random() * 9) + 1,
          };
        } else {
          return {
            text: word.text,
            weight: word.weight || Math.floor(Math.random() * 9) + 1,
          };
        }
      });
    });

    return {
      processedWords,
    };
  },
});
</script>

<style lang="scss" scoped>
ul.cloud {
  list-style: none;
  padding-left: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 500px; /* Set maximum width */
  max-height: 100px; /* Set maximum height */
  overflow: hidden; /* Prevent vertical overflow */
  line-height: 1; /* Adjust line height to avoid extra spacing */
}

ul.cloud a {
  --size: 4;
  --color: #a33;
  color: var(--color);
  font-size: clamp(0.5rem, var(--size) * 0.4vw, 1.5rem); /* Scaled font size */
  display: block;
  padding: 0.2em 0.4em;
  position: relative;
  text-decoration: none;
  white-space: nowrap; /* Prevent text from wrapping */
}

ul.cloud a[data-weight='1'] {
  --size: 1;
}
ul.cloud a[data-weight='2'] {
  --size: 1.5;
}
ul.cloud a[data-weight='3'] {
  --size: 2;
}
ul.cloud a[data-weight='4'] {
  --size: 2.5;
}
ul.cloud a[data-weight='5'] {
  --size: 3;
}
ul.cloud a[data-weight='6'] {
  --size: 3.5;
}
ul.cloud a[data-weight='7'] {
  --size: 4;
}
ul.cloud a[data-weight='8'] {
  --size: 5;
}
ul.cloud a[data-weight='9'] {
  --size: 6;
}

ul.cloud li:nth-child(2n + 1) a {
  --color: #181;
}
ul.cloud li:nth-child(3n + 1) a {
  --color: #33a;
}
ul.cloud li:nth-child(4n + 1) a {
  --color: #c38;
}

ul.cloud a:focus {
  outline: 1px dashed;
}

ul.cloud a::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 0;
  height: 100%;
  background: var(--color);
  transform: translate(-50%, 0);
  opacity: 0.15;
  transition: width 0.25s;
}

ul.cloud a:focus::before,
ul.cloud a:hover::before {
  width: 100%;
}

@media (prefers-reduced-motion) {
  ul.cloud * {
    transition: none !important;
  }
}
</style>
