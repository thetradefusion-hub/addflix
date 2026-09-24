export default function QrCode({ className = "" }) {
  const cells = [
    "1111111001001111111",
    "1000001011101000001",
    "1011101010001011101",
    "1011101001101011101",
    "1011101010101011101",
    "1000001011001000001",
    "1111111010101111111",
    "0000000010100000000",
    "1101101110010110110",
    "0100100001111010010",
    "1110010110100101110",
    "0011101001011011001",
    "1101011110000110111",
    "0000000010110101010",
    "1111111011010111011",
    "1000001010001000101",
    "1011101001111010111",
    "1011101010100101001",
    "1111111001011110111",
  ];
  return (
    <div className={`relative grid aspect-square w-full grid-cols-[repeat(19,1fr)] gap-px bg-white p-2 ${className}`} aria-hidden="true">
      {cells.flatMap((row, y) =>
        row.split("").map((bit, x) => <span key={`${y}-${x}`} className={bit === "1" ? "bg-[#111]" : "bg-white"} />)
      )}
      <span className="pointer-events-none absolute inset-0 m-auto grid h-8 w-8 place-items-center rounded-md bg-[#e10600] text-[10px] font-black text-white">▶</span>
    </div>
  );
}
