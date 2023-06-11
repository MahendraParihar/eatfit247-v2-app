import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { Constants } from '../../../constants/Constants';
import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder } from '@angular/forms';
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
import { RecipeDatasource } from '../recipe.datasource';
import { RecipeModel } from '../../../models/recipe.model';
import { PreviewRecipeDialogComponent } from '../preview-recipe-dialog/preview-recipe-dialog.component';
import { StatusList } from 'src/app/constants/status-list';
import { DropdownItem } from 'src/app/interfaces/dropdown-item';

@Component({
  selector: 'app-recipe-list',
  templateUrl: './recipe-list.component.html',
  styleUrls: ['./recipe-list.component.scss'],
})
export class RecipeListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns = ['seqNo', 'title', 'image', 'category', 'isPublic', 'status', 'createdBy',  'updatedBy', 'action'];
  dataSource: RecipeDatasource;
  totalCount = 0;
  stringRes = StringResources;
  defaultPageSize = Constants.DEFAULT_PAGE_SIZE;
  pageSizeList = Constants.PAGE_SIZE_LIST;
  payload: any = {};
  statusList = StatusList;
  recipeCuisineList: DropdownItem[] = [];
  recipeTypeList: DropdownItem[] = [];
  recipeCategoryList: DropdownItem[] = [];
  searchFormGroup = this.fb.group({
    name: [null],
    active: [null],
    createdFrom: [null],
    createdTo: [null],
    recipeTypeId: [null],
    recipeCuisineIds: [null],
    recipeCategoryIds: [null],
  });
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private fb: FormBuilder,
    private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    public dialog: MatDialog) {
    this.dataSource = new RecipeDatasource(this.httpService, this.snackBarService);
    this.dataSource.totalCount.subscribe((count: number) => this.totalCount = count);
  }

  async ngOnInit(): Promise<void> {
    this.loadMasterData();
    await this.loadDataSet();
  }

  ngAfterViewInit() {
    if(this.paginator) {
      this.paginator.page
        .pipe(
          tap(() => this.loadDataSet()),
        )
        .subscribe();
    }
  }

  ngOnDestroy(): void {
    // this.dataSource = null;
  }

  async loadDataSet(): Promise<void> {
    this.payload.pageNumber = this.paginator ? this.paginator.pageIndex : 0;
    this.payload.pageSize = this.paginator ? this.paginator.pageSize : Constants.DEFAULT_PAGE_SIZE;
    await this.dataSource.loadData(ApiUrlEnum.RECIPE_LIST, this.payload);
  }

  async clearSearchForm(): Promise<void> {
    this.searchFormGroup.reset();
  }

  async searchResult(): Promise<void> {
    const formValue = this.searchFormGroup.value;
    this.payload.name = formValue.name ? formValue.name : null;
    this.payload.active = formValue.active; // Send value as it is
    this.payload.createdFrom = formValue.createdFrom ? formValue.createdFrom.format('YYYY-MM-DD') : null;
    this.payload.createdTo = formValue.createdTo ? formValue.createdTo.format('YYYY-MM-DD') : null;
    this.payload.recipeTypeId = formValue.recipeTypeId ? formValue.recipeTypeId : null;
    this.payload.recipeCuisineIds = formValue.recipeCuisineIds ? formValue.recipeCuisineIds.toString() : null;
    this.payload.recipeCategoryIds = formValue.recipeCategoryIds ? formValue.recipeCategoryIds.toString() : null;
    this.paginator.firstPage();
    await this.loadDataSet();
  }

  onAddClick() {
    this.navigationService.navigateTo(NavigationPathEnum.RECIPES_MANAGE);
  }

  onEditClick(id: number) {
    this.navigationService.navigateToById(NavigationPathEnum.RECIPES_MANAGE, id);
  }

  onDeleteClick(item: RecipeModel, index: number) {
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

      if (result) {
        this.updateStatusTask(item, index);
      }
    });
  }

  async updateStatusTask(item: RecipeModel, index: number): Promise<void> {
    const payload = {
      active: !item.active,
    };
    const res: ResponseDataModel = await this.httpService.patchRequest(ApiUrlEnum.RECIPE_STATUS_CHANGE, item.id, payload, true);
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

  openPreviewDialog(detailObj: RecipeModel): void {
    const dialogRef = this.dialog.open(PreviewRecipeDialogComponent, {
      data: detailObj,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  async onDownloadClick(detailObj: RecipeModel) {
    if (detailObj.downloadPath) {
      await this.httpService.downloadFile(`${ApiUrlEnum.DOWNLOAD_PATH}${detailObj.downloadPath}`, `${detailObj.title}.pdf`);
    }
  }

  async loadMasterData(): Promise<void> {
    this.recipeCategoryList = [];
    this.recipeCuisineList = [];
    this.recipeTypeList = [];
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.RECIPE_MASTER_DATA, null, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          for (const s of res.data.recipeCategory) {
            this.recipeCategoryList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.recipeCuisine) {
            this.recipeCuisineList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.recipeType) {
            this.recipeTypeList.push(DropdownItem.fromJson(s));
          }
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
