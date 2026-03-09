export type BoardMember = {
  userId: string;
  email: string;
  displayName: string;
};

export type Board = {
  id: string;
  name: string;
  members: BoardMember[];
};

export type BoardInvite = {
  token: string;
  invitedEmail: string;
  boardId: string;
  status: 'PENDING' | 'ACCEPTED';
  createdAt: string;
};

export type BoardInvitePreview = {
  token: string;
  invitedEmail: string;
  status: 'PENDING' | 'ACCEPTED';
  board: {
    id: string;
    name: string;
    memberCount: number;
  };
  sender: {
    id: string;
    displayName: string;
    email: string;
  };
};
