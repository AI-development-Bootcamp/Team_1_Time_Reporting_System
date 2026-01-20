import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/ErrorHandler';
import { parseDateString } from '../utils/routeUtils';
import type { ReportingType, Project } from '@prisma/client';
import type { z } from 'zod';
import type { createProjectSchema, updateProjectSchema } from '../validators/project.schema';

type CreateProjectInput = z.infer<typeof createProjectSchema>;
type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// Helper to convert a Project entity into a JSON-safe response object
function mapProjectToResponse(project: Project) {
  return {
    // Keep IDs as strings (BigInt serialized) to match client ID representation
    id: project.id.toString(),
    name: project.name,
    clientId: project.clientId.toString(),
    projectManagerId: project.projectManagerId.toString(),
    startDate: project.startDate.toISOString().slice(0, 10), // YYYY-MM-DD
    endDate: project.endDate ? project.endDate.toISOString().slice(0, 10) : null,
    description: project.description,
    reportingType: project.reportingType as ReportingType,
    active: project.active,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export class ProjectService {
  static async getProjects(filters: { clientId?: bigint; active?: boolean }) {
    const activeFilter = filters.active !== undefined ? filters.active : true;

    const projects = await prisma.project.findMany({
      where: {
        ...(filters.clientId && { clientId: filters.clientId }),
        active: activeFilter,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return projects.map(mapProjectToResponse);
  }

  static async createProject(data: CreateProjectInput) {
    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new AppError('NOT_FOUND', 'Client not found', 404);
    }

    // Check if project manager exists
    const projectManager = await prisma.user.findUnique({
      where: { id: data.projectManagerId },
    });

    if (!projectManager) {
      throw new AppError('NOT_FOUND', 'Project manager not found', 404);
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name: data.name,
        clientId: data.clientId,
        projectManagerId: data.projectManagerId,
        startDate: parseDateString(data.startDate),
        endDate: data.endDate ? parseDateString(data.endDate) : null,
        description: data.description,
        // Default to startEnd if not provided
        reportingType: (data.reportingType || 'startEnd') as ReportingType,
        // New projects are active by default
        active: true,
      },
    });

    // Return ID as string to be consistent with client ID serialization
    return { id: project.id.toString() };
  }

  static async updateProject(id: bigint, data: UpdateProjectInput) {
    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }

    // Prepare update data (only include fields that are provided)
    const updateData: {
      name?: string;
      clientId?: bigint;
      projectManagerId?: bigint;
      startDate?: Date;
      endDate?: Date | null;
      description?: string | null;
      reportingType?: ReportingType;
      active?: boolean;
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.clientId !== undefined) {
      // Verify client exists
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
      });
      if (!client) {
        throw new AppError('NOT_FOUND', 'Client not found', 404);
      }
      updateData.clientId = data.clientId;
    }
    if (data.projectManagerId !== undefined) {
      // Verify project manager exists
      const projectManager = await prisma.user.findUnique({
        where: { id: data.projectManagerId },
      });
      if (!projectManager) {
        throw new AppError('NOT_FOUND', 'Project manager not found', 404);
      }
      updateData.projectManagerId = data.projectManagerId;
    }
    if (data.startDate !== undefined && data.startDate !== null) {
      updateData.startDate = parseDateString(data.startDate);
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? parseDateString(data.endDate) : null;
    }
    if (data.description !== undefined) {
      updateData.description = data.description ?? null;
    }
    if (data.reportingType !== undefined) {
      updateData.reportingType = data.reportingType as ReportingType;
    }
    if (data.active !== undefined) {
      updateData.active = data.active;
    }

    // Update project
    await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return { updated: true };
  }

  static async toggleReportingType(id: bigint) {
    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }

    // Toggle reportingType: if startEnd -> duration, if duration -> startEnd
    const newReportingType: ReportingType =
      existingProject.reportingType === 'startEnd' ? 'duration' : 'startEnd';

    // Update only the reportingType field
    await prisma.project.update({
      where: { id },
      data: { reportingType: newReportingType },
    });

    return {
      updated: true,
      reportingType: newReportingType,
    };
  }

  static async deleteProject(id: bigint) {
    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new AppError('NOT_FOUND', 'Project not found', 404);
    }

    // Use a transaction to apply all cascading changes consistently
    await prisma.$transaction(async (tx) => {
      // 1) Soft delete the project (set active = false)
      await tx.project.update({
        where: { id },
        data: { active: false },
      });

      // 2) Close all tasks that belong to this project (set status = 'closed')
      await tx.task.updateMany({
        where: { projectId: id },
        data: { status: 'closed' },
      });

      // 3) Delete all task-worker assignments for tasks under this project
      await tx.taskWorker.deleteMany({
        where: {
          task: {
            projectId: id,
          },
        },
      });
    });

    return { deleted: true };
  }
}

