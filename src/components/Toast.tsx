import React from 'react';

export function Toast({ message }: { message: string }) {
  return <div className="toast">{message}</div>;
}
