import { toHindiDigits } from "@/lib/utils";

interface PaymentInfoProps {
  totalPrice: number;
  amountPaid: number;
  paymentStatus: string;
}

export default function PaymentInfo({
  totalPrice,
  amountPaid,
  paymentStatus,
}: PaymentInfoProps) {
  const remainingAmount = totalPrice - amountPaid;

  return (
    <div className="mb-8 grid grid-cols-3 gap-6 px-12 sm:mb-5 sm:grid-cols-1 sm:gap-4 sm:px-6 md:mb-6 md:gap-5 md:px-8">
      {/* Total Price */}
      <div className="rounded-xl bg-purple-50 p-6 sm:p-4 md:p-5">
        <p className="mb-2 text-xl font-bold text-purple-600 sm:text-base md:text-lg">
          السعر الإجمالي
        </p>
        <p className="font-medad text-3xl text-purple-700 sm:text-xl md:text-2xl">
          {toHindiDigits(totalPrice)} جنيه
        </p>
      </div>

      {/* Amount Paid */}
      <div className="rounded-xl bg-green-50 p-6 sm:p-4 md:p-5">
        <p className="mb-2 text-xl font-bold text-green-600 sm:text-base md:text-lg">
          المبلغ المدفوع
        </p>
        <p className="font-medad text-3xl text-green-700 sm:text-xl md:text-2xl">
          {toHindiDigits(amountPaid)} جنيه
        </p>
      </div>

      {/* Remaining Amount */}
      {paymentStatus !== "paid" && (
        <div className="rounded-xl bg-red-50 p-6 sm:p-4 md:p-5">
          <p className="mb-2 text-xl font-bold text-red-600 sm:text-base md:text-lg">
            المبلغ المتبقي
          </p>
          <p className="font-medad text-3xl text-red-700 sm:text-xl md:text-2xl">
            {toHindiDigits(remainingAmount)} جنيه
          </p>
        </div>
      )}
    </div>
  );
}
