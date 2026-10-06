export default function ThoughtEvidence({ support, against }) {
  const rows = [['Details I kept', support], ['Details or unknowns alongside it', against]]
    .map(([label, values]) => ({label, values:(Array.isArray(values)?values:[]).filter(value=>typeof value==='string' && value.trim())}))
    .filter(row=>row.values.length);
  if (!rows.length) return null;
  return <details className="tof-details my-3"><summary className="min-h-11 cursor-pointer">The details I kept</summary><dl className="thought-evidence">{rows.map(row=><div key={row.label} className="my-3"><dt className="text-sm font-medium">{row.label}</dt><dd className="mt-2"><ul className="list-disc pl-5 space-y-2">{row.values.map((value,index)=><li key={index} className="whitespace-pre-wrap break-words">{value}</li>)}</ul></dd></div>)}</dl></details>;
}
