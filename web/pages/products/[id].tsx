import { GetServerSideProps } from 'next';

/**
 * Public /products/[id] removed — redirect to buyer product detail.
 * next.config redirects handle this; this page is a fallback.
 */
export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  const id = params?.id;
  if (!id) return { notFound: true };
  const destination = `/buyer/products/${id}`;
  res.writeHead(307, { Location: destination });
  res.end();
  return { props: {} };
};

export default function ProductDetailRedirect() {
  return null;
}
