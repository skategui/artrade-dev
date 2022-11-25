import _ from 'lodash';

declare module 'lodash' {
  interface LoDashStatic {
    intersects(...arrays: unknown[][]): boolean;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface LoDashExplicitWrapper<TValue> {
    intersects(...arrays: unknown[][]): LoDashExplicitWrapper<boolean>;
  }
}

// Same behavior as evaluating:
//   intersection(...arrays).length > 0
// But about 7x faster, since we do not need the actual result array.
export const intersects = (...arrays: unknown[][]): boolean => {
  if (arrays.length <= 1) {
    return false;
  }
  const firstArray = arrays[0];
  for (const elt of firstArray) {
    let eltInAllArrays = true;
    for (let arrayIndex = 1; arrayIndex < arrays.length; arrayIndex++) {
      if (!arrays[arrayIndex].includes(elt)) {
        eltInAllArrays = false;
        break;
      }
    }
    if (!eltInAllArrays) {
      continue;
    }
    return true;
  }
  return false;
};

_.mixin({
  intersects,
});
