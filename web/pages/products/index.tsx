import { GetServerSideProps } from 'next';

/**
 * Public /products list removed — redirect to buyer products.
 * next.config redirects handle this; this page is a fallback.
 */
export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  const queryString = new URLSearchParams(query as Record<string, string>).toString();
  const destination = `/buyer/products${queryString ? `?${queryString}` : ''}`;
  res.writeHead(307, { Location: destination });
  res.end();
  return { props: {} };
};

export default function ProductsRedirect() {
  return null;
}
