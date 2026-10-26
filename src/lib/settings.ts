import { prisma } from "./prisma";

export async function getSettings() {
  return prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

export async function getState() {
  return prisma.systemState.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}
