function BandItem() {
  return (
    <span className="kb-item">
      GET FOUND
      <span className="kb-sep"> · </span>
      GET TRUSTED
      <span className="kb-sep"> · </span>
      GET NAMED
      <span className="kb-sep"> · </span>
      BOOK THE VISIBILITY AUDIT
      <span className="kb-sep"> · </span>
    </span>
  );
}

export default function KineticBand() {
  return (
    <div className="kinetic-band" aria-hidden="true">
      <div className="kb-inner">
        <BandItem />
        <BandItem />
        <BandItem />
        <BandItem />
        <BandItem />
        <BandItem />
      </div>
    </div>
  );
}
