
const OrderManagementSkeleton = () => (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white dark:bg-[#1f1812] border border-gray-200 dark:border-white/10">
      <thead>
        <tr className="bg-gray-100 dark:bg-[#2a211a]">
          <th className="py-2 px-4 border-b">ID Order</th>
          <th className="py-2 px-4 border-b">Customer</th>
          <th className="py-2 px-4 border-b">Total</th>
          <th className="py-2 px-4 border-b">Status</th>
          <th className="py-2 px-4 border-b">Tanggal</th>
          <th className="py-2 px-4 border-b">Aksi</th>
        </tr>
      </thead>
      <tbody>
        {[...Array(5)].map((_, i) => (
          <tr key={i} className="animate-pulse">
            <td className="py-2 px-4 border-b"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
            <td className="py-2 px-4 border-b"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
            <td className="py-2 px-4 border-b"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
            <td className="py-2 px-4 border-b"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
            <td className="py-2 px-4 border-b"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
            <td className="py-2 px-4 border-b">
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default OrderManagementSkeleton;
