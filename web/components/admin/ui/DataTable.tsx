import { HTMLAttributes, TableHTMLAttributes } from 'react';
import clsx from 'clsx';

export function DataTableContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'overflow-x-auto overflow-y-visible rounded-xl border border-gray-200 bg-white shadow-sm',
        className
      )}
      {...props}
    />
  );
}

export function DataTable(props: TableHTMLAttributes<HTMLTableElement>) {
  const { className, ...rest } = props;
  return (
    <table
      className={clsx(
        'w-max min-w-full divide-y divide-gray-100 text-left text-sm text-gray-800',
        className
      )}
      {...rest}
    />
  );
}

type DataTableHeadProps = HTMLAttributes<HTMLTableSectionElement> & {
  columns?: string[];
};

export function DataTableHead(props: DataTableHeadProps) {
  const { className, columns, children, ...rest } = props;
  return (
    <thead
      className={clsx(
        'bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500',
        className
      )}
      {...rest}
    >
      {columns ? (
        <tr>
          {columns.map((label, index) => (
            <th
              key={`${label}-${index}`}
              className={clsx(
                'px-6 py-4',
                index === columns.length - 1 ? 'text-right text-gray-500' : 'text-left text-gray-700'
              )}
            >
              {label}
            </th>
          ))}
        </tr>
      ) : (
        children
      )}
    </thead>
  );
}

export function DataTableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  const { className, ...rest } = props;
  return (
    <tbody
      className={clsx('divide-y divide-gray-100 text-sm text-gray-800 [&_tr:hover]:bg-orange-50', className)}
      {...rest}
    />
  );
}

export function DataTableCell(props: HTMLAttributes<HTMLTableCellElement>) {
  const { className, ...rest } = props;
  return <td className={clsx('px-6 py-4 align-middle', className)} {...rest} />;
}
