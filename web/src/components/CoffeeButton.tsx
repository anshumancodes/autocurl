import Image from "next/image";

export default function CoffeeButton() {
  return (
    <a
      href="https://www.buymeacoffee.com/anshumancdx"
      target="_blank"
      rel="noreferrer"
      aria-label="Buy me a coffee"
      title="Buy me a coffee"
      className="press fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-40 flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-line bg-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.12),0_10px_24px_-10px_rgba(0,0,0,0.6)] transition-[transform,filter] duration-200 hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0 active:scale-95"
    >
      <Image
        src="/buy-me-a-coffee.png"
        alt=""
        width={30}
        height={30}
        className="h-7 w-7 sm:h-7.5 sm:w-7.5"
      />
    </a>
  );
}
