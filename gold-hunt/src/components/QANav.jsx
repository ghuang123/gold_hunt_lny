function QANav({ disabled, onBack, onNext }) {
  return (
    <div className="qa-nav">
      <button className="qa-btn" type="button" disabled={disabled} title="back" onClick={onBack}>
        ←
      </button>
      <button className="qa-btn" type="button" disabled={disabled} title="skip" onClick={onNext}>
        →
      </button>
    </div>
  )
}

export default QANav
