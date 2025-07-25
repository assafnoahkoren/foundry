import { JobsOptions, Processor, WorkerOptions } from 'bullmq';
import { queueFactory } from './queue.factory';

export interface QueueDefinition<T = any> {
  name: string;
  processor: Processor<T>;
  workerOptions?: Partial<WorkerOptions>;
  defaultJobOptions?: JobsOptions;
}


/**
 * Registry for all queue definitions
 * Features register their queues here
 */
class QueueRegistry {
  private queues: Map<string, QueueDefinition> = new Map();
  private initialized = false;

  /**
   * Register a queue definition
   * Called by feature modules during initialization
   */
  register<T>(definition: QueueDefinition<T>): void {
    if (this.initialized) {
      throw new Error(`Cannot register queue ${definition.name} after initialization`);
    }

    if (this.queues.has(definition.name)) {
      throw new Error(`Queue ${definition.name} is already registered`);
    }

    console.log(`Registering queue: ${definition.name}`);
    this.queues.set(definition.name, definition);
  }

  /**
   * Get all registered queue definitions
   */
  getAll(): QueueDefinition[] {
    return Array.from(this.queues.values());
  }

  /**
   * Get a specific queue definition
   */
  get(name: string): QueueDefinition | undefined {
    return this.queues.get(name);
  }

  /**
   * Initialize all registered queues
   * Creates workers for each queue
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('Queue registry already initialized');
      return;
    }

    console.log(`Initializing ${this.queues.size} queues...`);

    for (const definition of this.queues.values()) {
      // Create the queue
      queueFactory.createQueue(definition.name);

      // Create the worker
      queueFactory.createWorker(
        definition.name,
        definition.processor,
        definition.workerOptions
      );

      console.log(`Initialized queue and worker for: ${definition.name}`);
    }

    this.initialized = true;
    console.log('Queue registry initialization complete');
  }

  /**
   * Shutdown all queues and workers
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down queue registry...');
    await queueFactory.closeAll();
    this.initialized = false;
  }

  /**
   * Check if a queue is registered
   */
  has(name: string): boolean {
    return this.queues.has(name);
  }

  /**
   * Get registry status
   */
  getStatus(): {
    initialized: boolean;
    queueCount: number;
    queues: string[];
  } {
    return {
      initialized: this.initialized,
      queueCount: this.queues.size,
      queues: Array.from(this.queues.keys()),
    };
  }
}

export const queueRegistry = new QueueRegistry();