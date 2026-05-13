import { TableDataView } from "@/components/TableDataView";

export default async function TablePage({
  params,
}: {
  params: Promise<{ tableName: string }>;
}) {
  const { tableName } = await params;
  return <TableDataView tableName={decodeURIComponent(tableName)} />;
}
