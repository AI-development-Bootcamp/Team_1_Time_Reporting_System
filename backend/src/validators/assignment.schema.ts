import { z } from 'zod';
import { bigIntIdSchema } from '../utils/routeUtils';

// Body for POST /api/admin/assignments
export const createAssignmentSchema = z.object({
  userId: bigIntIdSchema,
  taskId: bigIntIdSchema,
});

// Route param for DELETE /api/admin/assignments/:id
// We encode the composite PK as "taskId:userId" in a single string id
export const assignmentIdParamSchema = z
  .object({
    id: z
      .string()
      .regex(/^\d+:\d+$/, 'Invalid assignment id format (expected taskId:userId)'),
  })
  .transform(({ id }) => {
    const [taskIdStr, userIdStr] = id.split(':');
    return {
      taskId: BigInt(taskIdStr),
      userId: BigInt(userIdStr),
    };
  });


