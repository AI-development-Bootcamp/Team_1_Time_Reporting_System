import { TextInput, Box } from '@mantine/core';
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
      leftSection={
        <Box component="span" style={{ opacity: 0.5 }}>
          🔍
        </Box>
      }
      styles={{
        root: {
          width: '100%',
        },
        input: {
          textAlign: 'right',
          direction: 'rtl',
          height: 40,
          borderRadius: 8,
          borderWidth: 1,
          padding: '12px 40px 12px 12px',
          fontFamily: 'SimplerPro, sans-serif',
        },
      }}
    />
  );
}
