export default function Loader({text = "Cargando..."}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/30">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-b-4 border-cyan-400 mb-4"></div>
      <span className="text-lg font-semibold text-blue-600 drop-shadow">
        {text}
      </span>
    </div>
  );
}
