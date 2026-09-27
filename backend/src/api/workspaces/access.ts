import { prisma } from '../db/client.js';

export async function requireWorkspaceMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } });
}
