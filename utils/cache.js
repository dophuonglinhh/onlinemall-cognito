// Simple in-memory cache implementation
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.expirationTimes = new Map();
  }

  set(key, value, ttlSeconds = 300) { // Default 5 minutes TTL
    const expirationTime = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, value);
    this.expirationTimes.set(key, expirationTime);
  }

  get(key) {
    const expirationTime = this.expirationTimes.get(key);
    
    if (!expirationTime || Date.now() > expirationTime) {
      // Cache miss or expired
      this.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.expirationTimes.delete(key);
  }

  clear() {
    this.cache.clear();
    this.expirationTimes.clear();
  }

  size() {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, expirationTime] of this.expirationTimes.entries()) {
      if (now > expirationTime) {
        this.delete(key);
      }
    }
  }
}

// Create a global cache instance
const cache = new SimpleCache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

module.exports = cache;