import { z } from 'zod';

export const optionalBoolean = z.preprocess(
  (v) =>
    v === 'true' || v === 'on' || v === true ? true : v === '' || v === undefined ? false : v,
  z.boolean().default(false),
);
