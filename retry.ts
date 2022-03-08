export async function delay(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// call func with exponential backoff retry
export async function withRetry<T>(
  func: () => Promise<T>,
  count = 7,
): Promise<T> {
  let retry = 0;
  while (retry < count) {
    try {
      return await func();
    } catch (e) {
      console.log(e);
      const sec = Math.pow(2, retry);
      console.log(`action was failed, waiting ${sec}sec...`);
      await delay(1000 * sec);
      retry++;
    }
  }
  throw Error("action failed");
}
