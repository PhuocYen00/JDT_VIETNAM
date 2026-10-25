import { Info } from "lucide-react";

export default function SimulatedDataBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-800 flex items-center justify-center space-x-2">
      <Info className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
      <span>
        <strong>Dữ liệu mô phỏng:</strong> Hệ thống sử dụng bộ dữ liệu giả định phục vụ học tập, thực tập tốt nghiệp và kiểm thử; không phản ánh dữ liệu vận hành thực tế của Công ty TNHH JDT Việt Nam.
      </span>
    </div>
  );
}
