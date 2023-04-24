import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {HttpService} from "../../../service/http.service";
import {SnackBarService} from "../../../service/snack-bar.service";
import {NavigationService} from "../../../service/navigation.service";
import {ActivatedRoute} from "@angular/router";
import {StringResources} from "../../../enum/string-resources";
import {ResponseDataModel} from "../../../models/response-data.model";
import {ApiUrlEnum} from "../../../enum/api-url-enum";
import {ServerResponseEnum} from "../../../enum/server-response-enum";
import {MemberPocketGuideModel} from "../../../models/member-pocket-guide.model";
import {filter, map} from "lodash";

@Component({
  selector: 'app-member-pocket-guide',
  templateUrl: './member-pocket-guide.component.html',
  styleUrls: ['./member-pocket-guide.component.scss']
})
export class MemberPocketGuideComponent implements OnInit, AfterViewInit, OnDestroy {

  id: number;
  stringRes = StringResources;
  memberPocketGuides: MemberPocketGuideModel[] = [];
  displayedColumns = ["seqNo", 'title', 'file', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt', 'selected'];

  constructor(private httpService: HttpService,
              private snackBarService: SnackBarService,
              private navigationService: NavigationService,
              private activatedRoute: ActivatedRoute) {
    this.activatedRoute.parent.params.subscribe(params => {
      this.id = Number(params['id']);
    });
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

  async loadDataById(id: number): Promise<void> {
    this.memberPocketGuides = [];
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          if (res.data.list) {
            for (const s of res.data.list) {
              this.memberPocketGuides.push(MemberPocketGuideModel.fromJson(s));
            }
          }
          break;
        case ServerResponseEnum.WARNING:
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }

  onCancel(): void {
    this.navigationService.back();
  }

  async onSubmit(): Promise<void> {
    const ids = map(filter(this.memberPocketGuides, {isSelected: true}), 'id');
    let payload: any = {
      pocketGuideIds: ids
    };
    let res: ResponseDataModel;
    if (this.id > 0) {
      res = await this.httpService.putRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, this.id, payload, true)
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.MEMBER_POCKET_GUIDE_MANAGE, payload, true)
    }
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
          this.onCancel();
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
