import React from 'react';
import {
  FullscreenPhotoViewer,
  FullscreenPhotoViewerProps
} from './FullscreenPhotoViewer';

export type EvidenceModalProps = FullscreenPhotoViewerProps;

export const EvidenceModal: React.FC<EvidenceModalProps> = (props) => {
  return <FullscreenPhotoViewer {...props} />;
};

export default EvidenceModal;
