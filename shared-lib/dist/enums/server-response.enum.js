/**
 * Server Response Status Codes
 * Used across all EatFit247 applications for consistent API responses
 */
export var ServerResponseEnum;
(function (ServerResponseEnum) {
    ServerResponseEnum[ServerResponseEnum["SUCCESS"] = 200] = "SUCCESS";
    ServerResponseEnum[ServerResponseEnum["CREATED"] = 201] = "CREATED";
    ServerResponseEnum[ServerResponseEnum["UPDATED"] = 202] = "UPDATED";
    ServerResponseEnum[ServerResponseEnum["DELETED"] = 203] = "DELETED";
    ServerResponseEnum[ServerResponseEnum["ERROR"] = 400] = "ERROR";
    ServerResponseEnum[ServerResponseEnum["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    ServerResponseEnum[ServerResponseEnum["FORBIDDEN"] = 403] = "FORBIDDEN";
    ServerResponseEnum[ServerResponseEnum["NOT_FOUND"] = 404] = "NOT_FOUND";
    ServerResponseEnum[ServerResponseEnum["VALIDATION_ERROR"] = 422] = "VALIDATION_ERROR";
    ServerResponseEnum[ServerResponseEnum["SERVER_ERROR"] = 500] = "SERVER_ERROR";
    ServerResponseEnum[ServerResponseEnum["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
})(ServerResponseEnum || (ServerResponseEnum = {}));
export var AlertTypeEnum;
(function (AlertTypeEnum) {
    AlertTypeEnum["SUCCESS"] = "success";
    AlertTypeEnum["ERROR"] = "error";
    AlertTypeEnum["WARNING"] = "warning";
    AlertTypeEnum["INFO"] = "info";
})(AlertTypeEnum || (AlertTypeEnum = {}));
