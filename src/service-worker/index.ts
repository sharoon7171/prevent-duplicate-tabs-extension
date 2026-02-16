// Main service worker entry point
// Imports and initializes all service worker functionality

import { initializeSync } from './syncStorage';
import { tabDetectionService } from './tabDetection';

// Initialize real-time bidirectional sync between localStorage and chrome.sync
initializeSync();

// Initialize tab detection and prevention service
tabDetectionService.initialize().catch((error) => {
  console.error('Error initializing tab detection service:', error);
});

