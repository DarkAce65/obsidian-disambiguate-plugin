class SetMultimap<Key, Value> {
  private map: Map<Key, Set<Value>>;

  constructor() {
    this.map = new Map();
  }

  hasKey(key: Key): boolean {
    return this.map.has(key);
  }

  hasKeyValue(key: Key, value: Value): boolean {
    return this.hasKey(key) && this.map.get(key)!.has(value);
  }

  get(key: Key): Set<Value> | undefined {
    return this.map.get(key);
  }

  set(key: Key, values: Set<Value>): void {
    this.map.set(key, values);
  }

  add(key: Key, value: Value): void {
    if (this.map.has(key)) {
      this.map.get(key)!.add(value);
    } else {
      this.map.set(key, new Set([value]));
    }
  }

  remove(key: Key, value: Value): boolean {
    if (this.map.has(key)) {
      const r = this.map.get(key)!.delete(value);
      if (this.map.get(key)!.size === 0) {
        this.map.delete(key);
      }
      return r;
    }
    return false;
  }

  delete(key: Key): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}

export default SetMultimap;
