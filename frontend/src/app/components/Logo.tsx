import { Droplet } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-3 px-6 py-5">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
        <Droplet className="w-6 h-6 text-white" fill="currentColor" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-lg text-gray-900">Arroyyan99</span>
        <span className="text-xs text-gray-500">POS & Distribusi</span>
      </div>
    </div>
  );
}
