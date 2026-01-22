/**
 * LocationListStep Component
 * Step 3 of project selector: Select work location
 * 
 * Features:
 * - Three location options (office, home, client site)
 * - Blue checkmark for selected location
 * - Mobile-first, RTL design
 */

import { Stack, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { LocationStatus } from '../../types';
import { LOCATION_LABELS } from '../../utils/constants';
import classes from './LocationListStep.module.css';

interface LocationListStepProps {
  /** Currently selected location */
  selectedLocation: LocationStatus | null;
  /** Callback when a location is selected */
  onSelect: (location: LocationStatus) => void;
}

/**
 * LocationListStep - Display location options for work reporting
 * 
 * @example
 * <LocationListStep
 *   selectedLocation={selectedLocation}
 *   onSelect={(location) => handleLocationSelect(location)}
 * />
 */
export function LocationListStep({
  selectedLocation,
  onSelect,
}: LocationListStepProps) {
  // Define available locations
  const locations: LocationStatus[] = ['office', 'client', 'home'];

  return (
    <div className={classes.container}>
      <Stack gap="xs">
        {locations.map((location) => {
          const isSelected = selectedLocation === location;
          const label = LOCATION_LABELS[location];

          return (
            <button
              key={location}
              className={`${classes.locationButton} ${
                isSelected ? classes.selected : ''
              }`}
              onClick={() => onSelect(location)}
              type="button"
            >
              <div className={classes.locationContent}>
                <Text size="sm" fw={500}>
                  {label}
                </Text>
              </div>
              {isSelected && (
                <IconCheck size={20} className={classes.checkIcon} />
              )}
            </button>
          );
        })}
      </Stack>
    </div>
  );
}
