import React from 'react';

export function Skeleton({ height = 16 }: { height?: number }) {
  return <div className="skeleton" style={{ height }} />;
}
