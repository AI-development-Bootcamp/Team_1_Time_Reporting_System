import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProjectSelectorService } from '../services/ProjectSelectorService';
import { ApiResponse } from '../utils/Response';

// ============================================================================
// Validation Schema
// ============================================================================

const selectorQuerySchema = z.object({
  userId: z.string().transform((val) => BigInt(val)),
});

// ============================================================================
// Controller
// ============================================================================

export class ProjectSelectorController {
  /**
   * GET /api/projects/selector
   * Get grouped projects for user with usage-based sorting
   * 
   * Query params:
   * - userId: Required (will be replaced by req.user.id when auth is ready)
   * 
   * Response: { clients: ClientItem[] }
   */
  static async getSelector(req: Request, res: Response, next: NextFunction) {
    try {
      const query = selectorQuerySchema.parse(req.query);

      // TODO: When auth is ready, use req.user.id instead of query param
      const userId = query.userId;
      // Always compute fresh data (no caching)
      const result = await ProjectSelectorService.getProjectsForUser(userId);

      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
