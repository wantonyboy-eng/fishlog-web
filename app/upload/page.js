import { Suspense } from 'react';
import UploadInner from './UploadInner';

export const metadata = {
  title: 'Fih | Log a catch',
};

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="loading">Loading…</div>}>
      <UploadInner />
    </Suspense>
  );
}