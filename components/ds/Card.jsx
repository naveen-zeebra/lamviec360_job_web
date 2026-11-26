"use client";

export default function Card({ children, className = "", hoverable = false, style, ...rest }) {
  return (
    <div
      style={style}
      className={[
        "rounded-lg border border-line bg-card p-5 shadow-sm",
        "transition-[box-shadow,transform] duration-[180ms]",
        hoverable ? "cursor-pointer hover:shadow-md" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
