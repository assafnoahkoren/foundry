import { queueRegistry } from './queue.registry';
import { queueFactory } from './queue.factory';

// Export the main infrastructure components
export { queueRegistry } from './queue.registry';
export { queueService } from './queue.service';
export { queueFactory } from './queue.factory';
export type { QueueDefinition } from './queue.registry';

// Common queue types
export const QueuePriority = {
  LOW: 10,
  NORMAL: 0,
  HIGH: -5,
  CRITICAL: -10,
} as const;

export type QueuePriority = typeof QueuePriority[keyof typeof QueuePriority];

export interface BaseJobData {
  userId?: string;
  timestamp?: Date;
  correlationId?: string;
  priority?: number;
}

/**
 * Initialize the queue system
 * This should be called during server startup
 */
export async function initializeQueueSystem(): Promise<void> {
  try {
    console.log('Initializing queue system...');
    
    // Initialize all registered queues
    await queueRegistry.initialize();
    
    console.log('Queue system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize queue system:', error);
    throw error;
  }
}

/**
 * Shutdown the queue system gracefully
 */
export async function shutdownQueueSystem(): Promise<void> {
  try {
    console.log('Shutting down queue system...');
    
    // Shutdown the registry (which will close all queues and workers)
    await queueRegistry.shutdown();
    
    console.log('Queue system shut down successfully');
  } catch (error) {
    console.error('Error during queue system shutdown:', error);
    throw error;
  }
}

/**
 * Get the status of the queue system
 */
export function getQueueSystemStatus() {
  return {
    registry: queueRegistry.getStatus(),
    factory: queueFactory.getStatus(),
  };
}