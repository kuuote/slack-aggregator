// from https://qiita.com/usoda/items/dbedc06fd4bf38a59c48
export const stringifyReplacer = (_, v) =>
  (!(v instanceof Array || v === null) && typeof v == "object")
    ? Object.keys(v).sort().reduce((r, k) => {
      r[k] = v[k];
      return r;
    }, {})
    : v;
