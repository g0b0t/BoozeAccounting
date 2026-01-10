import React from 'react';

interface AvatarRowProps {
  users: { id: string; name: string; photo_url?: string }[];
}

export function AvatarRow({ users }: AvatarRowProps) {
  return (
    <div className="avatar-row">
      {users.map((user) => (
        <div key={user.id} className="avatar">
          {user.photo_url ? <img src={user.photo_url} alt={user.name} /> : <span>{user.name[0]}</span>}
        </div>
      ))}
    </div>
  );
}
