export const fadeInUp = () => ({
  initial: { opacity: 1, y: 0 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0 },
  viewport: { once: true, amount: 0 }
});

export const staggerContainer = () => ({
  variants: {
    hidden: {},
    show: {}
  },
  initial: 'show',
  whileInView: 'show',
  viewport: { once: true, amount: 0 }
});

export const childFade = {
  variants: {
    hidden: { opacity: 1, y: 0 },
    show: { opacity: 1, y: 0 }
  },
  transition: { duration: 0 }
};
