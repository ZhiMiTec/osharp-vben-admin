export function delay(ms) {
  return new Promise((n) => {
    setTimeout(n, ms)
  })
}
