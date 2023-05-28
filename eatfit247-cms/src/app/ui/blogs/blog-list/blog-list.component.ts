import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { Constants } from '../../../constants/Constants';
import { CommonSearchModel } from '../../../models/common-search.model';
import { MatPaginator } from '@angular/material/paginator';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { NavigationPathEnum } from '../../../enum/navigation-path-enum';
import { AlertDialogDataInterface } from '../../../interfaces/alert-dialog-data.interface';
import { AlertTypeEnum } from '../../../enum/alert-type-enum';
import { DialogAlertComponent } from '../../shared/components/dialog-alert/dialog-alert.component';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { BlogDatasource } from '../blog.datasource';
import { BlogModel } from '../../../models/blog.model';
import { PreviewBlogDialogComponent } from '../preview-blog-dialog/preview-blog-dialog.component';

@Component({
  selector: 'app-blog-list',
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss'],
})
export class BlogListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'image', 'title', 'category', 'author', 'isPublished', 'isCommentAllow', 'status', 'createdBy', 'updatedBy', 'action'];
  dataSource: BlogDatasource;
  totalCount = 0;
  stringRes = StringResources;
  defaultPageSize = Constants.DEFAULT_PAGE_SIZE;
  pageSizeList = Constants.PAGE_SIZE_LIST;
  payload: CommonSearchModel = new CommonSearchModel();
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    public dialog: MatDialog) {
    this.dataSource = new BlogDatasource(this.httpService, this.snackBarService);
    this.dataSource.totalCount.subscribe((count: number) => this.totalCount = count);
  }

  async ngOnInit(): Promise<void> {
    await this.loadDataSet();
  }

  ngAfterViewInit() {
    this.paginator.page
      .pipe(
        tap(() => this.loadDataSet()),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    // this.dataSource = null;
  }

  async loadDataSet(): Promise<void> {
    this.payload.pageNumber = this.paginator ? this.paginator.pageIndex : 0;
    this.payload.pageSize = this.paginator ? this.paginator.pageSize : Constants.DEFAULT_PAGE_SIZE;
    await this.dataSource.loadData(ApiUrlEnum.BLOG_LIST, this.payload);
  }

  async searchResult(searchObj: CommonSearchModel): Promise<void> {
    if (searchObj) {
      this.payload.name = searchObj.name ? searchObj.name : null;
      this.payload.active = searchObj.active;
      this.payload.createdFrom = searchObj.createdFrom;
      this.payload.createdTo = searchObj.createdTo;
    } else {
      this.payload.name = null;
      this.payload.active = null;
      this.payload.createdFrom = null;
      this.payload.createdTo = null;
    }
    this.paginator.firstPage();
    await this.loadDataSet();
  }

  onAddClick() {
    this.navigationService.navigateTo(NavigationPathEnum.BLOGS_MANAGE);
  }

  onEditClick(id: number) {
    this.navigationService.navigateToById(NavigationPathEnum.BLOGS_MANAGE, id);
  }

  onDeleteClick(item: BlogModel, index: number) {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.ALERT,
      message: StringResources.CHANGE_STATUS_DESC,
      positiveBtnTxt: StringResources.YES,
      negativeBtnTxt: StringResources.NO,
      alertType: AlertTypeEnum.WARNING,
    };
    const dialogRef = this.dialog.open(DialogAlertComponent, {
      width: '350px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
      if (result) {
        this.updateStatusTask(item, index);
      }
    });
  }

  async updateStatusTask(item: BlogModel, index: number): Promise<void> {
    const payload = {
      active: !item.active,
    };
    const res: ResponseDataModel = await this.httpService.patchRequest(ApiUrlEnum.BLOG_STATUS_CHANGE, item.id, payload, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
          await this.loadDataSet();
          break;
        case ServerResponseEnum.WARNING:
          this.snackBarService.showWarning(res.message);
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }

  openPreviewDialog(detailObj: BlogModel): void {
    const dialogRef = this.dialog.open(PreviewBlogDialogComponent, {
      data: detailObj,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', JSON.stringify(result));
    });
  }

  async onSendMailClick(item: BlogModel, index: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.BLOG_SEND_MAIL, item.id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
          break;
        case ServerResponseEnum.WARNING:
          this.snackBarService.showWarning(res.message);
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }
}
