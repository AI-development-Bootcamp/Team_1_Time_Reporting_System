import React from 'react';
import { Group, Text } from '@mantine/core';
import styles from './AddProjectButton.module.css';

interface AddProjectButtonProps {
  onClick: () => void;
}

const AddProjectButton: React.FC<AddProjectButtonProps> = ({ onClick }) => {
  return (
    <Group
      gap={8}
      mt="lg"
      justify="flex-end"
      className={styles.root}
      onClick={onClick}
    >
      <Text c="blue" fw={500} size="sm">
        הוספת פרויקט
      </Text>
      <div className={styles.plusCircle}>
        +
      </div>
    </Group>
  );
};

export default AddProjectButton;

