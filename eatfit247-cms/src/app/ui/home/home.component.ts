import {Component, NgZone, OnInit} from '@angular/core';
import {ApiUrlEnum} from 'src/app/enum/api-url-enum';
import {ServerResponseEnum} from 'src/app/enum/server-response-enum';
import {ResponseDataModel} from 'src/app/models/response-data.model';
import {HttpService} from 'src/app/service/http.service';
import {SnackBarService} from 'src/app/service/snack-bar.service';
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import {DashboardItemModel, DashboardModel} from 'src/app/models/dashboard-item.model';
import {StringResources} from 'src/app/enum/string-resources';
import {FormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {uniq} from 'lodash';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  dbModel: DashboardModel;
  lineSeries: any;
  stringResources = StringResources;
  yearList: number[] = [];
  formGroup: UntypedFormGroup = this.formBuilder.group({
    year: [null, [Validators.required]],
  });

  chartList: any = [];

  constructor(private httpService: HttpService,
              private snackBarService: SnackBarService,
              private formBuilder: FormBuilder,
              private zone: NgZone) {
  }

  async ngOnInit(): Promise<void> {
    await this.loadDashboardData();
  }

  ngOnDestroy() {
    this.zone.runOutsideAngular(() => {
      if (this.chartList) {
        for (const chart of this.chartList) {
          chart.dispose();
        }
      }
    });
  }

  loadDataByYear() {
    const year = this.formGroup.value.year;
    const find = this.dbModel.memberMonthlyCountList.filter(x => x.id === year);
    this.initLineChart('membersByMonthChartdiv', find && find.length > 0 ? find[0].items : []);
  }

  private async loadDashboardData() {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_DASHBOARD, null, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.dbModel = DashboardModel.fromJson(res.data);

          this.initializeChartData();

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

  private initializeControls() {
    const currentYear: number = new Date().getFullYear();
    this.yearList = uniq(this.dbModel.memberMonthlyCountList.map(x => x.id));
    this.formGroup.patchValue({
      year: currentYear
    });
    this.loadDataByYear();
  }

  private initializeChartData() {

    this.initPieChart('issueStatusChartdiv', this.dbModel.issueStatusCountList);
    this.initPieChart('memberStatusChartdiv', this.dbModel.memberStatusCountList);
    this.initPieChart('memberProgramChartdiv', this.dbModel.memberProgramCountList);
    this.initPieChart('memberPlanChartdiv', this.dbModel.memberPlanCountList);
    this.initPieChart('paymentModeChartdiv', this.dbModel.paymentModeCountList);
    this.initializeControls();

  }

  private initLineChart(chartName: string, dbItemList: DashboardItemModel[]): void {

    if (this.lineSeries) {
      this.lineSeries.data.setAll(dbItemList);
      this.lineSeries.appear(1000);
      return;
    }

    const root = am5.Root.new(chartName);

    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    if (root._logo) {
      root._logo.dispose();
    }

    // Create chart
    const chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: "panX",
      wheelY: "zoomX",
      layout: root.verticalLayout
    }));

    chart.set(
      "scrollbarX",
      am5.Scrollbar.new(root, {
        orientation: "horizontal"
      })
    );

    let xRenderer = am5xy.AxisRendererX.new(root, {});
    let xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "name",
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {})
      }),
    );
    xRenderer.grid.template.setAll({
      location: 1
    });

    xAxis.data.setAll(dbItemList);


    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        min: 0,
        max: 100,
        renderer: am5xy.AxisRendererY.new(root, {
          strokeOpacity: 0.1
        })
      })
    );


    const series = chart.series.push(am5xy.LineSeries.new(root, {
      name: "Monthly Member Count",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "value",
      categoryXField: "name",
      tooltip: am5.Tooltip.new(root, {
        pointerOrientation: "horizontal",
        labelText: "{categoryX}: {valueY}"
      })
    }));

    series.bullets.push(function () {
      return am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          strokeWidth: 3,
          stroke: series.get("stroke"),
          radius: 5,
          fill: root.interfaceColors.get("background")
        })
      });
    });

    series.strokes.template.setAll({
      strokeWidth: 3,
      templateField: "strokeSettings"
    });


    chart.set("cursor", am5xy.XYCursor.new(root, {}));

    // Add legend
    let legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50
      })
    );
    legend.data.setAll(chart.series.values);

    // Add scrollbar
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
      orientation: "horizontal"
    }));

    this.lineSeries = series;
    this.lineSeries.data.setAll(dbItemList);
    this.lineSeries.appear(1000);
    chart.appear(1000, 100);

  }

  private initPieChart(chartName: string, dbItemList: DashboardItemModel[]): void {

    const root = am5.Root.new(chartName);

    this.chartList.push(root);

    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    if (root._logo) {
      root._logo.dispose();
    }
    // Create chart
    const chart = root.container.children.push(am5percent.PieChart.new(root, {
      layout: root.horizontalLayout,
      innerRadius: am5.percent(50)

    }));


    const series = chart.series.push(am5percent.PieSeries.new(root, {
      valueField: "value",
      categoryField: "name",
      alignLabels: false,
      legendLabelText: "{category}",
      legendValueText: "{value}",
      tooltip: am5.Tooltip.new(root, {
        pointerOrientation: "horizontal",
        labelText: "{category}: {value}"
      })

    }));


    series.labels.template.set("visible", false);
    series.ticks.template.set("visible", false)

    series.data.setAll(dbItemList);


    var legend = chart.children.push(am5.Legend.new(root, {
      layout: root.verticalLayout,
      height: am5.percent(100),
      verticalScrollbar: am5.Scrollbar.new(root, {
        orientation: "vertical"
      })

    }));

    legend.data.setAll(series.dataItems);

    // set value labels align to right
    legend.valueLabels.template.setAll({textAlign: "left"});

    // set width and max width of labels
    legend.labels.template.setAll({
      oversizedBehavior: "wrap",
    });


    // Play initial series animation
    series.appear(1000, 100);
  }


}
