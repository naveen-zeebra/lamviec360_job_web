export default function Avatar({ src, name = "", size = 40, shape = "circle" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const radius = shape === "circle" ? "50%" : "var(--radius-md)";
  const resolvedSrc =
    src && !src.startsWith("http") && !src.startsWith("data:") && !src.startsWith("blob:")
      ? `${process.env.NEXT_PUBLIC_LOCAL_API_TARGET || "http://localhost:8001"}${src.startsWith("/") ? src : `/${src}`}`
      : src;

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={name}
        className="border border-line object-cover"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center bg-blue-100 font-body font-bold text-blue-700"
      style={{ width: size, height: size, borderRadius: radius, fontSize: size * 0.38 }}
    >
      {initials || "?"}
    </div>
  );
}
