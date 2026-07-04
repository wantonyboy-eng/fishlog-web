import { Suspense } from 'react';
import UploadInner from './UploadInner';

export const metadata = {
  title: 'Fih | Upload Catch',
};

export default function UploadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UploadInner />
    </Suspense>
  );
}