import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../swagger.config';

const router = express.Router();

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Bright.Blue Brand Portal API Docs',
}));

// Serve OpenAPI JSON
router.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

export default router;

