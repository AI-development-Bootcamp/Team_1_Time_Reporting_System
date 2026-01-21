import React, { useState } from 'react';
import { Button } from '@mantine/core';
import ManualReportModal from '../components/ManualReportModal';
import dayjs from 'dayjs';
import styles from './ManualReportPage.module.css';

const ManualReportPage: React.FC = () => {
  const [modalOpened, setModalOpened] = useState(false);
  const [activeTab, setActiveTab] = useState<'absence' | 'work'>('work');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entryTime, setEntryTime] = useState('09:04');
  const [exitTime, setExitTime] = useState('09:04');

  const handleOpenModal = () => {
    const now = dayjs();
    const entryTimeStr = now.format('HH:mm');
    const exitTimeStr = now.add(1, 'minute').format('HH:mm');
    setEntryTime(entryTimeStr);
    setExitTime(exitTimeStr);
    setModalOpened(true);
  };

  const handleAddProject = () => {
    // Placeholder for add project functionality
    console.log('Add project clicked');
  };

  return (
    <div className={styles.pageRoot}>
      <Button onClick={handleOpenModal} mb="md">
        פתח דיווח ידני
      </Button>

      <ManualReportModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedDate={selectedDate}
        entryTime={entryTime}
        exitTime={exitTime}
        onEntryTimeChange={setEntryTime}
        onExitTimeChange={setExitTime}
        onAddProject={handleAddProject}
      />
    </div>
  );
};

export default ManualReportPage;

