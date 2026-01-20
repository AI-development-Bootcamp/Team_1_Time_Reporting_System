import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// Types
// ============================================================================

export interface TaskItem {
  id: string;
  name: string;
  reportCount: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  reportingType: string;
  reportCount: number;
  tasks: TaskItem[];
}

export interface ClientItem {
  id: string;
  name: string;
  reportCount: number;
  projects: ProjectItem[];
}

export interface ProjectSelectorResponse {
  clients: ClientItem[];
}

// ============================================================================
// Service
// ============================================================================

export class ProjectSelectorService {
  /**
   * Get all projects grouped by client for a specific user
   * Sorted by usage frequency (report count) with alphabetical tie-breaker
   * 
   * @param userId - The user ID to get projects for
   * @returns Grouped and sorted clients → projects → tasks
   */
  static async getProjectsForUser(userId: bigint): Promise<ProjectSelectorResponse> {
    // ========================================================================
    // Step 1: Get assigned tasks via TaskWorker, filtered by active status
    // ========================================================================
    const assignedTasks = await prisma.taskWorker.findMany({
      where: {
        userId,
        task: {
          status: 'open', // Only open tasks
          project: {
            active: true, // Only active projects
            client: {
              active: true, // Only active clients
            },
          },
        },
      },
      include: {
        task: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
      },
    });

    // ========================================================================
    // Step 2: Get usage frequency (all-time report counts per task)
    // ========================================================================
    const usageData = await prisma.projectTimeLogs.groupBy({
      by: ['taskId'],
      where: {
        dailyAttendance: {
          userId,
        },
      },
      _count: {
        _all: true,
      },
    });

    // Build task count map
    const taskCountMap = new Map<string, number>();
    for (const row of usageData) {
      taskCountMap.set(row.taskId.toString(), row._count._all);
    }

    // ========================================================================
    // Step 3: Build grouped structure and calculate roll-up counts
    // ========================================================================
    const clientMap = new Map<string, {
      id: string;
      name: string;
      reportCount: number;
      projects: Map<string, {
        id: string;
        name: string;
        reportingType: string;
        reportCount: number;
        tasks: TaskItem[];
      }>;
    }>();

    for (const assignment of assignedTasks) {
      const task = assignment.task;
      const project = task.project;
      const client = project.client;

      const clientId = client.id.toString();
      const projectId = project.id.toString();
      const taskId = task.id.toString();
      const taskReportCount = taskCountMap.get(taskId) ?? 0;

      // Get or create client entry
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          id: clientId,
          name: client.name,
          reportCount: 0,
          projects: new Map(),
        });
      }
      const clientEntry = clientMap.get(clientId)!;

      // Get or create project entry
      if (!clientEntry.projects.has(projectId)) {
        clientEntry.projects.set(projectId, {
          id: projectId,
          name: project.name,
          reportingType: project.reportingType,
          reportCount: 0,
          tasks: [],
        });
      }
      const projectEntry = clientEntry.projects.get(projectId)!;

      // Add task
      projectEntry.tasks.push({
        id: taskId,
        name: task.name,
        reportCount: taskReportCount,
      });

      // Roll up counts
      projectEntry.reportCount += taskReportCount;
      clientEntry.reportCount += taskReportCount;
    }

    // ========================================================================
    // Step 4: Sort at each level (count desc, then A→Z alphabetical)
    // ========================================================================
    const sortByCountThenName = <T extends { reportCount: number; name: string }>(a: T, b: T): number => {
      // Sort by count descending
      if (b.reportCount !== a.reportCount) {
        return b.reportCount - a.reportCount;
      }
      // Tie-breaker: alphabetical A→Z
      return a.name.localeCompare(b.name);
    };

    // Convert to array and sort
    const clients: ClientItem[] = Array.from(clientMap.values())
      .map((client) => ({
        id: client.id,
        name: client.name,
        reportCount: client.reportCount,
        projects: Array.from(client.projects.values())
          .map((project) => ({
            id: project.id,
            name: project.name,
            reportingType: project.reportingType,
            reportCount: project.reportCount,
            tasks: project.tasks.sort(sortByCountThenName),
          }))
          .sort(sortByCountThenName),
      }))
      .sort(sortByCountThenName);

    return { clients };
  }
}
