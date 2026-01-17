import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { suggestShotsHandler } from './handlers/suggestShots';
import { generatePanelHandler } from './handlers/generatePanel';
import { refinePanelHandler } from './handlers/refinePanel';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-service' });
});

// AI endpoints
app.post('/suggest-shots', suggestShotsHandler);
app.post('/generate-panel', generatePanelHandler);
app.post('/refine-panel', refinePanelHandler);

app.listen(PORT, () => {
  console.log(`AI Service running on port ${PORT}`);
});
