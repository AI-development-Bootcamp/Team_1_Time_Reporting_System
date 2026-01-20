import { useState, useCallback } from 'react';
import { MonthHistoryPage } from './components/MonthHistory';
import { BottomBar } from './components/BottomBar';
import { ComingSoonModal } from './components/ComingSoonModal';

function App() {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Open coming soon modal
  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // TODO: Get actual userId from auth context
  const userId = 'current-user-id';

  return (
    <div style={{ paddingBottom: '80px' }}>
      <MonthHistoryPage
        userId={userId}
        onEdit={openModal}
        onAddReport={openModal}
      />
      <BottomBar onManualReport={openModal} />
      <ComingSoonModal opened={isModalOpen} onClose={closeModal} />
    </div>
  );
}

export default App;
