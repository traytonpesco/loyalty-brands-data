import { Request, Response, NextFunction } from 'express';

function index(req: Request, res: Response, next: NextFunction): void {
    // Return JSON since we're serving React frontend and this is now an API endpoint
    res.json({
        message: 'Bright.Blue Brand Portal API',
        description: 'Express TypeScript API Server',
        status: 'running',
        timestamp: new Date().toISOString()
    });
}

export default {
    index
};
