export type DeletableEntity<T> = {
  delete(reason?: string): Promise<T>;
};
