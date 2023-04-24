import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {StringResources} from "../../../../enum/string-resources";

@Component({
  selector: 'app-no-data-found',
  templateUrl: './no-data-found.component.html',
  styleUrls: ['./no-data-found.component.scss']
})
export class NoDataFoundComponent implements OnInit {

  @Input()
  title: string;

  @Input()
  message: string;

  @Input()
  image: string;

  @Output()
  buttonClick: EventEmitter<any> = new EventEmitter<any>();

  stringResources = StringResources;

  constructor() {
  }

  ngOnInit(): void {
  }

  backToPage(): void {
    this.buttonClick.emit();
  }

}
