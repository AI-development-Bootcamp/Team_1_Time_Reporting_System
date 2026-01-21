import React from 'react';
import { SegmentedControl } from '@mantine/core';
import styles from './TabNavigation.module.css';

interface TabNavigationProps {
  activeTab: 'absence' | 'work';
  onTabChange: (tab: 'absence' | 'work') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <SegmentedControl
      value={activeTab}
      onChange={(value) => onTabChange(value as 'absence' | 'work')}
      data={[
        { label: 'דיווח היעדרות', value: 'absence' },
        { label: 'דיווח עבודה', value: 'work' },
      ]}
      fullWidth
      radius="md"
      classNames={{
        root: styles.root,
        indicator: styles.indicator,
        label: styles.label,
      }}
    />
  );
};

export default TabNavigation;

