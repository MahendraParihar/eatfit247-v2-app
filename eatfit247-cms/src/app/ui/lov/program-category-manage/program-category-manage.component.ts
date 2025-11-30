import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import { FileTypeEnum, ILov, IResponse } from 'shared-lib';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { StatusList } from '../../../constants/status-list';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ValidationUtil } from '../../../utilites/validation-util';

@Component({
  standalone: false,
  selector: 'app-program-category-manage',
  templateUrl: './program-category-manage.component.html',
  styleUrls: ['./program-category-manage.component.scss']
})
export class ProgramCategoryManageComponent implements OnInit, AfterViewInit, OnDestroy {
  fb: FormBuilder = inject(FormBuilder);
  lovModelObj: ILov;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  statusList = StatusList;
  formGroup: FormGroup = this.fb.group({
    name: [null, [Validators.required, Validators.minLength(this.inputLength.CHAR_2), Validators.maxLength(this.inputLength.CHAR_50)]],
    active: [true, [Validators.required]]
  });

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute) {
    this.id = Number(this.activatedRoute.snapshot.paramMap.get('id'));
  }

  get formControl() {
    return this.formGroup.controls;
  }

  async ngOnInit(): Promise<void> {
    if (this.id) {
      await this.loadDataById(this.id);
    }
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
  }

  onCancel(): void {
    this.navigationService.back();
  }

  bindData(): void {
    if (this.lovModelObj) {
      this.formGroup.patchValue({
        name: this.lovModelObj.name,
        active: this.lovModelObj.active
      });
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<ILov>>(ApiUrlEnum.PROGRAM_CATEGORY_MANAGE, id, null, true);
    if (res) {
      this.lovModelObj = res.data;
      this.bindData();
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any = this.formGroup.value;
    if (this.id > 0) {
      await this.httpService.putRequest(ApiUrlEnum.PROGRAM_CATEGORY_MANAGE, this.id, payload, true);
    } else {
      await this.httpService.postRequest(ApiUrlEnum.PROGRAM_CATEGORY_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }
}
