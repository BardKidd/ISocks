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
];

const result: SubPage[] = userPermissions.flatMap((permission) => {
  return permission.subPage.map((item) => item);
});

export default result;