"use client";

import { Suspense } from "react";
import UploadInner from "./UploadInner";

export default function UploadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UploadInner />
    </Suspense>
  );
}