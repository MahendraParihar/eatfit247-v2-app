export class Constants {
  public static IS_DEV = true;
  public static DEVICE = 'Admin Panel';
  public static DEFAULT_PAGE_SIZE = 50;
  public static MASTER_PAGE_SIZE = 50;
  public static CH_PK = 'FJK&SDFF%7$8EW50';
  public static CH_IV_K = 'FHA*HJK%U5U@TE87';

  public static EMAIL_REGEX = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';
  public static AGE_REGEX = '^(0?[1-9]|[1-9][0-9]|[1][1-9][1-9]|200)$';
  public static PASSWORD_REGEX = '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$';
  public static PHONE_REGEX = '/^([+]\\d{2})?\\d{10}$/';
  public static FLOAT_REGEX = '^[0-9]\\d*(\\.\\d+)?$';
  public static LAT_REGEX = '/^-?([1-8]?[1-9]|[1-9]0)\\.{1}\\d{1,15}/g';
  public static LONG_REGEX = '/^-?(([-+]?)([\\d]{1,3})((\\.)(\\d+))?)/g';
  public static NUMBER_REGEX = '^[0-9]*$';
  public static DEFAULT_CURRENCY = 'INR';

  public static PAGE_SIZE_LIST = [15, 30, 50, 100];

  public static editorConfig: any = {
    editable: true,
    spellcheck: true,
    height: '200px',
    minHeight: '0',
    maxHeight: 'auto',
    width: 'auto',
    minWidth: '0',
    translate: 'yes',
    enableToolbar: true,
    showToolbar: true,
    placeholder: 'Enter text here...',
    defaultParagraphSeparator: '',
    defaultFontName: '',
    defaultFontSize: '',
    uploadUrl: 'v1/image',
    uploadWithCredentials: false,
    insertImage: false,
    insertVideo: false,
    sanitize: true,
    toolbarPosition: 'top',
    toolbarHiddenButtons: [
      [
        'insertImage',
        'insertVideo',
        'insertHorizontalRule',
        'removeFormat',
        'toggleEditorMode',
      ],
      []
    ]
  };

  public static editorConfigOnlyText: any = {
    editable: true,
    spellcheck: true,
    minHeight: '80px',
    maxHeight: 'auto',
    width: 'auto',
    minWidth: '0',
    translate: 'yes',
    enableToolbar: true,
    showToolbar: true,
    placeholder: 'Enter text here...',
    defaultParagraphSeparator: '',
    defaultFontName: '',
    defaultFontSize: '',
    uploadWithCredentials: false,
    insertImage: false,
    insertVideo: false,
    sanitize: true,
    toolbarPosition: 'top',
    toolbarHiddenButtons: [
      ['strikeThrough',
        'subscript',
        'superscript',
        'justifyLeft',
        'justifyCenter',
        'justifyRight',
        'justifyFull',
        'indent',
        'outdent',
        'heading',
        'fontName',
        'customClasses',
        'link',
        'unlink',
        'insertImage',
        'insertVideo',
        'insertHorizontalRule',
        'removeFormat',
        'toggleEditorMode',
        'fontSize',
        'textColor',
        'backgroundColor',
        'customClasses'
      ],
      []
    ]
  };

  public static DEFAULT_DATE_FORMAT = 'DD-MMM-YYYY';
  public static DEFAULT_DATE_TIME_FORMAT = 'DD-MMM-YYYY hh:mm A';
  public static DEFAULT_TIME_FORMAT = 'hh:mm:ss';
  public static DISPLAY_TIME_FORMAT = 'hh:mm A';

  public static APP_DATE_FORMATS: any = {
    parse: {
      dateInput: 'YYYY-MM-DD',
    },
    display: {
      dateInput: 'DD-MMM-YYYY',
      monthYearLabel: 'MMMM YYYY',
      dateA11yLabel: 'LL',
      monthYearA11yLabel: 'MMMM YYYY'
    },
  };
}
