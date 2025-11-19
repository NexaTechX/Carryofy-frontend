import { HTMLAttributes, TableHTMLAttributes } from 'react';
import clsx from 'clsx';

export function DataTableContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#111111] shadow-[0_18px_38px_-24px_rgba(0,0,0,0.6)]',
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
        'min-w-full divide-y divide-[#1f1f1f] text-left text-sm text-gray-200',
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
      className={clsx('bg-[#161616] text-xs font-semibold uppercase tracking-[0.16em] text-gray-500', className)}
      {...rest}
    >
      {columns ? (
        <tr>
          {columns.map((label, index) => (
            <th
              key={`${label}-${index}`}
              className={clsx(
                'px-6 py-4',
                index === columns.length - 1 ? 'text-right text-gray-500' : 'text-left text-white'
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
  return <tbody className={clsx('divide-y divide-[#1f1f1f] text-sm text-gray-300', className)} {...rest} />;
}

export function DataTableCell(props: HTMLAttributes<HTMLTableCellElement>) {
  const { className, ...rest } = props;
  return <td className={clsx('px-6 py-4 align-middle', className)} {...rest} />;
}


