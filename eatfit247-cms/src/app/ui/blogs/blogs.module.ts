import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogsRoutingModule } from './blogs-routing.module';
import { BlogListComponent } from './blog-list/blog-list.component';
import { BlogManageComponent } from './blog-manage/blog-manage.component';
import { MaterialModule } from '../../material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ShareModule } from '../shared/share.module';
import { PreviewBlogDialogComponent } from './preview-blog-dialog/preview-blog-dialog.component';

@NgModule({
  declarations: [
    BlogListComponent,
    BlogManageComponent,
    PreviewBlogDialogComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    ShareModule,
    BlogsRoutingModule,
  ],
  entryComponents: [
    PreviewBlogDialogComponent,
  ],
})
export class BlogsModule {
}
