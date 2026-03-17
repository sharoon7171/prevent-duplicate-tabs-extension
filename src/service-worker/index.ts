import { tabDetectionService } from './tabDetection';

tabDetectionService.initialize().catch((error) => {
  console.error('Error initializing tab detection service:', error);
});

