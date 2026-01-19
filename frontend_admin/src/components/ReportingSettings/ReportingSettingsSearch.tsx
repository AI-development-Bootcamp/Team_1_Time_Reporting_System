import { TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useState, useEffect } from 'react';

interface ReportingSettingsSearchProps {
  /**
   * Callback when search value changes (after debounce)
   */
  onSearchChange: (searchValue: string) => void;
  
  /**
   * Optional placeholder text
   */
  placeholder?: string;
}

/**
 * Search component for filtering projects by client or project name
 * 
 * Features:
 * - Mantine TextInput with search icon (🔍 emoji as fallback)
 * - Hebrew placeholder text
 * - 300ms debounced input to avoid excessive filtering
 * - RTL support
 */
export function ReportingSettingsSearch({
  onSearchChange,
  placeholder = "חיפוש לפי שם לקוח/פרויקט",
}: ReportingSettingsSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue] = useDebouncedValue(searchValue, 300);

  // Trigger callback when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedSearchValue);
  }, [debouncedSearchValue, onSearchChange]);

  return (
    <TextInput
      placeholder={placeholder}
      value={searchValue}
      onChange={(event) => setSearchValue(event.currentTarget.value)}
      rightSection={<span style={{ opacity: 0.5 }}>🔍</span>}
      styles={{
        input: {
          textAlign: 'right',
          direction: 'rtl',
        },
        wrapper: {
          maxWidth: 300,
        },
      }}
    />
  );
}
