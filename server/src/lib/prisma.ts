import { PrismaClient } from '@prisma/client'
import { config } from '../shared/config/config'

declare global {
   
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (!config.isProduction()) {
  global.prisma = prisma
}