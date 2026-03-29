import { storageService } from '@/services/storage';
import { tabDetectionService } from './tabDetection';

void storageService.getReviewPromptState();

tabDetectionService.initialize().catch((error) => {
  console.error('Error initializing tab detection service:', error);
});

