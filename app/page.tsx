import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Excalidraw
const DrawingCanvas = dynamic(
  () => import("@/components/canvas/DrawingCanvas"),
  { ssr: false },
);

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <DrawingCanvas />
    </main>
  );
}
