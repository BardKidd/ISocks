interface SubPage {
  action: string;
  pageNumber: string;
  subject: string;
  path: string;
  order: string;
}

interface UserPermission {
  page: string;
  subPage: SubPage[];
}

const userPermissions: UserPermission[] = [
  // 沒有權限就不回傳該筆Object
  {
    page: 'Main',
    subPage: [
      {
        action: 'edit',
        pageNumber: 'A01',
        subject: 'A01',
        path: 'main',
        order: '1',
      },
    ],
  },
  {
    page: 'About',
    subPage: [
      {
        action: 'edit',
        pageNumber: 'B01',
        subject: 'B01',
        path: 'about',
        order: '1',
      },
    ],
  },
  {
    page: 'Form',
    subPage: [
      {
        action: 'edit',
        pageNumber: 'F01',
        subject: 'F01',
        path: 'form',
        order: '1',
      },
    ],
  },
  {
    page: 'Gemini',
    subPage: [
      {
        action: 'edit',
        pageNumber: 'G01',
        subject: 'G01',
        path: 'gemini',
        order: '1',
      },
    ],
  },
  {
    page: 'ChatRoom',
    subPage: [
      {
        action: 'edit',
        pageNumber: 'C01',
        subject: 'C01',
        path: 'chatroom',
        order: '1',
      },
    ],
  },
];

const result: SubPage[] = userPermissions.flatMap((permission) => {
  return permission.subPage.map((item) => item);
});

export default result;