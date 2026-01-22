import { describe, it, expect } from 'vitest';
import { validateDuration, validateLocation } from './TimeLogsService';

// ============================================================================
// Unit Tests: TimeLogsService - Pure Functions
// ============================================================================

describe('TimeLogsService', () => {
  // ==========================================================================
  // validateDuration
  // ==========================================================================

  describe('validateDuration', () => {
    it('should not throw for valid positive integer', () => {
      expect(() => validateDuration(1)).not.toThrow();
      expect(() => validateDuration(60)).not.toThrow();
      expect(() => validateDuration(480)).not.toThrow();
      expect(() => validateDuration(1440)).not.toThrow(); // 24 hours
    });

    it('should throw for zero', () => {
      expect(() => validateDuration(0)).toThrow('positive integer');
    });

    it('should throw for negative numbers', () => {
      expect(() => validateDuration(-1)).toThrow('positive integer');
      expect(() => validateDuration(-100)).toThrow('positive integer');
    });

    it('should throw for non-integers', () => {
      expect(() => validateDuration(1.5)).toThrow('positive integer');
      expect(() => validateDuration(60.5)).toThrow('positive integer');
      expect(() => validateDuration(0.1)).toThrow('positive integer');
    });
  });

  // ==========================================================================
  // validateLocation
  // ==========================================================================

  describe('validateLocation', () => {
    it('should not throw for valid locations', () => {
      expect(() => validateLocation('office')).not.toThrow();
      expect(() => validateLocation('client')).not.toThrow();
      expect(() => validateLocation('home')).not.toThrow();
    });

    it('should throw for invalid location strings', () => {
      expect(() => validateLocation('remote')).toThrow('Location must be one of');
      expect(() => validateLocation('onsite')).toThrow('Location must be one of');
      expect(() => validateLocation('headquarters')).toThrow('Location must be one of');
    });

    it('should throw for empty string', () => {
      expect(() => validateLocation('')).toThrow('Location must be one of');
    });

    it('should be case sensitive', () => {
      expect(() => validateLocation('Office')).toThrow('Location must be one of');
      expect(() => validateLocation('OFFICE')).toThrow('Location must be one of');
      expect(() => validateLocation('Home')).toThrow('Location must be one of');
      expect(() => validateLocation('CLIENT')).toThrow('Location must be one of');
    });
  });
});
