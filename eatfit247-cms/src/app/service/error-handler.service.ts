import {ErrorHandler, Injectable, Injector} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {SnackBarService} from './snack-bar.service';
import {NavigationService} from "./navigation.service";

@Injectable({
  providedIn: 'root'
})
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService implements ErrorHandler {

  isNetAvailable = true;

  constructor(private injector: Injector) {
  }

  private static getClientMessage(error: Error): string {
    if (!navigator.onLine) {
      return 'No Internet Connection';
    }
    return error.message ? error.message : error.toString();
  }

  private static getClientStack(error: Error): string {
    return (error && error.stack) ? error.stack.toString() : '';
  }

  private static getClientType(error: Error): string {
    return error.name;
  }

  private static getServerMessage(error: HttpErrorResponse): string {
    let tempString = '';
    try {
      switch (error.status) {
        case 400:
          // bad request, validation error from server
          if (error.error) {
            tempString = 'Bad request';
          }
          break;
        case 422:
          // Unprocessable Entity
          if (error.error.errors && error.error.errors.length > 0) {
            // tempString = error.message + '\n';
            for (let i = 0; i < error.error.errors.length; i++) {
              tempString = tempString + error.error.errors[i].field + ' ' + tempString + error.error.errors[i].code;
              if (i !== error.error.errors.length - 1) {
                tempString = tempString + '\n';
              }
            }
          }
          break;
        case 401:
          tempString = error.message;
          break;
        case 404:
          // Url Not found
          tempString = error.message;
          break;
        case 0:
          tempString = error.message;
          break;
        case 304:
          // Not Modified
          tempString = error.message;
          break;
        case 500:
          //  Internal server error
          tempString = error.message;
          break;
        case 503:
          //  Service Unavailable
          tempString = error.message;
          break;
        default:
          tempString = error.message;
          break;
      }
    } catch (e: any) {
      tempString = e.message;
    }
    console.log(tempString);
    return tempString;
  }


  private static getServerStack(error: HttpErrorResponse): string {
    return error.status.toString();
  }

  private static getServerType(error: HttpErrorResponse): string {
    return error.name;
  }

  private static getStatusText(error: HttpErrorResponse): string {
    return error.statusText;
  }

  handleError(error: Error | HttpErrorResponse): void {
    console.log(error);
    const logger = this.injector.get(ErrorHandlerService);
    const notifier = this.injector.get(SnackBarService);
    const navigation = this.injector.get(NavigationService);

    let type;
    let message;
    let stackTrace;
    let status;

    if (error instanceof HttpErrorResponse) {
      // Server Error
      type = ErrorHandlerService.getServerType(error);
      message = ErrorHandlerService.getServerMessage(error);
      stackTrace = ErrorHandlerService.getServerStack(error);
      status = error.status;

      if (status === 401) {
        notifier.showError(message, false);
        navigation.navigateToLogin();
        return;
      }

      if (!navigator.onLine) {
        this.isNetAvailable = false;
        // TODO navigate to offline system page
        return;
      } else {
        notifier.showError(message, false);
        // navigation.navigateToLogin();
      }
    } else {
      type = ErrorHandlerService.getClientType(error);
      message = ErrorHandlerService.getClientMessage(error);
      stackTrace = ErrorHandlerService.getClientStack(error);
    }

    if (this.isNetAvailable) {
      // Always log errors
      logger.loadException(type, message, stackTrace);
    }
  }

  async loadException(type: any, message: any, stack: any): Promise<boolean> {
    // const m = new ExceptionModel();
    const data = {
      exceptionMessage: message ? message : '',
      exceptionType: type ? type : '',
      stackTrace: stack,
      className: 'Angular',
      methodName: 'Angular',
      platform: 'WEB'
    };
    return true;
    // TODO API hit for log error on db
  }
}
