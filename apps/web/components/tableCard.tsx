// app/payments/page.tsx
import { DataTable } from "@workspace/ui/components/main/table/dataTable"
import { columns, Payment } from "@workspace/ui/components/main/table/column"

const data: Payment[] = [
  { id: "1", status: "Success",    email: "ken99@example.com",      amount: 316 },
  { id: "2", status: "Success",    email: "abe45@example.com",       amount: 242 },
  { id: "3", status: "Processing", email: "monserrat44@example.com", amount: 837 },
  { id: "4", status: "Success",    email: "silas22@example.com",     amount: 874 },
  { id: "5", status: "Failed",     email: "carmella@example.com",    amount: 721 },
]

export default function TableCard() {
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}