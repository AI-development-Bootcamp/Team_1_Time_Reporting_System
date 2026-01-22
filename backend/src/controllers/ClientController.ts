import { Request, Response, NextFunction } from 'express';
import { ClientService } from '../services/ClientService';
import { ApiResponse } from '../utils/Response';
import { createClientSchema, updateClientSchema, clientIdParamSchema } from '../validators/client.schema';

export class ClientController {
  static async getClients(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')
      // For now, this endpoint is accessible without auth (will be secured by Member 1)

      // Query param: active (boolean, optional)
      // Default to true if not specified (show only active clients)
      const activeFilter = req.query.active !== undefined 
        ? req.query.active === 'true' 
        : true;

      const clients = await ClientService.getClients({ active: activeFilter });
      ApiResponse.success(res, clients);
    } catch (error) {
      next(error);
    }
  }

  static async createClient(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')

      // Validate request body
      const validatedData = createClientSchema.parse(req.body);

      const result = await ClientService.createClient(validatedData);
      ApiResponse.success(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateClient(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')

      // Validate route parameter
      const { id: clientId } = clientIdParamSchema.parse({ id: req.params.id });

      // Validate request body
      const validatedData = updateClientSchema.parse(req.body);

      const result = await ClientService.updateClient(clientId, validatedData);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteClient(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Add admin auth middleware check (userType === 'admin')

      // Validate route parameter
      const { id: clientId } = clientIdParamSchema.parse({ id: req.params.id });

      const result = await ClientService.deleteClient(clientId);
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

