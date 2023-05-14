import {Injectable} from '@angular/core';
import {Event, NavigationEnd, Router} from '@angular/router';
import {NavigationPathEnum} from '../enum/navigation-path-enum';
import {BehaviorSubject} from 'rxjs';
import {StorageService} from "./storage.service";
import {Location} from '@angular/common'
import {SharedService} from "./shared.service";
import {BreadcrumbItem} from "../interfaces/breadcrumb-item";
import {StringResources} from "../enum/string-resources";

@Injectable({
  providedIn: 'root'
})
export class NavigationService {

  private currentUrl = new BehaviorSubject<string>('');

  constructor(private router: Router,
              private storageService: StorageService,
              private location: Location,
              private sharedService: SharedService) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.next(event.urlAfterRedirects);
      }
    });
  }

  back(): void {
    // this.router.navigate("..");
    this.location.back()
  }

  public getCurrentUrl(): BehaviorSubject<string> {
    if (!this.currentUrl.value) {
      // handles redirect after login
      const url = this.router.url;
      this.currentUrl.next(url);
    }

    return this.currentUrl;
  }

  navigateTo(navEnum: NavigationPathEnum) {
    this.router.navigate([navEnum]).then((suc: any) => {
      this.setBreadcrumb(navEnum);
    }).catch((e: any) => {
      console.log(e)
    });
  }

  navigateByStrPath(navEnum: string) {
    this.router.navigate([navEnum]).then((suc: any) => {
      // this.setBreadcrumb(navEnum);
    }).catch((e: any) => {
      console.log(e)
    });
  }

  navigateToLogin() {
    this.router.navigate([NavigationPathEnum.LOGIN], {replaceUrl: true})
      .then((suc: any) => {
      }).catch((e: any) => {
      console.log(e)
    })
  }

  navigateToHome() {
    this.router.navigate([NavigationPathEnum.HOME], {replaceUrl: true})
      .then((suc: any) => {
        this.setBreadcrumb(NavigationPathEnum.HOME);
      }).catch((e: any) => {
      console.log(e)
    })
  }

  navigateToById(navEnum: NavigationPathEnum, navId: any) {
    const tempUrl = `${navEnum}/${navId}`;
    this.router.navigateByUrl(tempUrl).then((suc: any) => {
      this.setBreadcrumb(navEnum, navId);
    }).catch((e: any) => {
      console.log(e)
    });
  }

  navigateToByOptionalId(navEnum: NavigationPathEnum, navId: any) {
    const tempUrl = `${navEnum}/${navId}`;
    this.router.navigate([navEnum, {id: navId}]).then((suc: any) => {
      this.setBreadcrumb(navEnum, navId);
    }).catch((e: any) => {
      console.log(e)
    });
  }

  signOut() {
    this.router.navigateByUrl(NavigationPathEnum.LOGIN, {replaceUrl: true})
      .then((suc: any) => {
        this.storageService.clearAuthUser();
        console.log(suc);
      }).catch((e: any) => {
      console.log(e)
    })
  }

  isNumeric(value: string): boolean {
    return /^-?\d+$/.test(value);
  }

  setBreadcrumb(path: NavigationPathEnum, id: any = 0) {
    let temp = path.split('/');
    if (temp && temp.length > 0) {
      if (temp[0] === '') {
        temp = temp.splice(0, 1);
      }
    }
    if (temp && temp.length > 0) {
      if (this.isNumeric(temp[temp.length - 1])) {
        id = Number(temp[temp.length - 1]);
        temp.pop()
        path = <NavigationPathEnum>temp.join('/');
      } else {
        path = <NavigationPathEnum>temp.join('/');
      }
    }
    const breadcrumbList: BreadcrumbItem[] = [];
    breadcrumbList.push({title: StringResources.HOME, path: NavigationPathEnum.HOME});
    switch (path) {
      case NavigationPathEnum.ADMIN_USERS:
        breadcrumbList.push({title: StringResources.ADMIN_LIST, path: NavigationPathEnum.ADMIN_USERS});
        break;
      case NavigationPathEnum.ADMIN_MANAGE:
        breadcrumbList.push({title: StringResources.ADMIN_LIST, path: NavigationPathEnum.ADMIN_USERS});
        breadcrumbList.push({
          title: id > 0 ? StringResources.ADMIN_EDIT : StringResources.ADMIN_CREATE,
          path: NavigationPathEnum.ADMIN_MANAGE
        });
        break;
      case NavigationPathEnum.FRANCHISE:
        breadcrumbList.push({title: StringResources.FRANCHISE, path: NavigationPathEnum.FRANCHISE});
        break;
      case NavigationPathEnum.FRANCHISE_MANAGE:
        breadcrumbList.push({title: StringResources.FRANCHISE, path: NavigationPathEnum.FRANCHISE});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_FRANCHISE : StringResources.ADD_FRANCHISE,
          path: NavigationPathEnum.FRANCHISE_MANAGE
        });
        break;
      case NavigationPathEnum.FRANCHISE_DETAIL:
        breadcrumbList.push({title: StringResources.FRANCHISE, path: NavigationPathEnum.FRANCHISE});
        breadcrumbList.push({
          title: StringResources.DETAIL,
          path: NavigationPathEnum.FRANCHISE_DETAIL
        });
        break;

      case NavigationPathEnum.ADMIN_CHANGE_PASSWORD:
        breadcrumbList.push({title: StringResources.CHANGE_PASSWORD, path: NavigationPathEnum.ADMIN_CHANGE_PASSWORD});
        break;
      case NavigationPathEnum.ADMIN_EDIT_PROFILE:
        breadcrumbList.push({title: StringResources.EDIT_PROFILE, path: NavigationPathEnum.ADMIN_EDIT_PROFILE});
        break;
      case NavigationPathEnum.MEMBERS:
        breadcrumbList.push({title: StringResources.APP_USER_LIST, path: NavigationPathEnum.MEMBERS});
        break;
      case NavigationPathEnum.MEMBERS_MANAGE:
        breadcrumbList.push({title: StringResources.APP_USER_LIST, path: NavigationPathEnum.MEMBERS});
        breadcrumbList.push({
          title: id > 0 ? StringResources.APP_USER_EDIT : StringResources.APP_USER_CREATE,
          path: NavigationPathEnum.MEMBERS_MANAGE
        });
        break;
      case NavigationPathEnum.MEMBERS_DETAIL:
        breadcrumbList.push({title: StringResources.APP_USER_LIST, path: NavigationPathEnum.MEMBERS});
        breadcrumbList.push({title: StringResources.DETAIL, path: NavigationPathEnum.MEMBERS_DETAIL});
        break;
      case NavigationPathEnum.ASSESSMENT_MANAGE:
        breadcrumbList.push({title: StringResources.APP_USER_LIST, path: NavigationPathEnum.MEMBERS});
        breadcrumbList.push({title: StringResources.DETAIL, path: NavigationPathEnum.MEMBERS_DETAIL, id: id});
        breadcrumbList.push({title: StringResources.ASSESSMENT, path: NavigationPathEnum.ASSESSMENT_MANAGE});
        break;
      case NavigationPathEnum.MEMBER_PAYMENT_HISTORY:
        breadcrumbList.push({title: StringResources.APP_USER_LIST, path: NavigationPathEnum.MEMBERS});
        breadcrumbList.push({title: StringResources.DETAIL, path: NavigationPathEnum.MEMBERS_DETAIL, id: id});
        breadcrumbList.push({title: StringResources.PAYMENT_HISTORY, path: NavigationPathEnum.MEMBER_PAYMENT_HISTORY});
        break;
      case NavigationPathEnum.MEMBER_ISSUES:
        breadcrumbList.push({title: StringResources.APP_USER_LIST, path: NavigationPathEnum.MEMBERS});
        breadcrumbList.push({title: StringResources.DETAIL, path: NavigationPathEnum.MEMBERS_DETAIL, id: id});
        breadcrumbList.push({title: StringResources.MEMBER_ISSUES, path: NavigationPathEnum.MEMBER_ISSUES});
        break;
      case NavigationPathEnum.MEMBER_CALL_SCHEDULE:
        breadcrumbList.push({title: StringResources.APP_USER_LIST, path: NavigationPathEnum.MEMBERS});
        breadcrumbList.push({title: StringResources.DETAIL, path: NavigationPathEnum.MEMBERS_DETAIL, id: id});
        breadcrumbList.push({title: StringResources.CALL_SCHEDULE, path: NavigationPathEnum.MEMBER_CALL_SCHEDULE});
        break;
      case NavigationPathEnum.MEMBER_POCKET_GUIDE:
        breadcrumbList.push({title: StringResources.APP_USER_LIST, path: NavigationPathEnum.MEMBERS});
        breadcrumbList.push({title: StringResources.DETAIL, path: NavigationPathEnum.MEMBERS_DETAIL, id: id});
        breadcrumbList.push({title: StringResources.POCKET_GUIDES, path: NavigationPathEnum.POCKET_GUIDES});
        break;
      case NavigationPathEnum.MEMBER_HEALTH_ISSUE:
        breadcrumbList.push({title: StringResources.APP_USER_LIST, path: NavigationPathEnum.MEMBERS});
        breadcrumbList.push({title: StringResources.DETAIL, path: NavigationPathEnum.MEMBERS_DETAIL, id: id});
        breadcrumbList.push({title: StringResources.HEALTH_ISSUES, path: NavigationPathEnum.MEMBER_HEALTH_ISSUE});
        break;
      case NavigationPathEnum.MEMBER_BODY_STATS:
        breadcrumbList.push({title: StringResources.APP_USER_LIST, path: NavigationPathEnum.MEMBERS});
        breadcrumbList.push({title: StringResources.DETAIL, path: NavigationPathEnum.MEMBERS_DETAIL, id: id});
        breadcrumbList.push({title: StringResources.BODY_STATS, path: NavigationPathEnum.MEMBER_BODY_STATS});
        break;

      case NavigationPathEnum.REFERRER:
        breadcrumbList.push({title: StringResources.REFERRER, path: NavigationPathEnum.REFERRER});
        break;
      case NavigationPathEnum.REFERRER_MANAGE:
        breadcrumbList.push({title: StringResources.REFERRER, path: NavigationPathEnum.REFERRER});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_REFERRER : StringResources.ADD_REFERRER,
          path: NavigationPathEnum.REFERRER_MANAGE
        });
        break;
      case NavigationPathEnum.REFERRER_DETAIL:
        breadcrumbList.push({title: StringResources.REFERRER, path: NavigationPathEnum.REFERRER});
        breadcrumbList.push({
          title: StringResources.DETAIL,
          path: NavigationPathEnum.REFERRER_DETAIL
        });
        break;

      case NavigationPathEnum.POCKET_GUIDES:
        breadcrumbList.push({title: StringResources.POCKET_GUIDES, path: NavigationPathEnum.POCKET_GUIDES});
        break;
      case NavigationPathEnum.POCKET_GUIDES_MANAGE:
        breadcrumbList.push({title: StringResources.POCKET_GUIDES, path: NavigationPathEnum.POCKET_GUIDES});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_POCKET_GUIDE : StringResources.ADD_POCKET_GUIDE,
          path: NavigationPathEnum.POCKET_GUIDES_MANAGE
        });
        break;

      case NavigationPathEnum.FAQ:
        breadcrumbList.push({title: StringResources.FAQS, path: NavigationPathEnum.FAQ});
        break;
      case NavigationPathEnum.FAQ_MANAGE:
        breadcrumbList.push({title: StringResources.FAQS, path: NavigationPathEnum.FAQ});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_FAQ : StringResources.ADD_FAQ,
          path: NavigationPathEnum.FAQ_MANAGE
        });
        break;

      case NavigationPathEnum.BLOGS:
        breadcrumbList.push({title: StringResources.BLOGS, path: NavigationPathEnum.BLOGS});
        break;
      case NavigationPathEnum.BLOGS_MANAGE:
        breadcrumbList.push({title: StringResources.BLOGS, path: NavigationPathEnum.BLOGS});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_BLOG : StringResources.ADD_BLOG,
          path: NavigationPathEnum.BLOGS_MANAGE
        });
        break;

      case NavigationPathEnum.RECIPES:
        breadcrumbList.push({title: StringResources.RECIPES, path: NavigationPathEnum.RECIPES});
        break;
      case NavigationPathEnum.RECIPES_MANAGE:
        breadcrumbList.push({title: StringResources.RECIPES, path: NavigationPathEnum.RECIPES});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_RECIPE : StringResources.ADD_RECIPE,
          path: NavigationPathEnum.RECIPES_MANAGE
        });
        break;

      case NavigationPathEnum.DIET_TEMPLATE:
        breadcrumbList.push({title: StringResources.DIET_TEMPLATE, path: NavigationPathEnum.DIET_TEMPLATE});
        break;
      case NavigationPathEnum.DIET_TEMPLATE_MANAGE:
        breadcrumbList.push({title: StringResources.DIET_TEMPLATE, path: NavigationPathEnum.DIET_TEMPLATE});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_DIET_PLAN : StringResources.ADD_DIET_PLAN,
          path: NavigationPathEnum.DIET_TEMPLATE_MANAGE
        });
        break;
      case NavigationPathEnum.DIET_TEMPLATE_DETAILS:
        breadcrumbList.push({title: StringResources.DIET_TEMPLATE, path: NavigationPathEnum.DIET_TEMPLATE});
        breadcrumbList.push({
          title: StringResources.DIET_TEMPLATE,
          path: NavigationPathEnum.DIET_TEMPLATE_DETAILS
        });
        break;

      case NavigationPathEnum.PROGRAM:
        breadcrumbList.push({title: StringResources.PROGRAMS, path: NavigationPathEnum.PROGRAM});
        break;
      case NavigationPathEnum.PROGRAM_MANAGE:
        breadcrumbList.push({title: StringResources.PROGRAMS, path: NavigationPathEnum.PROGRAM});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_PROGRAM : StringResources.ADD_PROGRAM,
          path: NavigationPathEnum.PROGRAM_MANAGE
        });
        break;

      case NavigationPathEnum.PROGRAM_PLAN:
        breadcrumbList.push({title: StringResources.PLANS, path: NavigationPathEnum.PROGRAM_PLAN});
        break;
      case NavigationPathEnum.PROGRAM_PLAN_MANAGE:
        breadcrumbList.push({title: StringResources.PLANS, path: NavigationPathEnum.PROGRAM_PLAN});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_PROGRAM_PLAN : StringResources.ADD_PROGRAM_PLAN,
          path: NavigationPathEnum.PROGRAM_PLAN_MANAGE
        });
        break;
      case NavigationPathEnum.BLOOD_SUGAR:
        breadcrumbList.push({title: StringResources.BLOOD_SUGAR, path: NavigationPathEnum.BLOOD_SUGAR});
        break;
      case NavigationPathEnum.BLOOD_SUGAR_MANAGE:
        breadcrumbList.push({title: StringResources.BLOOD_SUGAR, path: NavigationPathEnum.BLOOD_SUGAR});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_BLOOD_SUGAR : StringResources.ADD_BLOOD_SUGAR,
          path: NavigationPathEnum.BLOOD_SUGAR_MANAGE
        });
        break;

      case NavigationPathEnum.EATING_HABIT:
        breadcrumbList.push({title: StringResources.EATING_HABIT, path: NavigationPathEnum.EATING_HABIT});
        break;
      case NavigationPathEnum.EATING_HABIT_MANAGE:
        breadcrumbList.push({title: StringResources.EATING_HABIT, path: NavigationPathEnum.EATING_HABIT});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_EATING_HABIT : StringResources.ADD_EATING_HABIT,
          path: NavigationPathEnum.EATING_HABIT_MANAGE
        });
        break;

      case NavigationPathEnum.GENDER:
        breadcrumbList.push({title: StringResources.GENDER, path: NavigationPathEnum.GENDER});
        break;
      case NavigationPathEnum.GENDER_MANAGE:
        breadcrumbList.push({title: StringResources.GENDER, path: NavigationPathEnum.GENDER});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_GENDER : StringResources.ADD_GENDER,
          path: NavigationPathEnum.GENDER_MANAGE
        });
        break;

      case NavigationPathEnum.HEALTH_PARAMETERS:
        breadcrumbList.push({title: StringResources.HEALTH_PARAMETERS, path: NavigationPathEnum.HEALTH_PARAMETERS});
        break;
      case NavigationPathEnum.HEALTH_PARAMETERS_MANAGE:
        breadcrumbList.push({title: StringResources.HEALTH_PARAMETERS, path: NavigationPathEnum.HEALTH_PARAMETERS});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_HEALTH_PARAMETERS : StringResources.ADD_HEALTH_PARAMETERS,
          path: NavigationPathEnum.HEALTH_PARAMETERS_MANAGE
        });
        break;

      case NavigationPathEnum.LIFESTYLE:
        breadcrumbList.push({title: StringResources.LIFESTYLE, path: NavigationPathEnum.LIFESTYLE});
        break;
      case NavigationPathEnum.LIFESTYLE_MANAGE:
        breadcrumbList.push({title: StringResources.LIFESTYLE, path: NavigationPathEnum.LIFESTYLE});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_LIFESTYLE : StringResources.ADD_LIFESTYLE,
          path: NavigationPathEnum.LIFESTYLE_MANAGE
        });
        break;

      case NavigationPathEnum.MARITAL_STATUS:
        breadcrumbList.push({title: StringResources.MARITAL_STATUS, path: NavigationPathEnum.MARITAL_STATUS});
        break;
      case NavigationPathEnum.MARITAL_STATUS_MANAGE:
        breadcrumbList.push({title: StringResources.MARITAL_STATUS, path: NavigationPathEnum.MARITAL_STATUS});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_MARITAL_STATUS : StringResources.ADD_MARITAL_STATUS,
          path: NavigationPathEnum.MARITAL_STATUS_MANAGE
        });
        break;

      case NavigationPathEnum.RELIGION:
        breadcrumbList.push({title: StringResources.RELIGION, path: NavigationPathEnum.RELIGION});
        break;
      case NavigationPathEnum.RELIGION_MANAGE:
        breadcrumbList.push({title: StringResources.RELIGION, path: NavigationPathEnum.RELIGION});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_RELIGION : StringResources.ADD_RELIGION,
          path: NavigationPathEnum.RELIGION_MANAGE
        });
        break;

      case NavigationPathEnum.SLEEPING_PATTERN:
        breadcrumbList.push({title: StringResources.SLEEPING_PATTERN, path: NavigationPathEnum.SLEEPING_PATTERN});
        break;
      case NavigationPathEnum.SLEEPING_PATTERN_MANAGE:
        breadcrumbList.push({title: StringResources.SLEEPING_PATTERN, path: NavigationPathEnum.SLEEPING_PATTERN});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_SLEEPING_PATTERN : StringResources.ADD_SLEEPING_PATTERN,
          path: NavigationPathEnum.SLEEPING_PATTERN_MANAGE
        });
        break;

      case NavigationPathEnum.TYPE_OF_EXERCISE:
        breadcrumbList.push({title: StringResources.TYPE_OF_EXERCISE, path: NavigationPathEnum.TYPE_OF_EXERCISE});
        break;
      case NavigationPathEnum.TYPE_OF_EXERCISE_MANAGE:
        breadcrumbList.push({title: StringResources.TYPE_OF_EXERCISE, path: NavigationPathEnum.TYPE_OF_EXERCISE});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_TYPE_OF_EXERCISE : StringResources.ADD_TYPE_OF_EXERCISE,
          path: NavigationPathEnum.TYPE_OF_EXERCISE_MANAGE
        });
        break;

      case NavigationPathEnum.URINE_OUTPUT:
        breadcrumbList.push({title: StringResources.URINE_OUTPUT, path: NavigationPathEnum.URINE_OUTPUT});
        break;
      case NavigationPathEnum.URINE_OUTPUT_MANAGE:
        breadcrumbList.push({title: StringResources.URINE_OUTPUT, path: NavigationPathEnum.URINE_OUTPUT});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_URINE_OUTPUT : StringResources.ADD_URINE_OUTPUT,
          path: NavigationPathEnum.URINE_OUTPUT_MANAGE
        });
        break;

      case NavigationPathEnum.NUTRITIVE:
        breadcrumbList.push({title: StringResources.NUTRITIVE, path: NavigationPathEnum.NUTRITIVE});
        break;
      case NavigationPathEnum.NUTRITIVE_MANAGE:
        breadcrumbList.push({title: StringResources.NUTRITIVE, path: NavigationPathEnum.NUTRITIVE});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_NUTRITIVE : StringResources.ADD_NUTRITIVE,
          path: NavigationPathEnum.NUTRITIVE_MANAGE
        });
        break;

      case NavigationPathEnum.RECIPE_CATEGORY:
        breadcrumbList.push({title: StringResources.RECIPE_CATEGORY, path: NavigationPathEnum.RECIPE_CATEGORY});
        break;
      case NavigationPathEnum.RECIPE_CATEGORY_MANAGE:
        breadcrumbList.push({title: StringResources.RECIPE_CATEGORY, path: NavigationPathEnum.RECIPE_CATEGORY});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_RECIPE_CATEGORY : StringResources.ADD_RECIPE_CATEGORY,
          path: NavigationPathEnum.RECIPE_CATEGORY_MANAGE
        });
        break;

      case NavigationPathEnum.RECIPE_CUISINE:
        breadcrumbList.push({title: StringResources.RECIPE_CUISINE, path: NavigationPathEnum.RECIPE_CUISINE});
        break;
      case NavigationPathEnum.RECIPE_CUISINE_MANAGE:
        breadcrumbList.push({title: StringResources.RECIPE_CUISINE, path: NavigationPathEnum.RECIPE_CUISINE});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_RECIPE_CUISINE : StringResources.ADD_RECIPE_CUISINE,
          path: NavigationPathEnum.RECIPE_CUISINE_MANAGE
        });
        break;

      case NavigationPathEnum.CALL_TYPE:
        breadcrumbList.push({title: StringResources.CALL_TYPE, path: NavigationPathEnum.CALL_TYPE});
        break;
      case NavigationPathEnum.CALL_TYPE_MANAGE:
        breadcrumbList.push({title: StringResources.CALL_TYPE, path: NavigationPathEnum.CALL_TYPE});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_CALL_TYPE : StringResources.ADD_CALL_TYPE,
          path: NavigationPathEnum.CALL_TYPE_MANAGE
        });
        break;

      case NavigationPathEnum.CALL_PURPOSE:
        breadcrumbList.push({title: StringResources.CALL_PURPOSE, path: NavigationPathEnum.CALL_PURPOSE});
        break;
      case NavigationPathEnum.CALL_PURPOSE_MANAGE:
        breadcrumbList.push({title: StringResources.CALL_PURPOSE, path: NavigationPathEnum.CALL_PURPOSE});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_CALL_PURPOSE : StringResources.ADD_CALL_PURPOSE,
          path: NavigationPathEnum.CALL_PURPOSE_MANAGE
        });
        break;


      case NavigationPathEnum.BLOG_AUTHOR:
        breadcrumbList.push({title: StringResources.BLOG_AUTHOR, path: NavigationPathEnum.BLOG_AUTHOR});
        break;
      case NavigationPathEnum.BLOG_AUTHOR_MANAGE:
        breadcrumbList.push({title: StringResources.BLOG_AUTHOR, path: NavigationPathEnum.BLOG_AUTHOR});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_BLOG_AUTHOR : StringResources.ADD_BLOG_AUTHOR,
          path: NavigationPathEnum.BLOG_AUTHOR_MANAGE
        });
        break;

      case NavigationPathEnum.BLOG_CATEGORY:
        breadcrumbList.push({title: StringResources.BLOG_CATEGORY, path: NavigationPathEnum.BLOG_CATEGORY});
        break;
      case NavigationPathEnum.BLOG_CATEGORY_MANAGE:
        breadcrumbList.push({title: StringResources.BLOG_CATEGORY, path: NavigationPathEnum.BLOG_CATEGORY});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_BLOG_CATEGORY : StringResources.ADD_BLOG_CATEGORY,
          path: NavigationPathEnum.BLOG_CATEGORY_MANAGE
        });
        break;

      case NavigationPathEnum.PROGRAM_CATEGORY:
        breadcrumbList.push({title: StringResources.PROGRAM_CATEGORY, path: NavigationPathEnum.PROGRAM_CATEGORY});
        break;
      case NavigationPathEnum.PROGRAM_CATEGORY_MANAGE:
        breadcrumbList.push({title: StringResources.PROGRAM_CATEGORY, path: NavigationPathEnum.PROGRAM_CATEGORY});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_PROGRAM_CATEGORY : StringResources.ADD_PROGRAM_CATEGORY,
          path: NavigationPathEnum.PROGRAM_CATEGORY_MANAGE
        });
        break;

      case NavigationPathEnum.FAQ_CATEGORY:
        breadcrumbList.push({title: StringResources.FAQ_CATEGORY, path: NavigationPathEnum.FAQ_CATEGORY});
        break;
      case NavigationPathEnum.FAQ_CATEGORY_MANAGE:
        breadcrumbList.push({title: StringResources.FAQ_CATEGORY, path: NavigationPathEnum.FAQ_CATEGORY});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_FAQ_CATEGORY : StringResources.ADD_FAQ_CATEGORY,
          path: NavigationPathEnum.FAQ_CATEGORY_MANAGE
        });
        break;


      case NavigationPathEnum.COUNTRY:
        breadcrumbList.push({title: StringResources.COUNTRY, path: NavigationPathEnum.COUNTRY});
        break;
      case NavigationPathEnum.COUNTRY_MANAGE:
        breadcrumbList.push({title: StringResources.COUNTRY, path: NavigationPathEnum.COUNTRY});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_COUNTRY : StringResources.ADD_COUNTRY,
          path: NavigationPathEnum.COUNTRY_MANAGE
        });
        break;


      case NavigationPathEnum.STATE:
        breadcrumbList.push({title: StringResources.STATE, path: NavigationPathEnum.STATE});
        break;
      case NavigationPathEnum.STATE_MANAGE:
        breadcrumbList.push({title: StringResources.STATE, path: NavigationPathEnum.STATE});
        breadcrumbList.push({
          title: id > 0 ? StringResources.EDIT_STATE : StringResources.ADD_STATE,
          path: NavigationPathEnum.STATE_MANAGE
        });
        break;

      case NavigationPathEnum.SETTING:
        breadcrumbList.push({title: StringResources.SETTING, path: NavigationPathEnum.SETTING_MANAGE});
        break;

    }
    this.sharedService.setBreadcrumb(breadcrumbList);
  }
}
