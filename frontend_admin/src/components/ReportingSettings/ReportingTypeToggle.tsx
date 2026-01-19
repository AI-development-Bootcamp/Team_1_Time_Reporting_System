import { Radio, Group } from '@mantine/core';
import type { ReportingType } from '../../types/Project';

interface ReportingTypeToggleProps {
  /**
   * Current reporting type value
   */
  value: ReportingType;
  
  /**
   * Callback when reporting type changes
   * Triggers immediate API call
   */
  onChange: (value: ReportingType) => void;
  
  /**
   * Disabled state while saving
   */
  disabled?: boolean;
}

/**
 * Radio button toggle for project reporting type
 * 
 * Features:
 * - Two options: "סכום שעות" (duration) and "כניסה / יציאה" (startEnd)
 * - Inline (horizontal) layout like in the design
 * - RTL support for Hebrew
 * - onChange triggers immediate API call
 * - Visual indicator for selected state (filled vs empty circle)
 * - Disabled state while saving
 */
export function ReportingTypeToggle({
  value,
  onChange,
  disabled = false,
}: ReportingTypeToggleProps) {
  return (
    <Radio.Group
      value={value}
      onChange={(val) => onChange(val as ReportingType)}
    >
      <Group gap="lg">
        {/* Total Duration */}
        <Radio
          value="duration"
          label="סכום שעות"
          disabled={disabled}
        />
        
        {/* Start/End Times - Default */}
        <Radio
          value="startEnd"
          label="כניסה / יציאה"
          disabled={disabled}
        />
      </Group>
    </Radio.Group>
  );
}
