export const t2tRoutes = [
    {
        path: '/t2t/import',
        name: 'T2TImport',
        component: () => import(/* webpackChunkName: "t2t-import" */ '../views/T2TImport.vue')
    }
];
