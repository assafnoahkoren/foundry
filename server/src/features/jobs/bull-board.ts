import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import type { FastifyInstance } from 'fastify';
import { queueFactory } from './queue.factory';
import { queueRegistry } from './queue.registry';
import { config } from '../../shared/config/config';

/**
 * Create and configure Bull Board for queue monitoring
 */
function setupBullBoard() {
  // Create Fastify adapter for Bull Board
  const serverAdapter = new FastifyAdapter();
  
  // Get all registered queues
  const registeredQueues = queueRegistry.getAll();
  const queueAdapters: BullMQAdapter[] = [];
  
  // Create/get queues with Redis connection and create adapters
  for (const queueDef of registeredQueues) {
    // This will create the queue with Redis connection if it doesn't exist
    const queue = queueFactory.createQueue(queueDef.name);
    queueAdapters.push(new BullMQAdapter(queue));
  }
  
  // Create Bull Board with all queue adapters
  createBullBoard({
    queues: queueAdapters,
    serverAdapter,
    options: {
      uiConfig: {
        boardTitle: 'Foundry Queue Dashboard',
        boardLogo: {
          path: '',
          width: '100px',
          height: 30,
        },
      },
    },
  });
  
  // Set base path for the UI
  serverAdapter.setBasePath('/admin/queues');
  
  return serverAdapter;
}

/**
 * Initialize Bull Board on the Fastify server
 * Only initializes if enabled via environment variables
 */
export async function initBullBoard(server: FastifyInstance): Promise<void> {
  // Check if Bull Board should be enabled
  const shouldEnableBullBoard = !config.isProduction() || config.bullBoard.enabled;
    
  if (!shouldEnableBullBoard) {
    return;
  }
  
  try {
    const bullBoardAdapter = setupBullBoard();
    await server.register(bullBoardAdapter.registerPlugin(), {
      prefix: '/admin/queues',
    });
    console.log(`📊 Bull Board available at http://localhost:${config.server.port}/admin/queues`);
  } catch (error) {
    console.error('Failed to setup Bull Board:', error);
  }
}
