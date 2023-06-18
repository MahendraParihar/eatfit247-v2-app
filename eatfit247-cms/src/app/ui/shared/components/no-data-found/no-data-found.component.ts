import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { StringResources } from "../../../../enum/string-resources";

@Component({
  selector: "app-no-data-found",
  templateUrl: "./no-data-found.component.html",
  styleUrls: ["./no-data-found.component.scss"]
})
export class NoDataFoundComponent implements OnInit {
  @Input()
  title: string;
  @Input()
  message: string;
  @Input()
  image: string;
  @Input()
  btnText: string = StringResources.BACK_TO_PREVIOUS_PAGE;
  @Input()
  showBtn: boolean = true;
  @Output()
  buttonClick: EventEmitter<any> = new EventEmitter<any>();

  constructor() {
  }

  ngOnInit(): void {
  }

  backToPage(): void {
    this.buttonClick.emit();
  }
}
