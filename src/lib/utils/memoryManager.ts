/**
 * Memory Management Utilities
 * 
 * Helps track and manage memory usage in the application,
 * particularly for audio contexts and large data structures.
 */

interface ManagedResource {
  id: string;
  type: 'audio-context' | 'worker' | 'buffer' | 'other';
  dispose: () => void | Promise<void>;
  sizeEstimate?: number; // in bytes
}

class MemoryManager {
  private resources: Map<string, ManagedResource> = new Map();
  private nextId = 0;

  /**
   * Register a resource for memory management
   */
  register(
    type: ManagedResource['type'],
    dispose: () => void | Promise<void>,
    sizeEstimate?: number
  ): string {
    const id = `resource_${this.nextId++}`;
    this.resources.set(id, { id, type, dispose, sizeEstimate });
    return id;
  }

  /**
   * Dispose of a specific resource
   */
  async dispose(id: string): Promise<void> {
    const resource = this.resources.get(id);
    if (!resource) return;

    try {
      await resource.dispose();
      this.resources.delete(id);
    } catch (error) {
      console.error(`[MemoryManager] Error disposing resource ${id}:`, error);
    }
  }

  /**
   * Dispose of all resources of a specific type
   */
  async disposeByType(type: ManagedResource['type']): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [id, resource] of this.resources.entries()) {
      if (resource.type === type) {
        promises.push(this.dispose(id));
      }
    }

    await Promise.all(promises);
  }

  /**
   * Dispose of all managed resources
   */
  async disposeAll(): Promise<void> {
    const promises = Array.from(this.resources.keys()).map(id => this.dispose(id));
    await Promise.all(promises);
  }

  /**
   * Get memory usage statistics
   */
  getStats() {
    const stats = {
      totalResources: this.resources.size,
      byType: {} as Record<string, number>,
      estimatedMemoryMB: 0,
    };

    for (const resource of this.resources.values()) {
      stats.byType[resource.type] = (stats.byType[resource.type] || 0) + 1;
      if (resource.sizeEstimate) {
        stats.estimatedMemoryMB += resource.sizeEstimate / (1024 * 1024);
      }
    }

    return stats;
  }

  /**
   * Get browser memory info if available
   */
  getBrowserMemoryInfo() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize / (1024 * 1024), // MB
        totalJSHeapSize: memory.totalJSHeapSize / (1024 * 1024), // MB
        jsHeapSizeLimit: memory.jsHeapSizeLimit / (1024 * 1024), // MB
      };
    }
    return null;
  }

  /**
   * Log memory statistics
   */
  logStats(): void {
    const stats = this.getStats();
    const browserMemory = this.getBrowserMemoryInfo();

    console.group('[MemoryManager] Statistics');
    console.log('Managed Resources:', stats.totalResources);
    console.log('By Type:', stats.byType);
    console.log('Estimated Memory:', `${stats.estimatedMemoryMB.toFixed(2)} MB`);
    
    if (browserMemory) {
      console.log('Browser Memory:');
      console.log(`  Used: ${browserMemory.usedJSHeapSize.toFixed(2)} MB`);
      console.log(`  Total: ${browserMemory.totalJSHeapSize.toFixed(2)} MB`);
      console.log(`  Limit: ${browserMemory.jsHeapSizeLimit.toFixed(2)} MB`);
    }
    
    console.groupEnd();
  }
}

// Singleton instance
export const memoryManager = new MemoryManager();

/**
 * Hook for automatic cleanup on component unmount
 */
export function useMemoryCleanup(
  type: ManagedResource['type'],
  dispose: () => void | Promise<void>,
  sizeEstimate?: number
): void {
  // This will be called when the component using this hook unmounts
  // In a React hook, we'd use useEffect with cleanup
  // For now, just register it
  memoryManager.register(type, dispose, sizeEstimate);
}

/**
 * Weak cache for expensive computations
 * Automatically garbage collected when keys are no longer referenced
 */
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();

  get(key: K): V | undefined {
    return this.cache.get(key as any);
  }

  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key as any);
  }

  delete(key: K): void {
    this.cache.delete(key as any);
  }
}

/**
 * LRU Cache with size limit
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists (to re-add at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Add to end
    this.cache.set(key, value);

    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Debounced garbage collection suggestion
 * (Browsers ignore this, but it's a hint)
 */
let gcTimeout: ReturnType<typeof setTimeout> | null = null;

export function suggestGarbageCollection(): void {
  if (gcTimeout) {
    clearTimeout(gcTimeout);
  }

  gcTimeout = setTimeout(() => {
    // Request GC if available (only in development with --expose-gc flag)
    if (typeof global !== 'undefined' && 'gc' in global) {
      (global as any).gc();
      console.log('[MemoryManager] Manual GC triggered');
    }
    gcTimeout = null;
  }, 1000);
}

/**
 * Monitor memory usage and warn if high
 */
export function checkMemoryPressure(): 'low' | 'moderate' | 'high' {
  const browserMemory = memoryManager.getBrowserMemoryInfo();
  
  if (!browserMemory) {
    return 'low'; // Can't determine, assume OK
  }

  const usagePercent = (browserMemory.usedJSHeapSize / browserMemory.jsHeapSizeLimit) * 100;

  if (usagePercent > 90) {
    console.warn(`[MemoryManager] High memory pressure: ${usagePercent.toFixed(1)}%`);
    return 'high';
  } else if (usagePercent > 70) {
    console.warn(`[MemoryManager] Moderate memory pressure: ${usagePercent.toFixed(1)}%`);
    return 'moderate';
  }

  return 'low';
}

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).__memoryManager = memoryManager;
}
