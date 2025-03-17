import React from 'react';
import { Tooltip } from 'antd';

interface VersionNotesProps {
  versionNotes: string;
}

const VersionNotes: React.FC<VersionNotesProps> = ({ versionNotes }) => {
  const envVersionNotes = import.meta.env.VersionNotes || versionNotes;
  
  return (
    <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 10 }}>
      <Tooltip title={envVersionNotes}>
        <span style={{ cursor: 'pointer', color: '#666' }}>Version Notes</span>
      </Tooltip>
    </div>
  );
};

export default VersionNotes;