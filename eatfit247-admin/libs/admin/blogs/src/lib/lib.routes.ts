import { Route } from '@angular/router';
import { Blogs } from './blogs.component';
import { ManageBlog } from './manage/manage-blog.component';

export const blogsRoutes: Route[] = [
  { path: '', component: Blogs, title: 'Blogs' },
  { path: 'new', component: ManageBlog, title: 'Create Blog' },
  { path: 'edit/:id', component: ManageBlog, title: 'Edit Blog' }
];
