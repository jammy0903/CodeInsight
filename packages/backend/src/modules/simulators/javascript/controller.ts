import { NextFunction, Request, Response } from 'express';
import * as service from './service';

export async function execute(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ message: 'Code must be a string.' });
    }
    const result = await service.simulate(code);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
