import { NextFunction, Request, Response } from 'express';
import { simulateJavaScript } from './service-new';

export async function execute(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ message: 'Code must be a string.' });
    }

    // 새로운 line-by-line 시뮬레이터 사용
    const result = simulateJavaScript({ code });

    res.json(result);
  } catch (error) {
    next(error);
  }
}
