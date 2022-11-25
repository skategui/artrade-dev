import { DefaultModel } from '../helpers/default.model';
import { PartialBy } from './type-operations';

type DefaultModelKeys = string & keyof DefaultModel;

// E - Your entity class
// K - Fields which you want optional, usually because they have a mongoose defaultValue

export type CreatePayload<E extends object, K extends string = never> = PartialBy<
  E,
  keyof E & (DefaultModelKeys | K)
>;
