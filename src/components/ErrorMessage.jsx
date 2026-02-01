import React from "react";
import { AlertCircle } from "lucide-react";

const ErrorMessage = ({ error }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-semibold">Error</p>
        <p className="text-sm opacity-90">{error}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
