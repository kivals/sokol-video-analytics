export const apiDelay = () =>
  new Promise((r) => setTimeout(r, 150 + Math.random() * 450));
