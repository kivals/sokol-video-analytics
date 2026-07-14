"use client";

import { useEffect, useState } from "react";
import CameraTile from "@/components/CameraTile";
import type { Camera } from "@/lib/types";

export default function Home() {
  const [cameras, setCameras] = useState<Camera[]>([]);

  useEffect(() => {
    fetch("/api/cameras")
      .then((res) => res.json())
      .then((data) => setCameras(data.cameras))
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4 p-6">
      {cameras.map((camera) => (
        <CameraTile key={camera.id} camera={camera} />
      ))}
    </div>
  );
}
