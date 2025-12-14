# Data Table Component

A generic, configurable table component built with Angular Material that supports dynamic columns, pagination, sorting, search, row actions, and custom cell templates.

## Features

- ✅ **Dynamic Columns** - Configure columns with custom properties, formatters, and templates
- ✅ **Pagination** - Built-in pagination with customizable page sizes
- ✅ **Sorting** - Sortable columns with custom sort functions
- ✅ **Search** - Global search with debouncing support
- ✅ **Row Actions** - Edit, delete, view, and custom actions per row
- ✅ **API-driven Data** - Works seamlessly with API services
- ✅ **Custom Cell Templates** - Use Angular templates for custom cell rendering
- ✅ **Row Selection** - Optional checkbox selection for bulk operations
- ✅ **Loading States** - Built-in loading indicator
- ✅ **Empty States** - Customizable empty state messages and templates
- ✅ **Sticky Columns** - Support for sticky left/right columns
- ✅ **Responsive** - Mobile-friendly design

## Installation

The component is already available in the `@shared` library. Import it in your component:

```typescript
import { DataTableComponent, TableColumn, TableConfig, TableAction } from '@shared';
```

## Basic Usage

```typescript
import { Component } from '@angular/core';
import { DataTableComponent, TableColumn, TableConfig } from '@shared';
import { IBlog, ITableList } from '@eatfit247-shared-lib';
import { BlogsApiService } from 'blogs';

@Component({
  selector: 'app-blogs',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <app-data-table
      [config]="tableConfig"
      [data]="blogs"
      [totalCount]="totalCount"
      [loading]="loading"
      (pageChange)="onPageChange($event)"
      (sortChange)="onSortChange($event)"
      (searchChange)="onSearchChange($event)"
    ></app-data-table>
  `,
})
export class BlogsComponent {
  blogs: IBlog[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: TableConfig<IBlog>;

  constructor(private blogsApi: BlogsApiService) {
    this.initializeTable();
  }

  ngOnInit(): void {
    this.loadData();
  }

  private initializeTable(): void {
    const columns: TableColumn<IBlog>[] = [
      {
        key: 'blogId',
        label: 'ID',
        dataKey: 'blogId',
        sortable: true,
        width: '80px',
      },
      {
        key: 'title',
        label: 'Title',
        dataKey: 'title',
        sortable: true,
        searchable: true,
      },
      {
        key: 'active',
        label: 'Status',
        dataKey: 'active',
        sortable: true,
        formatter: (value) => (value ? 'Active' : 'Inactive'),
      },
    ];

    this.tableConfig = {
      columns,
      showSearch: true,
      showPagination: true,
      pageSize: 10,
    };
  }

  loadData(): void {
    this.loading = true;
    this.blogsApi.getList({ page: 0, limit: 10 }).subscribe({
      next: (response: ITableList<IBlog>) => {
        this.blogs = response.data;
        this.totalCount = response.count;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onPageChange(pagination: any): void {
    this.loading = true;
    this.blogsApi
      .getList({
        page: pagination.pageIndex,
        limit: pagination.pageSize,
      })
      .subscribe({
        next: (response: ITableList<IBlog>) => {
          this.blogs = response.data;
          this.totalCount = response.count;
          this.loading = false;
        },
      });
  }

  onSortChange(sort: any): void {
    // Handle sorting
  }

  onSearchChange(search: string): void {
    // Handle search with debouncing
  }
}
```

## Advanced Usage

### Custom Cell Templates

```typescript
@Component({
  template: `
    <app-data-table [config]="tableConfig" [data]="data">
      <!-- Custom status cell -->
      <ng-template #statusCell let-row let-value="value">
        <mat-chip [color]="value ? 'primary' : 'warn'">
          {{ value ? 'Active' : 'Inactive' }}
        </mat-chip>
      </ng-template>

      <!-- Custom image cell -->
      <ng-template #imageCell let-row let-value="value">
        <img [src]="value" alt="Image" class="table-image" />
      </ng-template>
    </app-data-table>
  `,
})
export class MyComponent {
  @ViewChild('statusCell') statusCellTemplate!: TemplateRef<any>;
  @ViewChild('imageCell') imageCellTemplate!: TemplateRef<any>;

  tableConfig: TableConfig = {
    columns: [
      {
        key: 'status',
        label: 'Status',
        cellTemplate: this.statusCellTemplate,
      },
      {
        key: 'image',
        label: 'Image',
        cellTemplate: this.imageCellTemplate,
      },
    ],
  };
}
```

### Row Actions

```typescript
const actions: TableAction<IBlog>[] = [
  {
    label: 'View',
    icon: 'visibility',
    color: 'primary',
    onClick: (row) => this.viewBlog(row),
  },
  {
    label: 'Edit',
    icon: 'edit',
    color: 'primary',
    onClick: (row) => this.editBlog(row),
  },
  {
    label: 'Delete',
    icon: 'delete',
    color: 'warn',
    onClick: (row) => this.deleteBlog(row),
    visible: (row) => row.active === true, // Conditional visibility
    disabled: (row) => row.locked === true, // Conditional disable
  },
];

this.tableConfig = {
  columns,
  actions,
};
```

### Row Selection

```typescript
this.tableConfig = {
  columns,
  selectable: true, // Enable row selection
};

// Handle selection changes
onSelectionChange(selected: IBlog[]): void {
  console.log('Selected items:', selected);
}
```

### Nested Data Access

```typescript
const columns: TableColumn<IBlog>[] = [
  {
    key: 'author',
    label: 'Author',
    dataKey: 'blogAuthor.firstName', // Access nested properties
    formatter: (value, row) => {
      return `${row.blogAuthor?.firstName} ${row.blogAuthor?.lastName}`;
    },
  },
];
```

### Sticky Columns

```typescript
const columns: TableColumn[] = [
  {
    key: 'id',
    label: 'ID',
    sticky: true, // Sticky to the left
  },
  {
    key: 'actions',
    label: 'Actions',
    sticky: true,
    stickyEnd: true, // Sticky to the right
  },
];
```

### Custom Row Classes

```typescript
this.tableConfig = {
  columns,
  rowClass: (row) => {
    if (row.active) {
      return 'active-row';
    }
    return 'inactive-row';
  },
};
```

## Configuration Options

### TableConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `TableColumn[]` | Required | Array of column definitions |
| `actions` | `TableAction[]` | `[]` | Array of row actions |
| `selectable` | `boolean` | `false` | Enable row selection |
| `showSearch` | `boolean` | `true` | Show search bar |
| `searchPlaceholder` | `string` | `'Search...'` | Search input placeholder |
| `showPagination` | `boolean` | `true` | Show pagination |
| `pageSize` | `number` | `10` | Default page size |
| `pageSizeOptions` | `number[]` | `[5, 10, 25, 50, 100]` | Available page sizes |
| `loading` | `boolean` | `false` | Show loading indicator |
| `emptyMessage` | `string` | `'No data available'` | Empty state message |
| `emptyTemplate` | `TemplateRef` | - | Custom empty state template |
| `showHeader` | `boolean` | `true` | Show table header |
| `onRowClick` | `(row: T) => void` | - | Row click handler |
| `rowClass` | `(row: T) => string \| string[]` | - | Custom row class function |

### TableColumn

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Unique column identifier |
| `label` | `string` | Column header label |
| `dataKey` | `string` | Property path (supports nested: `'user.name'`) |
| `sortable` | `boolean` | Enable sorting (default: `true`) |
| `sortFn` | `(a: T, b: T) => number` | Custom sort function |
| `searchable` | `boolean` | Include in search (default: `false`) |
| `cellTemplate` | `TemplateRef` | Custom cell template |
| `headerTemplate` | `TemplateRef` | Custom header template |
| `width` | `string` | Column width (CSS value) |
| `align` | `'left' \| 'center' \| 'right'` | Text alignment |
| `sticky` | `boolean` | Make column sticky |
| `stickyEnd` | `boolean` | Sticky to right side |
| `formatter` | `(value: any, row: T) => string` | Custom value formatter |
| `hidden` | `boolean` | Hide column |

### TableAction

| Property | Type | Description |
|----------|------|-------------|
| `label` | `string` | Action label (for tooltip) |
| `icon` | `string` | Material icon name |
| `color` | `'primary' \| 'accent' \| 'warn' \| ''` | Button color |
| `visible` | `(row: T) => boolean` | Conditional visibility |
| `disabled` | `(row: T) => boolean` | Conditional disable |
| `onClick` | `(row: T) => void` | Click handler |

## Events

| Event | Type | Description |
|-------|------|-------------|
| `pageChange` | `TablePagination` | Emitted when pagination changes |
| `sortChange` | `TableSort` | Emitted when sorting changes |
| `searchChange` | `string` | Emitted when search value changes |
| `rowClick` | `T` | Emitted when a row is clicked |
| `selectionChange` | `T[]` | Emitted when selection changes |

## Data Table Service

Use `DataTableService` for managing table state:

```typescript
import { DataTableService } from '@shared';

constructor(private tableService: DataTableService) {}

// Subscribe to changes
this.tableService.pagination$.subscribe(pagination => {
  // Handle pagination
});

// Build query params
const params = this.tableService.buildQueryParams({
  active: true,
  category: 'tech'
});
```

## Examples

See `data-table.example.ts` for a complete example with all features.

