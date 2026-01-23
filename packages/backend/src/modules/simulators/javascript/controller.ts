import { NextFunction, Request, Response } from 'express';
import * as service from './service';

export async function execute(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ message: 'Code must be a string.' });
    }
    const result = await service.simulate(code);

    // Transform steps to include visualizationState
    const transformedSteps = result.steps.map((step) => {
      // Convert stack frames to scope chain format
      const scopes = step.stack.map((frame, index) => ({
        id: `scope-${index}`,
        name: frame.functionName,
        type: frame.functionName === '(global)' ? 'global' as const : 'function' as const,
        variables: frame.variables,
      }));

      return {
        ...step,
        visualizationState: {
          type: 'scopeChain' as const,
          data: {
            scopes,
            currentScopeId: scopes.length > 0 ? scopes[scopes.length - 1].id : 'scope-0',
          },
        },
      };
    });

    res.json({
      success: true,
      steps: transformedSteps,
    });
  } catch (error) {
    next(error);
  }
}
