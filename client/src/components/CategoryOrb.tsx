import { useRef, useState } from "react";
import { Link } from "wouter";
import { Cog } from "lucide-react";

interface CategoryOrbProps {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
}

export default function CategoryOrb({ id, name, icon }: CategoryOrbProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [imgShift, setImgShift] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function onMouseMove(e: React.MouseEvent) {
    const el = shellRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -14, y: dx * 14 });
    setImgShift({ x: dx * 10, y: dy * 10 });
  }

  function onMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setImgShift({ x: 0, y: 0 });
    setIsHovered(false);
  }

  return (
    <Link href={`/products?categoryId=${id}`} className="no-underline">
      <div
        className="category-orb-wrapper"
        onMouseMove={onMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={onMouseLeave}
      >
        <div
          ref={shellRef}
          className="orb-shell"
          style={{
            transform: `perspective(500px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${isHovered ? "scale(1.08)" : "scale(1)"}`,
          }}
        >
          {icon ? (
            <img
              src={`/icons/${icon}.png`}
              alt={name}
              className="orb-img"
              style={{
                transform: `translate(${imgShift.x}px, ${imgShift.y}px)`,
              }}
            />
          ) : (
            <Cog className="w-10 h-10 text-primary/60 relative z-10" />
          )}
        </div>
        <span className="orb-label">{name}</span>
      </div>
    </Link>
  );
}
