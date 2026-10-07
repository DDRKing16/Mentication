/** Purposeful practice objects. Instruction and user evidence stay in accessible HTML. */
export default function PracticeIllustration({ kind = 'path', className = '' }) {
  const drawings = {
    water: <><path className="pi-wash" d="M97 56h108l-13 91H110Z"/><path d="M94 35h113l-16 115h-80Z"/><path d="M104 82q23-14 47 0t48 0M118 117h62"/><path className="pi-solid" d="M151 17q-16 21 0 25q16-4 0-25"/></>,
    light: <><path className="pi-wash" d="m143 42 64-24v128l-64-24Z"/><path d="M94 150V27h111v123M149 27v123M94 83h111M81 151h139"/><path d="m218 32 10-8m-8 40h17m-18 27 11 8"/><path className="pi-solid" d="M154 47h42v30h-42Z"/></>,
    path: <><path d="M52 153q80-32 72-57t66-61"/><ellipse className="pi-wash" cx="89" cy="133" rx="28" ry="10"/><ellipse className="pi-wash" cx="132" cy="100" rx="23" ry="9"/><ellipse className="pi-wash" cx="147" cy="66" rx="19" ry="8"/><path d="M190 56V18l27 11-27 10"/></>,
    evidence: <><path className="pi-wash" d="M46 43h95v111H46Z"/><path d="M46 43h95v111H46ZM160 25h94v111h-94ZM65 70h56M65 89h40M65 111h51M178 55h57M178 75h34M178 95h48"/><path className="pi-solid" d="m137 114 14-8 13 8-13 8Z"/></>,
    plan: <><path className="pi-wash" d="m42 62 63-20 89 17 63-23v106l-63 21-89-18-63 19Z"/><path d="m42 62 63-20 89 17 63-23v106l-63 21-89-18-63 19ZM105 42v103M194 59v104"/><path strokeDasharray="4 6" d="M70 129q55-102 101-33t58-20"/><circle className="pi-solid" cx="70" cy="129" r="5"/><circle cx="229" cy="76" r="8"/></>,
    body: <><path d="M68 149q29-32 36-55t42-34t74-34"/><circle className="pi-wash" cx="68" cy="149" r="17"/><circle className="pi-wash" cx="114" cy="79" r="24"/><circle className="pi-wash" cx="220" cy="26" r="15"/><path d="M103 75h22m-17 8h13M60 151h17M215 28h11"/></>,
    letter: <><path className="pi-wash" d="M51 60h198v95H51Z"/><path d="M51 60h198v95H51Zm0 0 99 62 99-62M51 155l68-52m62 0 68 52"/><path d="M98 87V25h106v62M117 46h68M117 60h47"/><circle className="pi-solid" cx="237" cy="32" r="9"/></>,
  };
  return <svg className={`practice-illustration practice-illustration--${kind} ${className}`} viewBox="0 0 300 180" fill="none" aria-hidden="true"><ellipse className="pi-ground" cx="150" cy="156" rx="122" ry="13"/>{drawings[kind] || drawings.path}</svg>;
}
